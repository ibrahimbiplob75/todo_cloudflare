import {
  getRevenueSettings,
  updateRevenueSettings,
  createOrUpdateProjectRevenue,
  getProjectRevenue,
  assignMembersToRole,
  getProfitSummary,
  getRevenueHistory,
  getUserEarnings,
} from '../services/revenueService.js'
import { getAuthUserFromRequest } from '../services/authService.js'

/**
 * Revenue Routes Handler
 * Handles all revenue management endpoints
 */
export async function handleRevenueRoutes(request, prisma, corsHeaders, env = {}) {
  const url = new URL(request.url)
  const pathname = url.pathname
  const method = request.method
  let authCache = null

  async function getAuthContext() {
    if (authCache) return authCache
    authCache = await getAuthUserFromRequest(prisma, request, env)
    return authCache
  }

  function isWatcher(auth) {
    return auth?.success && auth.data?.role === 'watcher'
  }

  async function requireAuth() {
    const auth = await getAuthContext()
    if (!auth.success) {
      return Response.json(
        { error: auth.error },
        { status: auth.statusCode || 401, headers: corsHeaders }
      )
    }
    return null
  }

  async function requireWatcher() {
    const denied = await requireAuth()
    if (denied) return denied
    const auth = await getAuthContext()
    if (!isWatcher(auth)) {
      return Response.json(
        { error: 'Forbidden: watcher role required' },
        { status: 403, headers: corsHeaders }
      )
    }
    return null
  }

  // ==================== REVENUE SETTINGS ====================

  // GET /revenue/settings - Get current revenue distribution settings
  if (pathname === '/revenue/settings' && method === 'GET') {
    const denied = await requireAuth()
    if (denied) return denied

    try {
      const settings = await getRevenueSettings(prisma)
      return Response.json(settings, { headers: corsHeaders })
    } catch (error) {
      console.error('Error fetching revenue settings:', error)
      return Response.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      )
    }
  }

  // PUT /revenue/settings - Update revenue distribution settings (watcher only)
  if (pathname === '/revenue/settings' && method === 'PUT') {
    const denied = await requireWatcher()
    if (denied) return denied

    try {
      const data = await request.json()
      const auth = await getAuthContext()
      const settings = await updateRevenueSettings(prisma, data, auth.data.id)
      return Response.json(settings, { headers: corsHeaders })
    } catch (error) {
      console.error('Error updating revenue settings:', error)
      return Response.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      )
    }
  }

  // ==================== PROJECT REVENUE ====================

  // POST /project/:projectId/revenue - Create or update project revenue
  const projectRevenuePostMatch = pathname.match(/^\/project\/(\d+)\/revenue$/)
  if (projectRevenuePostMatch && method === 'POST') {
    const denied = await requireAuth()
    if (denied) return denied

    try {
      const projectId = parseInt(projectRevenuePostMatch[1])
      const data = await request.json()
      const auth = await getAuthContext()

      const revenue = await createOrUpdateProjectRevenue(
        prisma,
        projectId,
        { totalAmount: data.totalAmount, expense: data.expense || 0 },
        auth.data.id
      )

      return Response.json(revenue, { headers: corsHeaders })
    } catch (error) {
      console.error('Error creating/updating project revenue:', error)
      return Response.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      )
    }
  }

  // GET /project/:projectId/revenue - Get project revenue details
  const projectRevenueGetMatch = pathname.match(/^\/project\/(\d+)\/revenue$/)
  if (projectRevenueGetMatch && method === 'GET') {
    const denied = await requireAuth()
    if (denied) return denied

    try {
      const projectId = parseInt(projectRevenueGetMatch[1])
      const revenue = await getProjectRevenue(prisma, projectId)
      return Response.json(revenue, { headers: corsHeaders })
    } catch (error) {
      console.error('Error fetching project revenue:', error)
      return Response.json(
        { error: error.message },
        { status: 404, headers: corsHeaders }
      )
    }
  }

  // PUT /project/:projectId/revenue - Update project revenue amounts
  const projectRevenuePutMatch = pathname.match(/^\/project\/(\d+)\/revenue$/)
  if (projectRevenuePutMatch && method === 'PUT') {
    const denied = await requireAuth()
    if (denied) return denied

    try {
      const projectId = parseInt(projectRevenuePutMatch[1])
      const data = await request.json()
      const auth = await getAuthContext()

      const revenue = await createOrUpdateProjectRevenue(
        prisma,
        projectId,
        { totalAmount: data.totalAmount, expense: data.expense || 0 },
        auth.data.id
      )

      return Response.json(revenue, { headers: corsHeaders })
    } catch (error) {
      console.error('Error updating project revenue:', error)
      return Response.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      )
    }
  }

  // ==================== REVENUE ASSIGNMENTS ====================

  // POST /project/:projectId/revenue/assign - Assign members to a revenue role
  const assignMatch = pathname.match(/^\/project\/(\d+)\/revenue\/assign$/)
  if (assignMatch && method === 'POST') {
    const denied = await requireWatcher()
    if (denied) return denied

    try {
      const projectId = parseInt(assignMatch[1])
      const data = await request.json()
      const auth = await getAuthContext()

      if (!data.role || !Array.isArray(data.members)) {
        return Response.json(
          { error: 'Role and members array are required' },
          { status: 400, headers: corsHeaders }
        )
      }

      const revenue = await getProjectRevenue(prisma, projectId)
      const assignment = await assignMembersToRole(
        prisma,
        revenue.id,
        data.role,
        data.members,
        auth.data.id
      )

      return Response.json(assignment, { headers: corsHeaders })
    } catch (error) {
      console.error('Error assigning members to role:', error)
      return Response.json(
        { error: error.message },
        { status: 400, headers: corsHeaders }
      )
    }
  }

  // ==================== PROFIT SUMMARY ====================

  // GET /project/:projectId/profit-summary - Get complete profit distribution summary
  const profitSummaryMatch = pathname.match(/^\/project\/(\d+)\/profit-summary$/)
  if (profitSummaryMatch && method === 'GET') {
    const denied = await requireAuth()
    if (denied) return denied

    try {
      const projectId = parseInt(profitSummaryMatch[1])
      const summary = await getProfitSummary(prisma, projectId)
      return Response.json(summary, { headers: corsHeaders })
    } catch (error) {
      console.error('Error fetching profit summary:', error)
      return Response.json(
        { error: error.message },
        { status: 404, headers: corsHeaders }
      )
    }
  }

  // ==================== REVENUE HISTORY ====================

  // GET /project/:projectId/revenue-history - Get revenue change history
  const historyMatch = pathname.match(/^\/project\/(\d+)\/revenue-history$/)
  if (historyMatch && method === 'GET') {
    const denied = await requireAuth()
    if (denied) return denied

    try {
      const projectId = parseInt(historyMatch[1])
      const skip = parseInt(url.searchParams.get('skip') || '0')
      const take = parseInt(url.searchParams.get('take') || '50')

      const history = await getRevenueHistory(prisma, projectId, { skip, take })
      return Response.json(history, { headers: corsHeaders })
    } catch (error) {
      console.error('Error fetching revenue history:', error)
      return Response.json(
        { error: error.message },
        { status: 404, headers: corsHeaders }
      )
    }
  }

  // ==================== USER EARNINGS ====================

  // GET /user/:userId/earnings - Get user's earnings across all projects
  const earningsMatch = pathname.match(/^\/user\/(\d+)\/earnings$/)
  if (earningsMatch && method === 'GET') {
    const denied = await requireAuth()
    if (denied) return denied

    try {
      const userId = parseInt(earningsMatch[1])
      const auth = await getAuthContext()

      // Users can only view their own earnings, watchers can view anyone's
      if (auth.data.id !== userId && !isWatcher(auth)) {
        return Response.json(
          { error: 'Cannot view other users earnings' },
          { status: 403, headers: corsHeaders }
        )
      }

      const earnings = await getUserEarnings(prisma, userId)
      return Response.json({ userId, earnings }, { headers: corsHeaders })
    } catch (error) {
      console.error('Error fetching user earnings:', error)
      return Response.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      )
    }
  }

  // No revenue route matched
  return null
}
