/**
 * General API Routes Handler
 * Handles general API endpoints
 */
export async function handleApiRoutes(request, corsHeaders) {
	const url = new URL(request.url);
	const pathname = url.pathname;

	// GET /api/ - API info endpoint
	if (pathname === "/api/") {
		return Response.json({
			name: "Cloudflare",
		}, { headers: corsHeaders });
	}

	// Return null if route doesn't match
	return null;
}
