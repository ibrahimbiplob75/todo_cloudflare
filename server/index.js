import { createPrismaClient } from './prisma.js';
import { handleUserRoutes } from './routes/userRoutes.js';
import { handleTodoRoutes } from './routes/todoRoutes.js';
import { handleApiRoutes } from './routes/apiRoutes.js';
import { handleAuthRoutes } from './routes/authRoutes.js';
import { handleProjectRoutes } from './routes/projectRoutes.js';
import { handleTaskRoutes } from './routes/taskRoutes.js';
import { handleMeetingRoutes } from './routes/meetingRoutes.js';

export default {
	async fetch(request, env) {
		const prisma = createPrismaClient(env.intellisoft_db);
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}
		const apiResponse = await handleApiRoutes(request, corsHeaders);
		if (apiResponse) return apiResponse;

		// 2. Auth routes
		const authResponse = await handleAuthRoutes(request, prisma, corsHeaders, env);
		if (authResponse) return authResponse;

		// 3. User routes
		const userResponse = await handleUserRoutes(request, prisma, corsHeaders, env);
		if (userResponse) return userResponse;

		// 4. Project routes
		const projectResponse = await handleProjectRoutes(request, prisma, corsHeaders, env);
		if (projectResponse) return projectResponse;

		// 5. Task routes
		const taskResponse = await handleTaskRoutes(request, prisma, corsHeaders, env);
		if (taskResponse) return taskResponse;

		// 6. Meeting routes
		const meetingResponse = await handleMeetingRoutes(request, prisma, corsHeaders, env);
		if (meetingResponse) return meetingResponse;

		// 7. Todo routes
		const todoResponse = await handleTodoRoutes(request, prisma, corsHeaders);
		if (todoResponse) return todoResponse;

		// No route matched - return 404
		return new Response(null, { status: 404, headers: corsHeaders });
	},
};
