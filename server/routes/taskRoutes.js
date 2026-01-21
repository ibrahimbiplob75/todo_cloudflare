import * as taskService from '../services/taskService.js';
import { extractTokenFromRequest, verifyToken } from '../services/authService.js';

/**
 * Task Routes Handler
 * Handles all task-related endpoints
 */
export async function handleTaskRoutes(request, prisma, corsHeaders, env = {}) {
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

	// GET /task - List all tasks (with optional filters)
	if (pathname === "/task" && method === 'GET') {
		try {
			const userId = await getUserId();
			const searchParams = url.searchParams;
			
			// Build filters from query parameters
			const filters = {};
			
			if (searchParams.has('project_id')) {
				filters.projectId = parseInt(searchParams.get('project_id'));
			}
			
			if (searchParams.has('assigned_to')) {
				filters.assignedTo = parseInt(searchParams.get('assigned_to'));
			} else if (userId) {
				// If authenticated, default to user's tasks if no filter specified
				filters.assignedTo = userId;
			}
			
			if (searchParams.has('task_status')) {
				filters.taskStatus = searchParams.get('task_status');
			}
			
			if (searchParams.has('priority')) {
				filters.priority = searchParams.get('priority');
			}
			
			if (searchParams.has('parent_task_id')) {
				const parentTaskId = searchParams.get('parent_task_id');
				filters.parentTaskId = parentTaskId === 'null' ? null : parseInt(parentTaskId);
			}
			
			const result = await taskService.listTasks(prisma, filters);
			
			if (result.success) {
				return Response.json({ tasks: result.data }, { headers: corsHeaders });
			}
			
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Task list error:', error);
			return Response.json(
				{ error: 'Failed to fetch tasks' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// POST /task/fast-create - Fast create task (only project_id and title)
	if (pathname === "/task/fast-create" && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}

			const body = await request.json();
			const { projectId, title } = body;

			// Validation
			if (!projectId || !title) {
				return Response.json(
					{ error: 'Project ID and title are required' },
					{ status: 400, headers: corsHeaders }
				);
			}

			// Create task with minimal data
			const result = await taskService.createTask(prisma, {
				title,
				projectId: parseInt(projectId),
				assignedTo: userId,
				priority: 'mid',
				taskStatus: 'pending',
			});
			
			if (result.success) {
				return Response.json(
					{ task: result.data },
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

	// POST /task/create - Create new task
	if (pathname === "/task/create" && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}

			const body = await request.json();
			
			// Set created_by implicitly (can be added to schema later)
			// For now, use assignedTo if not provided
			if (!body.assignedTo) {
				body.assignedTo = userId;
			}
			
			const result = await taskService.createTask(prisma, body);
			
			if (result.success) {
				return Response.json(
					{ task: result.data },
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

	// GET /task/{id} - Get single task
	const getTaskMatch = pathname.match(/^\/task\/(\d+)$/);
	if (getTaskMatch && method === 'GET') {
		const taskId = getTaskMatch[1];
		const result = await taskService.getTaskById(prisma, taskId);
		
		if (result.success) {
			return Response.json({ task: result.data }, { headers: corsHeaders });
		}
		
		return Response.json(
			{ error: result.error },
			{ status: result.statusCode || 500, headers: corsHeaders }
		);
	}

	// GET /task/{id}/subtasks - Get all subtasks for a task
	const getSubtasksMatch = pathname.match(/^\/task\/(\d+)\/subtasks$/);
	if (getSubtasksMatch && method === 'GET') {
		try {
			const taskId = getSubtasksMatch[1];
			const result = await taskService.getSubtasks(prisma, taskId);
			
			if (result.success) {
				return Response.json({ subtasks: result.data }, { headers: corsHeaders });
			}
			
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Get subtasks error:', error);
			return Response.json(
				{ error: 'Failed to fetch subtasks' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// POST /task/{id}/update - Update single task
	const updateTaskMatch = pathname.match(/^\/task\/(\d+)\/update$/);
	if (updateTaskMatch && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}

			const taskId = updateTaskMatch[1];
			const body = await request.json();
			
			// Optional: Verify user owns the task or is assigned to it
			const existingTask = await prisma.task.findUnique({
				where: { id: parseInt(taskId) },
			});

			if (!existingTask) {
				return Response.json(
					{ error: 'Task not found' },
					{ status: 404, headers: corsHeaders }
				);
			}

			// Allow update if user is assigned to the task
			// You can add stricter ownership checks if needed
			if (existingTask.assignedTo && existingTask.assignedTo !== userId) {
				return Response.json(
					{ error: 'Unauthorized: You can only update tasks assigned to you' },
					{ status: 403, headers: corsHeaders }
				);
			}

			const result = await taskService.updateTask(prisma, taskId, body);
			
			if (result.success) {
				return Response.json(
					{ task: result.data },
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

	// POST /task/{id}/delete - Delete single task
	const deleteTaskMatch = pathname.match(/^\/task\/(\d+)\/delete$/);
	if (deleteTaskMatch && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}

			const taskId = deleteTaskMatch[1];
			
			// Verify user owns the task or is assigned to it
			const existingTask = await prisma.task.findUnique({
				where: { id: parseInt(taskId) },
			});

			if (!existingTask) {
				return Response.json(
					{ error: 'Task not found' },
					{ status: 404, headers: corsHeaders }
				);
			}

			if (existingTask.assignedTo && existingTask.assignedTo !== userId) {
				return Response.json(
					{ error: 'Unauthorized: You can only delete tasks assigned to you' },
					{ status: 403, headers: corsHeaders }
				);
			}

			const result = await taskService.deleteTask(prisma, taskId);
			
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
			console.error('Delete task error:', error);
			return Response.json(
				{ error: 'Failed to delete task' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// Return null if route doesn't match
	return null;
}
