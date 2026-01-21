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
 * List all tasks with optional filters
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Object} filters - Filter options (projectId, assignedTo, taskStatus, priority)
 * @returns {Promise<Array>} Array of tasks
 */
export async function listTasks(prisma, filters = {}) {
	try {
		const where = {};
		
		// By default, only show top-level tasks (no parent)
		if (filters.parentTaskId === undefined) {
			where.parentTaskId = null;
		} else if (filters.parentTaskId !== null) {
			where.parentTaskId = parseInt(filters.parentTaskId);
		}
		// If parentTaskId is explicitly null in filters, don't add it to where clause (show all tasks)
		
		if (filters.projectId !== undefined) {
			where.projectId = filters.projectId;
		}
		
		if (filters.assignedTo !== undefined) {
			where.assignedTo = filters.assignedTo;
		}
		
		if (filters.taskStatus !== undefined) {
			where.taskStatus = filters.taskStatus;
		}
		
		if (filters.priority !== undefined) {
			where.priority = filters.priority;
		}
		
		const tasks = await prisma.task.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			include: {
				subtasks: {
					select: {
						id: true,
						taskStatus: true,
					},
				},
			},
		});
		
		// Add subtask counts to each task
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
				completionPercent: completionPercent,
			};
		});
		
		return { success: true, data: tasksWithCounts };
	} catch (error) {
		console.error('Error listing tasks:', error);
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

		return { success: true, data: task };
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
				parentTaskId: parentTaskId || null,
				priority,
				taskStatus,
				submissionDate: submissionDate ? new Date(submissionDate) : null,
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

		await prisma.task.delete({
			where: { id: taskId },
		});

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
