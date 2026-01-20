/**
 * Todo Routes Handler
 * Handles all todo-related endpoints
 */
export async function handleTodoRoutes(request, prisma, corsHeaders) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	const method = request.method;

	// GET /api/todos - List all todos
	if (pathname === "/api/todos" && method === 'GET') {
		try {
			const todos = await prisma.todo.findMany({
				orderBy: { createdAt: 'desc' },
			});
			return Response.json({ todos }, { headers: corsHeaders });
		} catch (error) {
			console.error('Database error:', error);
			return Response.json(
				{ error: 'Database operation failed', details: error.message },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// POST /api/todos - Create new todo
	if (pathname === "/api/todos" && method === 'POST') {
		try {
			const body = await request.json();
			const todo = await prisma.todo.create({
				data: {
					title: body.title,
					completed: body.completed || false,
				},
			});
			return Response.json({ todo }, { headers: corsHeaders });
		} catch (error) {
			console.error('Database error:', error);
			return Response.json(
				{ error: 'Database operation failed', details: error.message },
				{ status: 500, headers: corsHeaders }
			);
		}
	}

	// Return null if route doesn't match
	return null;
}
