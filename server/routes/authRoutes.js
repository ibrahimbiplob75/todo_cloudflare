import { login, getAuthenticatedUser, extractTokenFromRequest } from '../services/authService.js';

/**
 * Auth Routes Handler
 * Handles authentication-related endpoints
 */
export async function handleAuthRoutes(request, prisma, corsHeaders, env = {}) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	const method = request.method;

	// POST /auth/login - User login
	if (pathname === "/auth/login" && method === 'POST') {
		try {
			const body = await request.json();
			const { email, password } = body;

			const result = await login(prisma, email, password, env);

			if (result.success) {
				return Response.json(
					{
						message: 'Login successful',
						token: result.data.token,
						user: result.data.user,
					},
					{ status: 200, headers: corsHeaders }
				);
			}

			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 401, headers: corsHeaders }
			);
		} catch (error) {
			return Response.json(
				{ error: 'Invalid request body' },
				{ status: 400, headers: corsHeaders }
			);
		}
	}

	// GET /auth/profile - Get authenticated user profile
	if (pathname === "/auth/profile" && method === 'GET') {
		// Extract token from Authorization header
		const token = extractTokenFromRequest(request);

		if (!token) {
			return Response.json(
				{ error: 'Authorization token required' },
				{ status: 401, headers: corsHeaders }
			);
		}

		const result = await getAuthenticatedUser(prisma, token, env);

		if (result.success) {
			return Response.json(
				{ user: result.data },
				{ headers: corsHeaders }
			);
		}

		return Response.json(
			{ error: result.error },
			{ status: result.statusCode || 401, headers: corsHeaders }
		);
	}

	// Return null if route doesn't match
	return null;
}
