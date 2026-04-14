import { SignJWT, jwtVerify } from 'jose';

const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION_TIME = '24h';

/**
 * Get JWT secret from environment or use default
 * @param {Object} env - Environment variables from Cloudflare Workers
 * @returns {Uint8Array} JWT secret
 */
function getJwtSecret(env) {
	const secret = env?.JWT_SECRET || 'your-secret-key-change-in-production';
	return new TextEncoder().encode(secret);
}

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id, email, name
 * @param {Object} env - Environment variables from Cloudflare Workers
 * @returns {Promise<string>} JWT token
 */
export async function generateToken(user, env = {}) {
	const secret = getJwtSecret(env);
	const token = await new SignJWT({
		userId: user.id,
		email: user.email,
		name: user.name,
		role: user.role || 'user',
	})
		.setProtectedHeader({ alg: JWT_ALGORITHM })
		.setIssuedAt()
		.setExpirationTime(JWT_EXPIRATION_TIME)
		.sign(secret);

	return token;
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {Object} env - Environment variables from Cloudflare Workers
 * @returns {Promise<Object|null>} Decoded token payload or null if invalid
 */
export async function verifyToken(token, env = {}) {
	try {
		const secret = getJwtSecret(env);
		const { payload } = await jwtVerify(token, secret, {
			algorithms: [JWT_ALGORITHM],
		});
		return payload;
	} catch (error) {
		console.error('Token verification failed');
		return null;
	}
}

/**
 * Get user with role support and fallback for older DBs without role column.
 * @param {PrismaClient} prisma
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
async function findUserWithRoleFallback(prisma, userId) {
	try {
		return await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	} catch (error) {
		const message = error?.message || '';
		if (
			message.includes('role') &&
			(
				message.includes('does not exist') ||
				message.includes('Unknown column') ||
				message.includes('no such column') ||
				message.includes('Unknown field')
			)
		) {
			const legacyUser = await prisma.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					name: true,
					email: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (!legacyUser) return null;
			return { ...legacyUser, role: 'user' };
		}

		throw error;
	}
}

/**
 * Authenticate user with email and password
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} env - Environment variables from Cloudflare Workers
 * @returns {Promise<Object>} Result object with success status and user/token or error
 */
export async function login(prisma, email, password, env = {}) {
	try {
		// Validation
		if (!email || !password) {
			return {
				success: false,
				error: 'Email and password are required',
				statusCode: 400,
			};
		}

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return {
				success: false,
				error: 'Invalid email or password',
				statusCode: 401,
			};
		}

		// Verify password
		if (user.password !== password) {
			return {
				success: false,
				error: 'Invalid email or password',
				statusCode: 401,
			};
		}

		// Generate JWT token
		const token = await generateToken({
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		}, env);

		return {
			success: true,
			data: {
				token,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				},
			},
		};
	} catch (error) {
		console.error('Login error');
		return {
			success: false,
			error: 'Login failed',
			statusCode: 500,
		};
	}
}

/**
 * Get authenticated user from token
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {string} token - JWT token
 * @param {Object} env - Environment variables from Cloudflare Workers
 * @returns {Promise<Object>} Result object with success status and user or error
 */
export async function getAuthenticatedUser(prisma, token, env = {}) {
	try {
		// Verify token
		const payload = await verifyToken(token, env);
		
		if (!payload || !payload.userId) {
			return {
				success: false,
				error: 'Invalid or expired token',
				statusCode: 401,
			};
		}

		// Get user from database
		const user = await findUserWithRoleFallback(prisma, payload.userId);

		if (!user) {
			return {
				success: false,
				error: 'User not found',
				statusCode: 404,
			};
		}

		return {
			success: true,
			data: user,
		};
	} catch (error) {
		console.error('Get authenticated user error');
		return {
			success: false,
			error: 'Authentication failed',
			statusCode: 401,
		};
	}
}

/**
 * Extract token from Authorization header
 * @param {Request} request - HTTP request object
 * @returns {string|null} Token or null if not found
 */
export function extractTokenFromRequest(request) {
	const authHeader = request.headers.get('Authorization');
	
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null;
	}

	return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Resolve authenticated user from request token
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Request} request - HTTP request object
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} { success, data, error, statusCode }
 */
export async function getAuthUserFromRequest(prisma, request, env = {}) {
	try {
		const token = extractTokenFromRequest(request);
		if (!token) {
			return { success: false, error: 'Authentication required', statusCode: 401 };
		}

		const payload = await verifyToken(token, env);
		if (!payload?.userId) {
			return { success: false, error: 'Invalid or expired token', statusCode: 401 };
		}

		const user = await findUserWithRoleFallback(prisma, payload.userId);

		if (!user) {
			return { success: false, error: 'User not found', statusCode: 404 };
		}

		return {
			success: true,
			data: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role || 'user',
			},
		};
	} catch (error) {
		console.error('Get auth user from request error');
		return { success: false, error: 'Authentication failed', statusCode: 401 };
	}
}
