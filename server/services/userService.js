/**
 * User Service - Handles all user-related database operations
 */

/**
 * List all users
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Promise<Array>} Array of users (password excluded)
 */
export async function listUsers(prisma) {
	try {
		const users = await prisma.user.findMany({
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
				updatedAt: true,
			},
		});
		return { success: true, data: users };
	} catch (error) {
		console.error('Error listing users:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Get a single user by ID
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} id - User ID
 * @returns {Promise<Object>} User object (password excluded)
 */
export async function getUserById(prisma, id) {
	try {
		const userId = parseInt(id);
		if (isNaN(userId)) {
			return { success: false, error: 'Invalid user ID' };
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) {
			return { success: false, error: 'User not found', statusCode: 404 };
		}

		return { success: true, data: user };
	} catch (error) {
		console.error('Error getting user:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Create a new user
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Object} userData - User data (name, email, password)
 * @returns {Promise<Object>} Created user object (password excluded)
 */
export async function createUser(prisma, userData) {
	try {
		const { name, email, password } = userData;

		// Validation
		if (!name || !email || !password) {
			return { 
				success: false, 
				error: 'Name, email, and password are required',
				statusCode: 400 
			};
		}

		// Check if user with email already exists
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return { 
				success: false, 
				error: 'User with this email already exists',
				statusCode: 409 
			};
		}

		const user = await prisma.user.create({
			data: {
				name,
				email,
				password,
			},
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return { success: true, data: user, statusCode: 201 };
	} catch (error) {
		console.error('Error creating user:', error);
		
		// Handle unique constraint violations
		if (error.code === 'P2002') {
			return { 
				success: false, 
				error: 'User with this email already exists',
				statusCode: 409 
			};
		}

		return { success: false, error: error.message };
	}
}

/**
 * Update an existing user
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} id - User ID
 * @param {Object} userData - User data to update (name, email, password - all optional)
 * @returns {Promise<Object>} Updated user object (password excluded)
 */
export async function updateUser(prisma, id, userData) {
	try {
		const userId = parseInt(id);
		if (isNaN(userId)) {
			return { success: false, error: 'Invalid user ID', statusCode: 400 };
		}

		// Check if user exists
		const existingUser = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!existingUser) {
			return { success: false, error: 'User not found', statusCode: 404 };
		}

		// Prepare update data (only include fields that are provided)
		const updateData = {};
		if (userData.name !== undefined) updateData.name = userData.name;
		if (userData.email !== undefined) updateData.email = userData.email;
		if (userData.password !== undefined) updateData.password = userData.password;

		// If email is being updated, check if it's already taken
		if (updateData.email && updateData.email !== existingUser.email) {
			const emailExists = await prisma.user.findUnique({
				where: { email: updateData.email },
			});

			if (emailExists) {
				return { 
					success: false, 
					error: 'User with this email already exists',
					statusCode: 409 
				};
			}
		}

		const user = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return { success: true, data: user };
	} catch (error) {
		console.error('Error updating user:', error);

		// Handle unique constraint violations
		if (error.code === 'P2002') {
			return { 
				success: false, 
				error: 'User with this email already exists',
				statusCode: 409 
			};
		}

		// Handle not found
		if (error.code === 'P2025') {
			return { 
				success: false, 
				error: 'User not found',
				statusCode: 404 
			};
		}

		return { success: false, error: error.message };
	}
}
