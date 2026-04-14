import * as userService from '../services/userService.js';
import { getAuthUserFromRequest } from '../services/authService.js';

/**
 * User Routes Handler
 * Handles all user-related endpoints
 */
export async function handleUserRoutes(request, prisma, corsHeaders, env = {}) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	const method = request.method;
	let authCache = null;

	async function getAuthUser() {
		if (authCache) return authCache;
		authCache = await getAuthUserFromRequest(prisma, request, env);
		return authCache;
	}

	async function requireWatcher() {
		const auth = await getAuthUser();
		if (!auth.success) {
			return Response.json(
				{ error: auth.error },
				{ status: auth.statusCode || 401, headers: corsHeaders }
			);
		}

		if (auth.data.role !== 'watcher') {
			return Response.json(
				{ error: 'Forbidden: watcher role required' },
				{ status: 403, headers: corsHeaders }
			);
		}

		return null;
	}

	// GET /user - List all users
	if (pathname === "/user" && method === 'GET') {
		const denied = await requireWatcher();
		if (denied) return denied;

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
		const denied = await requireWatcher();
		if (denied) return denied;

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
		const auth = await getAuthUser();
		if (!auth.success) {
			return Response.json(
				{ error: auth.error },
				{ status: auth.statusCode || 401, headers: corsHeaders }
			);
		}

		const requestedId = parseInt(userId, 10);
		if (auth.data.role !== 'watcher' && auth.data.id !== requestedId) {
			return Response.json(
				{ error: 'Forbidden: You can only view your own profile' },
				{ status: 403, headers: corsHeaders }
			);
		}

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
			const requestedId = parseInt(userId, 10);
			const auth = await getAuthUser();
			if (!auth.success) {
				return Response.json(
					{ error: auth.error },
					{ status: auth.statusCode || 401, headers: corsHeaders }
				);
			}

			if (auth.data.role !== 'watcher' && auth.data.id !== requestedId) {
				return Response.json(
					{ error: 'Forbidden: You can only update your own profile' },
					{ status: 403, headers: corsHeaders }
				);
			}

			const body = await request.json();

			if (auth.data.role !== 'watcher' && body.role !== undefined) {
				return Response.json(
					{ error: 'Forbidden: Only watcher can change roles' },
					{ status: 403, headers: corsHeaders }
				);
			}

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
				const denied = await requireWatcher();
				if (denied) return denied;

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
				const denied = await requireWatcher();
				if (denied) return denied;

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
