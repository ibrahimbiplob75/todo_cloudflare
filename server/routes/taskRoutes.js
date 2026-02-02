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

	// GET /task/stats - Task progress (total, incomplete)
	if (pathname === "/task/stats" && method === 'GET') {
		try {
			const userId = await getUserId();
			const result = await taskService.getTaskProgressStats(prisma, userId);

			if (result.success) {
				return Response.json(result.data, { headers: corsHeaders });
			}

			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Task stats error:', error);
			return Response.json(
				{ error: 'Failed to fetch task stats' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// GET /task/analytics - Task counts by status
	if (pathname === "/task/analytics" && method === 'GET') {
		try {
			const userId = await getUserId();
			const result = await taskService.getTaskStatusAnalytics(prisma, userId);

			if (result.success) {
				return Response.json({ statuses: result.data }, { headers: corsHeaders });
			}

			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Task analytics error:', error);
			return Response.json(
				{ error: 'Failed to fetch task analytics' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// GET /task/calendar-years - Unique years for calendar filter
	if (pathname === "/task/calendar-years" && method === 'GET') {
		try {
			const userId = await getUserId();
			const result = await taskService.getCalendarYears(prisma, userId);
			if (result.success) {
				return Response.json({ years: result.data }, { headers: corsHeaders });
			}
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Calendar years error:', error);
			return Response.json(
				{ error: 'Failed to fetch calendar years' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// GET /task/calendar?year=&month= - Completed task count per day
	if (pathname === "/task/calendar" && method === 'GET') {
		try {
			const userId = await getUserId();
			const searchParams = url.searchParams;
			const year = parseInt(searchParams.get('year'), 10) || new Date().getFullYear();
			const month = parseInt(searchParams.get('month'), 10) || new Date().getMonth() + 1;
			const result = await taskService.getCalendarMonthData(prisma, year, month, userId);
			if (result.success) {
				return Response.json(result.data, { headers: corsHeaders });
			}
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Calendar month error:', error);
			return Response.json(
				{ error: 'Failed to fetch calendar data' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// GET /kanban-tasks - Tasks grouped by status for Kanban board
	if (pathname === "/kanban-tasks" && method === 'GET') {
		try {
			const userId = await getUserId();
			const params = url.searchParams;
			const filters = {
				project_id: params.get('project_id') || null,
				meeting_id: params.get('meeting_id') || null,
				assignedTo: userId,
			};
			const result = await taskService.getKanbanTasks(prisma, filters);
			if (result.success) {
				return Response.json(result.data, { headers: corsHeaders });
			}
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Kanban tasks error:', error);
			return Response.json(
				{ error: 'Failed to fetch kanban tasks' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// PATCH /kanban-update-task - Update task serial/taskStatus for Kanban drag-drop
	if (pathname === "/kanban-update-task" && method === 'PATCH') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}
			const body = await request.json();
			const { task_id, serial, task_status } = body;
			if (!task_id) {
				return Response.json(
					{ error: 'task_id is required' },
					{ status: 400, headers: corsHeaders }
				);
			}
			const payload = {};
			if (serial != null) payload.serial = serial;
			if (task_status != null) payload.taskStatus = task_status;
			const result = await taskService.updateKanbanTask(prisma, task_id, payload);
			if (result.success) {
				return Response.json(result.data, { headers: corsHeaders });
			}
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Kanban update error:', error);
			return Response.json(
				{ error: 'Failed to update task' },
				{ status: 500, headers: corsHeaders }
			);
		}
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
			if (searchParams.has('project_meeting_id')) {
				filters.projectMeetingId = parseInt(searchParams.get('project_meeting_id'));
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

			if (searchParams.has('from_date')) filters.from_date = searchParams.get('from_date');
			if (searchParams.has('to_date')) filters.to_date = searchParams.get('to_date');
			if (searchParams.has('submission_date_from')) filters.submission_date_from = searchParams.get('submission_date_from');
			if (searchParams.has('submission_date_to')) filters.submission_date_to = searchParams.get('submission_date_to');
			if (searchParams.has('target_date_from')) filters.target_date_from = searchParams.get('target_date_from');
			if (searchParams.has('target_date_to')) filters.target_date_to = searchParams.get('target_date_to');
			if (searchParams.has('show_all')) {
				const v = searchParams.get('show_all');
				filters.show_all = v === '1' || v === 'true';
			}
			if (searchParams.has('is_today_tasks')) {
				const v = searchParams.get('is_today_tasks');
				filters.is_today_tasks = v === '1' || v === 'true';
			}
			if (searchParams.has('page')) filters.page = parseInt(searchParams.get('page'), 10) || 1;
			if (searchParams.has('per_page')) filters.per_page = parseInt(searchParams.get('per_page'), 10) || 20;

			const result = await taskService.listTasks(prisma, filters);

			if (!result.success) {
				return Response.json(
					{ error: result.error },
					{ status: result.statusCode || 500, headers: corsHeaders }
				);
			}

			const base = new URL(request.url);
			const path = `${base.origin}${base.pathname}`;
			const page = result.page;
			const lastPage = result.lastPage;
			const total = result.total;
			const perPage = result.per_page;

			function pageUrl(p) {
				const u = new URL(request.url);
				u.searchParams.set('page', String(p));
				return u.toString();
			}

			const links = [];
			links.push({
				url: page > 1 ? pageUrl(page - 1) : null,
				label: '&laquo; Previous',
				active: false,
			});
			for (let i = 1; i <= lastPage; i++) {
				links.push({
					url: pageUrl(i),
					label: String(i),
					active: i === page,
				});
			}
			links.push({
				url: page < lastPage ? pageUrl(page + 1) : null,
				label: 'Next &raquo;',
				active: false,
			});

			const payload = {
				current_page: page,
				data: result.data,
				first_page_url: pageUrl(1),
				from: result.from,
				last_page: lastPage,
				last_page_url: pageUrl(lastPage),
				links,
				next_page_url: page < lastPage ? pageUrl(page + 1) : null,
				path,
				per_page: perPage,
				prev_page_url: page > 1 ? pageUrl(page - 1) : null,
				to: result.to,
				total,
			};

			return Response.json(payload, { headers: corsHeaders });
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
			const { projectId, projectMeetingId, title } = body;

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
				projectMeetingId: projectMeetingId ? parseInt(projectMeetingId) : null,
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

	// POST /task/set-target-date - Set task target date (Add to Todo)
	if (pathname === "/task/set-target-date" && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}
			const body = await request.json().catch(() => ({}));
			const { task_id, target_date } = body;
			if (!task_id) {
				return Response.json(
					{ error: 'task_id is required' },
					{ status: 400, headers: corsHeaders }
				);
			}
			const result = await taskService.setTargetDate(prisma, task_id, target_date ?? null);
			if (result.success) {
				return Response.json({ task: result.data }, { headers: corsHeaders });
			}
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Set target date error:', error);
			return Response.json(
				{ error: 'Failed to set target date' },
				{ status: 500, headers: corsHeaders }
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
