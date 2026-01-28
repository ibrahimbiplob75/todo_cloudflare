/**
 * Project Service - Handles all project-related database operations
 */

/**
 * List all projects as groups, each project including its related meetings.
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} userId - Optional: filter by creator
 * @returns {Promise<Object>} { success, data: groups } where each group is { ...project, meetings: Meeting[] }
 */
export async function listProjects(prisma, userId = null) {
	try {
		const where = userId ? { creator: userId } : {};

		const projects = await prisma.project.findMany({
			where,
			orderBy: { createdAt: 'desc' },
		});

		if (projects.length === 0) {
			return { success: true, data: [] };
		}

		return { success: true, data: projects };

		// const projectIds = projects.map((p) => p.id);
		// const meetings = await prisma.meeting.findMany({
		// 	where: { projectId: { in: projectIds } },
		// 	orderBy: { id: 'desc' },
		// });

		// const meetingsByProjectId = new Map();
		// for (const m of meetings) {
		// 	const list = meetingsByProjectId.get(m.projectId) || [];
		// 	list.push(m);
		// 	meetingsByProjectId.set(m.projectId, list);
		// }

		// const groups = projects.map((project) => ({
		// 	...project,
		// 	meetings: meetingsByProjectId.get(project.id) || [],
		// }));

		// return { success: true, data: groups };
	} catch (error) {
		console.error('Error listing projects:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Get a single project by ID
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} id - Project ID
 * @returns {Promise<Object>} Project object
 */
export async function getProjectById(prisma, id) {
	try {
		const projectId = parseInt(id);
		if (isNaN(projectId)) {
			return { success: false, error: 'Invalid project ID' };
		}

		const project = await prisma.project.findUnique({
			where: { id: projectId },
		});

		if (!project) {
			return { success: false, error: 'Project not found', statusCode: 404 };
		}

		return { success: true, data: project };
	} catch (error) {
		console.error('Error getting project:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Create a new project
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Object} projectData - Project data (title, description, creator)
 * @returns {Promise<Object>} Created project object
 */
export async function createProject(prisma, projectData) {
	try {
		const { title, description, creator } = projectData;

		// Validation
		if (!title || !creator) {
			return { 
				success: false, 
				error: 'Title and creator are required',
				statusCode: 400 
			};
		}

		// Verify creator exists
		const user = await prisma.user.findUnique({
			where: { id: creator },
		});

		if (!user) {
			return { 
				success: false, 
				error: 'Creator user not found',
				statusCode: 404 
			};
		}

		const project = await prisma.project.create({
			data: {
				title,
				description: description || null,
				creator,
				createdAt: new Date(), // Explicitly set created_at timestamp
			},
		});

		return { success: true, data: project, statusCode: 201 };
	} catch (error) {
		console.error('Error creating project:', error);
		return { success: false, error: error.message };
	}
}

/**
 * Update an existing project
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} id - Project ID
 * @param {Object} projectData - Project data to update (title, description - all optional)
 * @returns {Promise<Object>} Updated project object
 */
export async function updateProject(prisma, id, projectData) {
	try {
		const projectId = parseInt(id);
		if (isNaN(projectId)) {
			return { success: false, error: 'Invalid project ID', statusCode: 400 };
		}

		// Check if project exists
		const existingProject = await prisma.project.findUnique({
			where: { id: projectId },
		});

		if (!existingProject) {
			return { success: false, error: 'Project not found', statusCode: 404 };
		}

		// Prepare update data (only include fields that are provided)
		const updateData = {
			updatedAt: new Date(), // Explicitly set updated_at timestamp
		};
		if (projectData.title !== undefined) updateData.title = projectData.title;
		if (projectData.description !== undefined) updateData.description = projectData.description || null;

		const project = await prisma.project.update({
			where: { id: projectId },
			data: updateData,
		});

		return { success: true, data: project };
	} catch (error) {
		console.error('Error updating project:', error);

		// Handle not found
		if (error.code === 'P2025') {
			return { 
				success: false, 
				error: 'Project not found',
				statusCode: 404 
			};
		}

		return { success: false, error: error.message };
	}
}

/**
 * Delete a project
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} id - Project ID
 * @returns {Promise<Object>} Success status
 */
export async function deleteProject(prisma, id) {
	try {
		const projectId = parseInt(id);
		if (isNaN(projectId)) {
			return { success: false, error: 'Invalid project ID', statusCode: 400 };
		}

		// Check if project exists
		const existingProject = await prisma.project.findUnique({
			where: { id: projectId },
		});

		if (!existingProject) {
			return { success: false, error: 'Project not found', statusCode: 404 };
		}

		await prisma.project.delete({
			where: { id: projectId },
		});

		return { success: true, message: 'Project deleted successfully' };
	} catch (error) {
		console.error('Error deleting project:', error);

		// Handle not found
		if (error.code === 'P2025') {
			return { 
				success: false, 
				error: 'Project not found',
				statusCode: 404 
			};
		}

		return { success: false, error: error.message };
	}
}
