import * as meetingService from '../services/meetingService.js';
import { extractTokenFromRequest, verifyToken } from '../services/authService.js';

/**
 * Meeting Routes Handler
 * Handles all meeting-related endpoints
 */
export async function handleMeetingRoutes(request, prisma, corsHeaders, env = {}) {
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

	// GET /meeting/analytics - Meeting task counts (completed/total) for active tasks
	if (pathname === "/meeting/analytics" && method === 'GET') {
		try {
			const userId = await getUserId();
			const result = await meetingService.getMeetingAnalytics(prisma, userId);

			if (result.success) {
				return Response.json({ meetings: result.data }, { headers: corsHeaders });
			}

			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Meeting analytics error:', error);
			return Response.json(
				{ error: 'Failed to fetch meeting analytics' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// GET /meeting - List all meetings (with optional filters)
	if (pathname === "/meeting" && method === 'GET') {
		try {
			const userId = await getUserId();
			const searchParams = url.searchParams;
			
			// Build filters from query parameters
			const filters = {};
			
			if (searchParams.has('project_id')) {
				filters.projectId = parseInt(searchParams.get('project_id'));
			}

			if (searchParams.has('creator')) {
				filters.creator = parseInt(searchParams.get('creator'));
			} else if (userId && !filters.projectId) {
				// When project_id is specified, return all meetings for the project.
				// Otherwise default to user's meetings.
				filters.creator = userId;
			}
			
			const result = await meetingService.listMeetings(prisma, filters);
			
			if (result.success) {
				return Response.json({ meetings: result.data }, { headers: corsHeaders });
			}
			
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Meeting list error:', error);
			return Response.json(
				{ error: 'Failed to fetch meetings' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// POST /meeting/create - Create new meeting
	if (pathname === "/meeting/create" && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}

			const body = await request.json();
			
			// Set creator to authenticated user if not provided
			if (!body.creator) {
				body.creator = userId;
			}
			
			const result = await meetingService.createMeeting(prisma, body);
			
			if (result.success) {
				return Response.json(
					{ meeting: result.data },
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

	// GET /meeting/{id} - Get single meeting
	const getMeetingMatch = pathname.match(/^\/meeting\/(\d+)$/);
	if (getMeetingMatch && method === 'GET') {
		const meetingId = getMeetingMatch[1];
		const result = await meetingService.getMeetingById(prisma, meetingId);
		
		if (result.success) {
			return Response.json({ meeting: result.data }, { headers: corsHeaders });
		}
		
		return Response.json(
			{ error: result.error },
			{ status: result.statusCode || 500, headers: corsHeaders }
		);
	}

	// GET /meeting/slug/{slug} - Get meeting by slug
	const getMeetingBySlugMatch = pathname.match(/^\/meeting\/slug\/(.+)$/);
	if (getMeetingBySlugMatch && method === 'GET') {
		try {
			const slug = decodeURIComponent(getMeetingBySlugMatch[1]);
			const result = await meetingService.getMeetingBySlug(prisma, slug);
			
			if (result.success) {
				return Response.json({ meeting: result.data }, { headers: corsHeaders });
			}
			
			return Response.json(
				{ error: result.error },
				{ status: result.statusCode || 500, headers: corsHeaders }
			);
		} catch (error) {
			console.error('Get meeting by slug error:', error);
			return Response.json(
				{ error: 'Failed to fetch meeting' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// POST /meeting/{id}/update - Update single meeting
	const updateMeetingMatch = pathname.match(/^\/meeting\/(\d+)\/update$/);
	if (updateMeetingMatch && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}

			const meetingId = updateMeetingMatch[1];
			
			// Check if meeting exists and user is the creator
			const existingMeeting = await meetingService.getMeetingById(prisma, meetingId);
			if (!existingMeeting.success) {
				return Response.json(
					{ error: existingMeeting.error },
					{ status: existingMeeting.statusCode || 404, headers: corsHeaders }
				);
			}

			// Authorization: Only creator can update
			if (existingMeeting.data.creator !== userId) {
				return Response.json(
					{ error: 'You can only update meetings you created' },
					{ status: 403, headers: corsHeaders }
				);
			}

			const body = await request.json();
			const result = await meetingService.updateMeeting(prisma, meetingId, body);
			
			if (result.success) {
				return Response.json(
					{ meeting: result.data },
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

	// POST /meeting/{id}/delete - Delete single meeting
	const deleteMeetingMatch = pathname.match(/^\/meeting\/(\d+)\/delete$/);
	if (deleteMeetingMatch && method === 'POST') {
		try {
			const userId = await getUserId();
			if (!userId) {
				return Response.json(
					{ error: 'Authentication required' },
					{ status: 401, headers: corsHeaders }
				);
			}

			const meetingId = deleteMeetingMatch[1];
			
			// Check if meeting exists and user is the creator
			const existingMeeting = await meetingService.getMeetingById(prisma, meetingId);
			if (!existingMeeting.success) {
				return Response.json(
					{ error: existingMeeting.error },
					{ status: existingMeeting.statusCode || 404, headers: corsHeaders }
				);
			}

			// Authorization: Only creator can delete
			if (existingMeeting.data.creator !== userId) {
				return Response.json(
					{ error: 'You can only delete meetings you created' },
					{ status: 403, headers: corsHeaders }
				);
			}

			const result = await meetingService.deleteMeeting(prisma, meetingId);
			
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
			console.error('Delete meeting error:', error);
			return Response.json(
				{ error: 'Failed to delete meeting' },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// No route matched
	return null;
}
