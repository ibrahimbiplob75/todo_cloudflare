import * as userService from '../services/userService.js';

/**
 * User Routes Handler
 * Handles all user-related endpoints
 */
export async function handleUserRoutes(request, prisma, corsHeaders) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	const method = request.method;

	// GET /user - List all users
	if (pathname === "/user" && method === 'GET') {
		const result = await userService.listUsers(prisma);
		if (result.success) {
			return Response.json({ users: result.data }, { headers: corsHeaders });
		}
		return Response.json(
			{ error: result.error },
			{ status: result.statusCode || 500, headers: corsHeaders }
		);
	}

	// POST /user/create - Create new user
	if (pathname === "/user/create" && method === 'POST') {
		try {
			const body = await request.json();
			const result = await userService.createUser(prisma, body);
			
			if (result.success) {
				return Response.json(
					{ user: result.data },
					{ status: result.statusCode || 201, headers: corsHeaders }
				);
			}
			
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			return Response.json(
				{ error: 'Invalid request body' },
				{ status: 400, headers: corsHeaders }
			);
		}
	}

	// GET /user/{id} - Get single user
	const getUserMatch = pathname.match(/^\/user\/(\d+)$/);
	if (getUserMatch && method === 'GET') {
		const userId = getUserMatch[1];
		const result = await userService.getUserById(prisma, userId);
		
		if (result.success) {
			return Response.json({ user: result.data }, { headers: corsHeaders });
		}
		
		return Response.json(
			{ error: result.error },
			{ status: result.statusCode || 500, headers: corsHeaders }
		);
	}

	// POST /user/{id}/update - Update single user
	const updateUserMatch = pathname.match(/^\/user\/(\d+)\/update$/);
	if (updateUserMatch && method === 'POST') {
		try {
			const userId = updateUserMatch[1];
			const body = await request.json();
			const result = await userService.updateUser(prisma, userId, body);
			
			if (result.success) {
				return Response.json(
					{ user: result.data },
					{ headers: corsHeaders }
				);
			}
			
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			return Response.json(
				{ error: 'Invalid request body' },
				{ status: 400, headers: corsHeaders }
			);
		}
	}

	// Legacy /api/users endpoint (kept for backward compatibility)
	if (pathname === "/api/users") {
		try {
			if (method === 'GET') {
				const result = await userService.listUsers(prisma);
				if (result.success) {
					return Response.json({ users: result.data }, { headers: corsHeaders });
				}
				return Response.json(
					{ error: result.error },
					{ status: 500, headers: corsHeaders }
				);
			}

			if (method === 'POST') {
				const body = await request.json();
				const result = await userService.createUser(prisma, body);
				if (result.success) {
					return Response.json(
						{ user: result.data },
						{ status: result.statusCode || 201, headers: corsHeaders }
					);
				}
				return Response.json(
					{ error: result.error },
					{ status: result.statusCode || 500, headers: corsHeaders }
				);
			}
		} catch (error) {
			console.error('Database error:', error);
			return Response.json(
				{ error: 'Database operation failed', details: error.message },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// Return null if route doesn't match
	return null;
}
