import * as projectService from '../services/projectService.js';
import { extractTokenFromRequest, verifyToken } from '../services/authService.js';

/**
 * Project Routes Handler
 * Handles all project-related endpoints
 */
export async function handleProjectRoutes(request, prisma, corsHeaders, env = {}) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	const method = request.method;

	// Helper function to get authenticated user ID
	async function getUserId() {
		const token = extractTokenFromRequest(request);
		if (!token) return null;
		
		const payload = await verifyToken(token, env);
		return payload?.userId || null;
	}

	// GET /project - List all projects (optional: filter by creator)
	if (pathname === "/project" && method === 'GET') {
		try {
			const userId = await getUserId();
			// If authenticated, filter by user's projects. Otherwise show all.
			const result = await projectService.listProjects(prisma, userId);
			
			if (result.success) {
				return Response.json({ projects: result.data }, { headers: corsHeaders });
			}
			
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Project list error:', error);
			return Response.json(
				{ error: 'Failed to fetch projects' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// POST /project/create - Create new project
	if (pathname === "/project/create" && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}

			const body = await request.json();
			const result = await projectService.createProject(prisma, {
				...body,
				creator: userId, // Set creator from authenticated user
			});
			
			if (result.success) {
				return Response.json(
					{ project: result.data },
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

	// GET /project/{id} - Get single project
	const getProjectMatch = pathname.match(/^\/project\/(\d+)$/);
	if (getProjectMatch && method === 'GET') {
		const projectId = getProjectMatch[1];
		const result = await projectService.getProjectById(prisma, projectId);
		
		if (result.success) {
			return Response.json({ project: result.data }, { headers: corsHeaders });
		}
		
		return Response.json(
			{ error: result.error },
			{ status: result.statusCode || 500, headers: corsHeaders }
		);
	}

	// POST /project/{id}/update - Update single project
	const updateProjectMatch = pathname.match(/^\/project\/(\d+)\/update$/);
	if (updateProjectMatch && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}

			const projectId = updateProjectMatch[1];
			const body = await request.json();
			
			// Verify user owns the project
			const existingProject = await prisma.project.findUnique({
				where: { id: parseInt(projectId) },
			});

			if (!existingProject) {
				return Response.json(
					{ error: 'Project not found' },
					{ status: 404, headers: corsHeaders }
				);
			}

			if (existingProject.creator !== userId) {
				return Response.json(
					{ error: 'Unauthorized: You can only update your own projects' },
					{ status: 403, headers: corsHeaders }
				);
			}

			const result = await projectService.updateProject(prisma, projectId, body);
			
			if (result.success) {
				return Response.json(
					{ project: result.data },
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

	// POST /project/{id}/delete - Delete single project
	const deleteProjectMatch = pathname.match(/^\/project\/(\d+)\/delete$/);
	if (deleteProjectMatch && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}

			const projectId = deleteProjectMatch[1];
			
			// Verify user owns the project
			const existingProject = await prisma.project.findUnique({
				where: { id: parseInt(projectId) },
			});

			if (!existingProject) {
				return Response.json(
					{ error: 'Project not found' },
					{ status: 404, headers: corsHeaders }
				);
			}

			if (existingProject.creator !== userId) {
				return Response.json(
					{ error: 'Unauthorized: You can only delete your own projects' },
					{ status: 403, headers: corsHeaders }
				);
			}

			const result = await projectService.deleteProject(prisma, projectId);
			
			if (result.success) {
				return Response.json(
					{ message: result.message },
					{ headers: corsHeaders }
				);
			}
			
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Delete project error:', error);
			return Response.json(
				{ error: 'Failed to delete project' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// Return null if route doesn't match
	return null;
}
