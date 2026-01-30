/**
 * Task Service - Handles all task-related database operations
 */

/**
 * Calculate duration in minutes between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Duration in minutes
 */
function calculateDuration(startDate, endDate) {
	if (!startDate || !endDate) return null;
	const diff = endDate.getTime() - startDate.getTime();
	return Math.floor(diff / (1000 * 60)); // Convert to minutes
}

/**
 * Get unique years from tasks (completion_date, submission_date) for calendar filter.
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} userId - Filter by assigned user
 * @returns {Promise<Object>} { success, data: number[] }
 */
export async function getCalendarYears(prisma, userId = null) {
	try {
		const where = { status: 1, parentTaskId: null };
		if (userId) where.assignedTo = userId;

		const tasks = await prisma.task.findMany({
			where,
			select: { completionDate: true, submissionDate: true },
		});

		const years = new Set();
		const now = new Date();
		years.add(now.getFullYear());
		for (const t of tasks) {
			if (t.completionDate) years.add(new Date(t.completionDate).getFullYear());
			if (t.submissionDate) years.add(new Date(t.submissionDate).getFullYear());
		}

		const data = [...years].sort((a, b) => a - b);
		return { success: true, data };
	} catch (error) {
		console.error('Error getting calendar years:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Get completed task count per day for a given month/year.
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} userId - Filter by assigned user
 * @returns {Promise<Object>} { success, data: { [day]: count } }
 */
export async function getCalendarMonthData(prisma, year, month, userId = null) {
	try {
		const start = new Date(year, month - 1, 1);
		const end = new Date(year, month, 0, 23, 59, 59, 999);

		const where = {
			status: 1,
			taskStatus: 'completed',
			completionDate: { gte: start, lte: end },
		};
		if (userId) where.assignedTo = userId;

		const tasks = await prisma.task.findMany({
			where,
			select: { completionDate: true },
		});

		const countByDay = new Map();
		for (const t of tasks) {
			if (t.completionDate) {
				const d = new Date(t.completionDate);
				const day = d.getDate();
				countByDay.set(day, (countByDay.get(day) || 0) + 1);
			}
		}

		const data = {};
		for (const [day, count] of countByDay) data[day] = count;
		return { success: true, data };
	} catch (error) {
		console.error('Error getting calendar month data:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Get start of ISO week (Monday) for a given date.
 */
function getStartOfISOWeek(d) {
	const date = new Date(d);
	const day = date.getDay();
	const diff = date.getDate() - (day === 0 ? 6 : day - 1);
	date.setDate(diff);
	date.setHours(0, 0, 0, 0);
	return date;
}

/**
 * Get task progress stats: total, incomplete, and completion counts by period.
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} userId - Filter by assigned user
 * @returns {Promise<Object>} { success, data: { total, incomplete, todayCompleted, thisWeekCompleted, thisMonthCompleted } }
 */
export async function getTaskProgressStats(prisma, userId = null) {
	try {
		const baseWhere = { status: 1, parentTaskId: null, taskStatus: 'completed' };
		if (userId) baseWhere.assignedTo = userId;

		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();

		const startOfToday = new Date(y, m, d);
		const endOfToday = new Date(y, m, d + 1);
		const startOfWeek = getStartOfISOWeek(now);
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 7);
		const startOfMonth = new Date(y, m, 1);
		const endOfMonth = new Date(y, m + 1, 1);

		const [tasks, todayCompleted, thisWeekCompleted, thisMonthCompleted] = await Promise.all([
			prisma.task.findMany({
				where: { status: 1, parentTaskId: null, ...(userId && { assignedTo: userId }) },
				select: { taskStatus: true },
			}),
			prisma.task.count({
				where: {
					...baseWhere,
					completionDate: { gte: startOfToday, lt: endOfToday },
				},
			}),
			prisma.task.count({
				where: {
					...baseWhere,
					completionDate: { gte: startOfWeek, lt: endOfWeek },
				},
			}),
			prisma.task.count({
				where: {
					...baseWhere,
					completionDate: { gte: startOfMonth, lt: endOfMonth },
				},
			}),
		]);

		const total = tasks.length;
		const incomplete = tasks.filter((t) => t.taskStatus !== 'completed').length;

		return {
			success: true,
			data: {
				total,
				incomplete,
				todayCompleted,
				thisWeekCompleted,
				thisMonthCompleted,
			},
		};
	} catch (error) {
		console.error('Error getting task progress stats:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Get task status analytics: count of tasks per status (pending, in_progress, completed, failed, hold).
 * Only counts active tasks (status=1).
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} userId - Filter by assigned user
 * @returns {Promise<Object>} { success, data: [{ status, label, count }] }
 */
export async function getTaskStatusAnalytics(prisma, userId = null) {
	try {
		const where = { status: 1, parentTaskId: null };
		if (userId) where.assignedTo = userId;

		const statuses = ['pending', 'in_progress', 'completed', 'failed', 'hold'];
		const labels = {
			pending: 'Pending',
			in_progress: 'In Progress',
			completed: 'Completed',
			failed: 'Failed',
			hold: 'Hold',
		};

		const tasks = await prisma.task.findMany({
			where,
			select: { taskStatus: true },
		});

		const countByStatus = new Map();
		for (const s of statuses) countByStatus.set(s, 0);
		for (const t of tasks) {
			if (statuses.includes(t.taskStatus)) {
				countByStatus.set(t.taskStatus, (countByStatus.get(t.taskStatus) || 0) + 1);
			}
		}

		const data = statuses.map((status) => ({
			status,
			label: labels[status],
			count: countByStatus.get(status) || 0,
		}));

		return { success: true, data };
	} catch (error) {
		console.error('Error getting task status analytics:', error);
		return { success: false, error: error.message };
	}
}

/**
 * List tasks with optional filters, pagination, and show_all.
 * When show_all is true, returns all matching tasks; otherwise 20 per page.
 *
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Object} filters - projectId, assignedTo, taskStatus, priority, parentTaskId, from_date, to_date, show_all, page, per_page
 * @returns {Promise<Object>} { success, data, total, page, per_page, lastPage, from, to } or { success: false, error }
 */
export async function listTasks(prisma, filters = {}) {
	try {
		const where = { status: 1 };

		if (filters.parentTaskId === undefined) {
			where.parentTaskId = null;
		} else if (filters.parentTaskId !== null) {
			where.parentTaskId = parseInt(filters.parentTaskId);
		}
		const projectId = filters.projectId;
		if (projectId !== undefined) where.projectId = projectId;
		if (filters.projectMeetingId != null && filters.projectMeetingId !== '') {
			const mid = parseInt(filters.projectMeetingId, 10);
			if (!isNaN(mid)) where.projectMeetingId = mid;
		}
		if (filters.assignedTo !== undefined) where.assignedTo = filters.assignedTo;
		if (filters.taskStatus !== undefined) where.taskStatus = filters.taskStatus;
		if (filters.priority !== undefined) where.priority = filters.priority;

		const hasDateRange = filters.from_date != null && filters.to_date != null &&
			String(filters.from_date).trim() !== '' && String(filters.to_date).trim() !== '';
		if (hasDateRange) {
			const fromStart = new Date(filters.from_date);
			fromStart.setHours(0, 0, 0, 0);
			const toEnd = new Date(filters.to_date);
			toEnd.setHours(23, 59, 59, 999);
			where.completionDate = { gte: fromStart, lte: toEnd };
		}

		const hasSubmissionDateRange = filters.submission_date_from != null && filters.submission_date_to != null &&
			String(filters.submission_date_from).trim() !== '' && String(filters.submission_date_to).trim() !== '';
		if (hasSubmissionDateRange) {
			const subFrom = new Date(filters.submission_date_from);
			subFrom.setHours(0, 0, 0, 0);
			const subTo = new Date(filters.submission_date_to);
			subTo.setHours(23, 59, 59, 999);
			where.submissionDate = { gte: subFrom, lte: subTo };
		}

		const orderBy = hasDateRange ? { submissionDate: 'asc' } : { createdAt: 'desc' };
		const showAll = filters.show_all === true || filters.show_all === '1' || filters.show_all === 1;
		const perPage = Math.max(1, parseInt(filters.per_page, 10) || 20);
		const page = Math.max(1, parseInt(filters.page, 10) || 1);

		let tasks;
		let total;

		if (showAll) {
			tasks = await prisma.task.findMany({
				where,
				orderBy,
				include: {
					subtasks: {
						select: { id: true, taskStatus: true },
					},
				},
			});
			total = tasks.length;
		} else {
			total = await prisma.task.count({ where });
			const skip = (page - 1) * perPage;
			tasks = await prisma.task.findMany({
				where,
				orderBy,
				skip,
				take: perPage,
				include: {
					subtasks: {
						select: { id: true, taskStatus: true },
					},
				},
			});
		}

		const projectIds = [...new Set(tasks.map(t => t.projectId).filter(Boolean))];
		const meetingIds = [...new Set(tasks.map(t => t.projectMeetingId).filter(Boolean))];
		const [projects, meetings] = await Promise.all([
			projectIds.length > 0
				? prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, title: true } })
				: [],
			meetingIds.length > 0
				? prisma.meeting.findMany({ where: { id: { in: meetingIds } }, select: { id: true, title: true } })
				: [],
		]);
		const projectById = new Map(projects.map(p => [p.id, p.title]));
		const meetingById = new Map(meetings.map(m => [m.id, m.title]));

		const tasksWithCounts = tasks.map(task => {
			const subtasks = task.subtasks || [];
			const completedSubtasks = subtasks.filter(st => st.taskStatus === 'completed').length;
			const incompletedSubtasks = subtasks.length - completedSubtasks;
			const completionPercent = subtasks.length > 0
				? Math.round((completedSubtasks / subtasks.length) * 100)
				: 0;
			return {
				...task,
				totalSubTasks: subtasks.length,
				completedSubTasks: completedSubtasks,
				incompletedSubTasks: incompletedSubtasks,
				completionPercent,
				projectName: task.projectId ? (projectById.get(task.projectId) ?? null) : null,
				meetingName: task.projectMeetingId ? (meetingById.get(task.projectMeetingId) ?? null) : null,
			};
		});

		const lastPage = showAll ? 1 : Math.max(1, Math.ceil(total / perPage));
		const from = total === 0 ? null : (page - 1) * perPage + 1;
		const to = total === 0 ? null : Math.min(page * perPage, total);

		return {
			success: true,
			data: tasksWithCounts,
			total,
			page: showAll ? 1 : page,
			per_page: perPage,
			lastPage,
			from,
			to,
		};
	} catch (error) {
		console.error('Error listing tasks:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Get project tasks for the project details page.
 * Returns tasks with subtasks, grouped by date (submission or completion) and meeting.
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} projectId - Project ID
 * @param {Object} filters - task_status (array), date_type, sort_by, sort_order, from_date, to_date
 * @returns {Promise<Object>} { success, data: tasks }
 */
export async function getProjectTasks(prisma, projectId, filters = {}) {
	try {
		const pid = parseInt(projectId, 10);
		if (isNaN(pid)) {
			return { success: false, error: 'Invalid project ID' };
		}

		const where = { status: 1, projectId: pid, parentTaskId: null };

		if (filters.task_status && Array.isArray(filters.task_status) && filters.task_status.length > 0) {
			where.taskStatus = { in: filters.task_status };
		}

		if (filters.project_meeting_id != null && filters.project_meeting_id !== '') {
			const mid = parseInt(filters.project_meeting_id, 10);
			if (!isNaN(mid)) where.projectMeetingId = mid;
		}

		const dateType = filters.date_type === 'completion_date' ? 'completionDate' : 'submissionDate';
		const dateField = dateType;

		const hasDateRange =
			filters.from_date != null &&
			filters.to_date != null &&
			String(filters.from_date).trim() !== '' &&
			String(filters.to_date).trim() !== '';

		if (hasDateRange) {
			const fromStart = new Date(filters.from_date);
			fromStart.setHours(0, 0, 0, 0);
			const toEnd = new Date(filters.to_date);
			toEnd.setHours(23, 59, 59, 999);
			where[dateField] = { gte: fromStart, lte: toEnd };
		} else {
			where[dateField] = { not: null };
		}

		const sortBy = filters.sort_by === 'id' ? 'id' : dateField;
		const sortOrder = filters.sort_order === 'desc' ? 'desc' : 'asc';

		const tasks = await prisma.task.findMany({
			where,
			orderBy: { [sortBy]: sortOrder },
			include: {
				subtasks: {
					orderBy: { id: 'asc' },
					select: {
						id: true,
						title: true,
						description: true,
						comment: true,
						taskStatus: true,
					},
				},
			},
		});

		const meetingIds = [...new Set(tasks.map((t) => t.projectMeetingId).filter(Boolean))];
		const meetings =
			meetingIds.length > 0
				? await prisma.meeting.findMany({
						where: { id: { in: meetingIds } },
						select: { id: true, title: true },
					})
				: [];
		const meetingById = new Map(meetings.map((m) => [m.id, m.title]));

		const data = tasks.map((task) => ({
			...task,
			meetingName: task.projectMeetingId ? meetingById.get(task.projectMeetingId) ?? null : null,
		}));

		return { success: true, data };
	} catch (error) {
		console.error('Error getting project tasks:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Get a single task by ID
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} id - Task ID
 * @returns {Promise<Object>} Task object
 */
export async function getTaskById(prisma, id) {
	try {
		const taskId = parseInt(id);
		if (isNaN(taskId)) {
			return { success: false, error: 'Invalid task ID' };
		}

		const task = await prisma.task.findUnique({
			where: { id: taskId },
		});

		if (!task) {
			return { success: false, error: 'Task not found', statusCode: 404 };
		}

		let projectName = null;
		let meetingName = null;
		if (task.projectId) {
			const project = await prisma.project.findUnique({
				where: { id: task.projectId },
				select: { title: true },
			});
			projectName = project?.title ?? null;
		}
		if (task.projectMeetingId) {
			const meeting = await prisma.meeting.findUnique({
				where: { id: task.projectMeetingId },
				select: { title: true },
			});
			meetingName = meeting?.title ?? null;
		}

		return {
			success: true,
			data: {
				...task,
				projectName,
				meetingName,
			},
		};
	} catch (error) {
		console.error('Error getting task:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Get all subtasks for a specific task
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} parentTaskId - Parent task ID
 * @returns {Promise<Object>} Array of subtasks
 */
export async function getSubtasks(prisma, parentTaskId) {
	try {
		const taskId = parseInt(parentTaskId);
		if (isNaN(taskId)) {
			return { success: false, error: 'Invalid task ID', statusCode: 400 };
		}

		// Verify parent task exists
		const parentTask = await prisma.task.findUnique({
			where: { id: taskId },
		});

		if (!parentTask) {
			return { success: false, error: 'Parent task not found', statusCode: 404 };
		}

		// Get all subtasks (direct children only)
		const subtasks = await prisma.task.findMany({
			where: { parentTaskId: taskId },
			include: {
				subtasks: {
					select: {
						id: true,
						taskStatus: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		// Add subtask counts to each subtask
		const subtasksWithCounts = subtasks.map(task => {
			const subSubtasks = task.subtasks || [];
			const completedSubtasks = subSubtasks.filter(st => st.taskStatus === 'completed').length;
			const incompletedSubtasks = subSubtasks.length - completedSubtasks;
			const completionPercent = subSubtasks.length > 0
				? Math.round((completedSubtasks / subSubtasks.length) * 100)
				: 0;

			return {
				...task,
				totalSubTasks: subSubtasks.length,
				completedSubTasks: completedSubtasks,
				incompletedSubTasks: incompletedSubtasks,
				completionPercent: completionPercent,
			};
		});

		return { success: true, data: subtasksWithCounts };
	} catch (error) {
		console.error('Error getting subtasks:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Create a new task
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>} Created task object
 */
export async function createTask(prisma, taskData) {
	try {
		const {
			title,
			description,
			projectId,
			projectMeetingId,
			parentTaskId,
			priority = 'mid',
			taskStatus = 'pending',
			submissionDate,
			executionDate,
			completionDate,
			assignedTo,
			comment,
		} = taskData;

		// Validation
		if (!title) {
			return {
				success: false,
				error: 'Title is required',
				statusCode: 400
			};
		}

		// Validate priority
		const validPriorities = ['low', 'mid', 'high', 'urgent'];
		if (priority && !validPriorities.includes(priority)) {
			return {
				success: false,
				error: `Priority must be one of: ${validPriorities.join(', ')}`,
				statusCode: 400,
			};
		}

		// Validate task status
		const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'hold'];
		if (taskStatus && !validStatuses.includes(taskStatus)) {
			return {
				success: false,
				error: `Task status must be one of: ${validStatuses.join(', ')}`,
				statusCode: 400,
			};
		}

		// Verify project exists if projectId is provided
		if (projectId) {
			const project = await prisma.project.findUnique({
				where: { id: projectId },
			});

			if (!project) {
				return {
					success: false,
					error: 'Project not found',
					statusCode: 404
				};
			}
		}

		// Verify assigned user exists if assignedTo is provided
		if (assignedTo) {
			const user = await prisma.user.findUnique({
				where: { id: assignedTo },
			});

			if (!user) {
				return {
					success: false,
					error: 'Assigned user not found',
					statusCode: 404
				};
			}
		}

		// Verify parent task exists if parentTaskId is provided
		if (parentTaskId) {
			const parentTask = await prisma.task.findUnique({
				where: { id: parentTaskId },
			});

			if (!parentTask) {
				return {
					success: false,
					error: 'Parent task not found',
					statusCode: 404
				};
			}
		}

		// Verify meeting exists if projectMeetingId is provided
		if (projectMeetingId) {
			const meeting = await prisma.meeting.findUnique({
				where: { id: projectMeetingId },
			});

			if (!meeting) {
				return {
					success: false,
					error: 'Meeting not found',
					statusCode: 404
				};
			}

			// Verify meeting belongs to the same project if projectId is also provided
			if (projectId && meeting.projectId !== projectId) {
				return {
					success: false,
					error: 'Meeting does not belong to the selected project',
					statusCode: 400
				};
			}
		}

		// Calculate total duration if both execution and completion dates are provided
		let totalDuration = null;
		if (executionDate && completionDate) {
			totalDuration = calculateDuration(
				new Date(executionDate),
				new Date(completionDate)
			);
		}

		const task = await prisma.task.create({
			data: {
				title,
				description: description || null,
				projectId: projectId || null,
				projectMeetingId: projectMeetingId || null,
				parentTaskId: parentTaskId || null,
				priority,
				taskStatus,
				submissionDate: submissionDate ? new Date(submissionDate) : new Date(),
				executionDate: executionDate ? new Date(executionDate) : null,
				completionDate: completionDate ? new Date(completionDate) : null,
				totalDuration,
				assignedTo: assignedTo || null,
				comment: comment || null,
				createdAt: new Date(),
			},
		});

		return { success: true, data: task, statusCode: 201 };
	} catch (error) {
		console.error('Error creating task:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Update an existing task
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} id - Task ID
 * @param {Object} taskData - Task data to update
 * @returns {Promise<Object>} Updated task object
 */
export async function updateTask(prisma, id, taskData) {
	try {
		const taskId = parseInt(id);
		if (isNaN(taskId)) {
			return { success: false, error: 'Invalid task ID', statusCode: 400 };
		}

		// Check if task exists
		const existingTask = await prisma.task.findUnique({
			where: { id: taskId },
		});

		if (!existingTask) {
			return { success: false, error: 'Task not found', statusCode: 404 };
		}

		// Prepare update data
		const updateData = {
			updatedAt: new Date(),
		};

		if (taskData.title !== undefined) updateData.title = taskData.title;
		if (taskData.description !== undefined) updateData.description = taskData.description || null;
		if (taskData.projectId !== undefined) updateData.projectId = taskData.projectId || null;
		if (taskData.projectMeetingId !== undefined) updateData.projectMeetingId = taskData.projectMeetingId || null;
		if (taskData.parentTaskId !== undefined) {
			// Prevent circular reference
			if (taskData.parentTaskId === taskId) {
				return {
					success: false,
					error: 'Task cannot be its own parent',
					statusCode: 400,
				};
			}
			updateData.parentTaskId = taskData.parentTaskId || null;
		}
		if (taskData.priority !== undefined) {
			const validPriorities = ['low', 'mid', 'high', 'urgent'];
			if (!validPriorities.includes(taskData.priority)) {
				return {
					success: false,
					error: `Priority must be one of: ${validPriorities.join(', ')}`,
					statusCode: 400,
				};
			}
			updateData.priority = taskData.priority;
		}
		if (taskData.taskStatus !== undefined) {
			const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'hold'];
			if (!validStatuses.includes(taskData.taskStatus)) {
				return {
					success: false,
					error: `Task status must be one of: ${validStatuses.join(', ')}`,
					statusCode: 400,
				};
			}
			updateData.taskStatus = taskData.taskStatus;
		}
		if (taskData.submissionDate !== undefined) {
			updateData.submissionDate = taskData.submissionDate ? new Date(taskData.submissionDate) : null;
		}
		if (taskData.executionDate !== undefined) {
			updateData.executionDate = taskData.executionDate ? new Date(taskData.executionDate) : null;
		}
		if (taskData.completionDate !== undefined) {
			updateData.completionDate = taskData.completionDate ? new Date(taskData.completionDate) : null;
		}
		if (taskData.assignedTo !== undefined) {
			updateData.assignedTo = taskData.assignedTo || null;
		}
		if (taskData.comment !== undefined) {
			updateData.comment = taskData.comment || null;
		}

		// Recalculate total duration if execution and completion dates are both set
		const execDate = updateData.executionDate !== undefined
			? (updateData.executionDate || existingTask.executionDate)
			: existingTask.executionDate;
		const compDate = updateData.completionDate !== undefined
			? (updateData.completionDate || existingTask.completionDate)
			: existingTask.completionDate;

		// Special condition: if task is being marked as completed with completionDate, calculate duration
		if (updateData.taskStatus === 'completed' && updateData.completionDate) {
			// Use executionDate from update or existing task
			const executionDate = updateData.executionDate !== undefined
				? (updateData.executionDate || existingTask.executionDate)
				: existingTask.executionDate;

			if (executionDate) {
				// Calculate duration in minutes from execution to completion
				updateData.totalDuration = calculateDuration(
					new Date(executionDate),
					new Date(updateData.completionDate)
				);
			}
		} else if (execDate && compDate) {
			// General case: if both execution and completion dates are set, calculate duration
			updateData.totalDuration = calculateDuration(
				new Date(execDate),
				new Date(compDate)
			);
		} else if (updateData.executionDate !== undefined || updateData.completionDate !== undefined) {
			// If one date is cleared, reset duration
			updateData.totalDuration = null;
		}

		// Verify project exists if projectId is being updated
		if (updateData.projectId !== undefined && updateData.projectId) {
			const project = await prisma.project.findUnique({
				where: { id: updateData.projectId },
			});

			if (!project) {
				return {
					success: false,
					error: 'Project not found',
					statusCode: 404
				};
			}
		}

		// Verify assigned user exists if assignedTo is being updated
		if (updateData.assignedTo !== undefined && updateData.assignedTo) {
			const user = await prisma.user.findUnique({
				where: { id: updateData.assignedTo },
			});

			if (!user) {
				return {
					success: false,
					error: 'Assigned user not found',
					statusCode: 404
				};
			}
		}

		// Verify parent task exists if parentTaskId is being updated
		if (updateData.parentTaskId !== undefined && updateData.parentTaskId) {
			const parentTask = await prisma.task.findUnique({
				where: { id: updateData.parentTaskId },
			});

			if (!parentTask) {
				return {
					success: false,
					error: 'Parent task not found',
					statusCode: 404
				};
			}
		}

		// Verify meeting exists if projectMeetingId is being updated
		if (updateData.projectMeetingId !== undefined && updateData.projectMeetingId) {
			const meeting = await prisma.meeting.findUnique({
				where: { id: updateData.projectMeetingId },
			});

			if (!meeting) {
				return {
					success: false,
					error: 'Meeting not found',
					statusCode: 404
				};
			}

			// Verify meeting belongs to the same project if projectId is also being updated
			const projectIdToCheck = updateData.projectId !== undefined
				? updateData.projectId
				: existingTask.projectId;

			if (projectIdToCheck && meeting.projectId !== projectIdToCheck) {
				return {
					success: false,
					error: 'Meeting does not belong to the selected project',
					statusCode: 400
				};
			}
		}

		const task = await prisma.task.update({
			where: { id: taskId },
			data: updateData,
		});

		return { success: true, data: task };
	} catch (error) {
		console.error('Error updating task:', error);

		if (error.code === 'P2025') {
			return {
				success: false,
				error: 'Task not found',
				statusCode: 404
			};
		}

		return { success: false, error: error.message };
	}
}

/**
 * Delete a task
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} id - Task ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteTask(prisma, id) {
	try {
		const taskId = parseInt(id);
		if (isNaN(taskId)) {
			return { success: false, error: 'Invalid task ID', statusCode: 400 };
		}

		// Check if task exists
		const existingTask = await prisma.task.findUnique({
			where: { id: taskId },
		});

		if (!existingTask) {
			return { success: false, error: 'Task not found', statusCode: 404 };
		}

		// Soft delete: set status = 0 (inactive)
		await prisma.task.update({
			where: { id: taskId },
			data: { status: 0 },
		});

		// await prisma.task.delete({
		// 	where: { id: taskId },
		// });

		return { success: true, message: 'Task deleted successfully' };
	} catch (error) {
		console.error('Error deleting task:', error);

		if (error.code === 'P2025') {
			return {
				success: false,
				error: 'Task not found',
				statusCode: 404
			};
		}

		return { success: false, error: error.message };
	}
}
