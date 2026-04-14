import * as projectService from '../services/projectService.js';
import * as taskService from '../services/taskService.js';
import { getAuthUserFromRequest } from '../services/authService.js';

/**
 * Project Routes Handler
 * Handles all project-related endpoints
 */
export async function handleProjectRoutes(request, prisma, corsHeaders, env = {}) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	const method = request.method;
	let authCache = null;

	async function getAuthContext() {
		if (authCache) return authCache;
		authCache = await getAuthUserFromRequest(prisma, request, env);
		return authCache;
	}

	function isWatcher(auth) {
		return auth?.success && auth.data?.role === 'watcher';
	}

	async function requireAuth() {
		const auth = await getAuthContext();
		if (!auth.success) {
			return Response.json(
				{ error: auth.error },
				{ status: auth.statusCode || 401, headers: corsHeaders }
			);
		}
		return null;
	}

	async function requireWatcher() {
		const denied = await requireAuth();
		if (denied) return denied;
		const auth = await getAuthContext();
		if (!isWatcher(auth)) {
			return Response.json(
				{ error: 'Forbidden: watcher role required' },
				{ status: 403, headers: corsHeaders }
			);
		}
		return null;
	}

	// GET /project/analytics - Project task counts (incomplete/total) for active tasks
	if (pathname === "/project/analytics" && method === 'GET') {
		try {
			const denied = await requireAuth();
			if (denied) return denied;
			const auth = await getAuthContext();
			const userId = isWatcher(auth) ? null : auth.data.id;
			const result = await projectService.getProjectAnalytics(prisma, userId);

			if (result.success) {
				return Response.json({ projects: result.data }, { headers: corsHeaders });
			}

			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Project analytics error:', error);
			return Response.json(
				{ error: 'Failed to fetch project analytics' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// GET /project - List all projects (optional: filter by creator)
	if (pathname === "/project" && method === 'GET') {
		try {
			const denied = await requireAuth();
			if (denied) return denied;
			const result = await projectService.listProjects(prisma, null);
			
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
			const denied = await requireWatcher();
			if (denied) return denied;
			const auth = await getAuthContext();

			const body = await request.json();
			const result = await projectService.createProject(prisma, {
				...body,
				creator: auth.data.id, // Set creator from authenticated watcher
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

	// GET /project/{id}/tasks - Get project tasks for details page
	const projectTasksMatch = pathname.match(/^\/project\/(\d+)\/tasks$/);
	if (projectTasksMatch && method === 'GET') {
		try {
			const denied = await requireAuth();
			if (denied) return denied;
			const auth = await getAuthContext();
			const projectId = projectTasksMatch[1];
			const params = url.searchParams;
			const taskStatusParam = params.get('task_status');
			const taskStatus = taskStatusParam
				? taskStatusParam.split(',').map((s) => s.trim()).filter(Boolean)
				: [];
			const projectMeetingId = params.get('project_meeting_id');
			const filters = {
				task_status: taskStatus.length > 0 ? taskStatus : undefined,
				project_meeting_id: projectMeetingId || null,
				assigned_to: isWatcher(auth) ? null : auth.data.id,
				date_type: params.get('date_type') || 'submission_date',
				sort_by: params.get('sort_by') || 'date_type',
				sort_order: params.get('sort_order') || 'asc',
				from_date: params.get('from_date') || null,
				to_date: params.get('to_date') || null,
			};
			const result = await taskService.getProjectTasks(prisma, projectId, filters);
			if (result.success) {
				return Response.json({ tasks: result.data }, { headers: corsHeaders });
			}
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Project tasks error:', error);
			return Response.json(
				{ error: 'Failed to fetch project tasks' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// GET /project/{id} - Get single project
	const getProjectMatch = pathname.match(/^\/project\/(\d+)$/);
	if (getProjectMatch && method === 'GET') {
		const denied = await requireAuth();
		if (denied) return denied;
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
			const denied = await requireWatcher();
			if (denied) return denied;

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
			const denied = await requireWatcher();
			if (denied) return denied;

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
