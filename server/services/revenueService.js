/**
 * Revenue Service
 * Core business logic for revenue management, calculations, and data persistence
 */

import {
  calculateNetRevenue,
  calculateRoleRevenue,
  calculateMemberRevenue,
  calculateEqualShare,
  validateAssignments,
  validateSharePercentages,
  calculateFullBreakdown,
  getRevenueRoles,
} from '../utils/revenueCalculations.js'

/**
 * Get or create revenue settings
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Promise<Object>} Revenue settings object
 */
const getRevenueSettings = async (prisma) => {
  const settings = await prisma.revenueSettings.findUnique({
    where: { id: 1 },
  })
  
  if (!settings) {
    return await prisma.revenueSettings.create({
      data: { id: 1 },
    })
  }
  
  return settings
}

/**
 * Update revenue settings
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Object} data - New settings data
 * @param {number} userId - User ID making the change
 * @returns {Promise<Object>} Updated settings
 */
const updateRevenueSettings = async (prisma, data, userId) => {
  // Validate percentages sum to 100
  const percentages = Object.values(data).filter(v => typeof v === 'number')
  const sum = percentages.reduce((a, b) => a + b, 0)
  
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100%, got ${sum.toFixed(2)}%`)
  }
  
  return await prisma.revenueSettings.update({
    where: { id: 1 },
    data: {
      ...data,
      updatedBy: userId,
      updatedAt: new Date(),
    },
  })
}

/**
 * Create or update project revenue
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} projectId - Project ID
 * @param {Object} data - Revenue data { totalAmount, expense }
 * @param {number} userId - User ID making the change
 * @returns {Promise<Object>} Project revenue object
 */
const createOrUpdateProjectRevenue = async (prisma, projectId, data, userId) => {
  const { totalAmount, expense = 0 } = data
  
  if (typeof totalAmount !== 'number' || totalAmount < 0) {
    throw new Error('Total amount must be a positive number')
  }
  
  if (typeof expense !== 'number' || expense < 0) {
    throw new Error('Expense must be a positive number')
  }
  
  const netRevenue = calculateNetRevenue(totalAmount, expense)
  
  // Check if revenue record exists
  const existing = await prisma.projectRevenue.findUnique({
    where: { projectId },
  })
  
  if (existing) {
    // Track history for changes
    const changes = {
      oldData: {
        totalAmount: existing.totalAmount,
        expense: existing.expense,
      },
      newData: { totalAmount, expense },
      changeType: 'amount_change',
      changedBy: userId,
    }
    
    await prisma.revenueHistory.create({
      data: {
        projectId,
        projectRevenueId: existing.id,
        ...changes,
        oldData: JSON.stringify(changes.oldData),
        newData: JSON.stringify(changes.newData),
      },
    })
    
    return await prisma.projectRevenue.update({
      where: { projectId },
      data: {
        totalAmount,
        expense,
        netRevenue,
        updatedAt: new Date(),
      },
      include: {
        assignments: {
          include: {
            members: true,
          },
        },
      },
    })
  }
  
  return await prisma.projectRevenue.create({
    data: {
      projectId,
      totalAmount,
      expense,
      netRevenue,
    },
    include: {
      assignments: {
        include: {
          members: true,
        },
      },
    },
  })
}

/**
 * Get project revenue with all related data
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Complete project revenue data
 */
const getProjectRevenue = async (prisma, projectId) => {
  const revenue = await prisma.projectRevenue.findUnique({
    where: { projectId },
    include: {
      assignments: {
        include: {
          members: true,
        },
      },
    },
  })
  
  if (!revenue) {
    throw new Error(`No revenue data found for project ${projectId}`)
  }
  
  return revenue
}

/**
 * Assign users to a revenue role
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} projectRevenueId - Project revenue ID
 * @param {string} role - Role name (quotation, marketing, graphics, etc)
 * @param {Array<Object>} members - Array of {userId, sharePercentage}
 * @param {number} userId - User making the assignment
 * @returns {Promise<Object>} Updated assignment with members
 */
const assignMembersToRole = async (prisma, projectRevenueId, role, members, userId) => {
  // Validate that members array is not empty
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error('At least one member must be assigned to a role')
  }
  
  // Validate share percentages
  const percentages = members.map(m => m.sharePercentage || 0)
  const sum = percentages.reduce((a, b) => a + b, 0)
  
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error(`Member share percentages must sum to 100%, got ${sum.toFixed(2)}%`)
  }
  
  // Get project revenue for context
  const projectRevenue = await prisma.projectRevenue.findUnique({
    where: { id: projectRevenueId },
  })
  
  if (!projectRevenue) {
    throw new Error('Project revenue not found')
  }
  
  // Get or create assignment
  let assignment = await prisma.revenueAssignment.findUnique({
    where: {
      projectRevenueId_role: {
        projectRevenueId,
        role,
      },
    },
    include: {
      members: true,
    },
  })
  
  // Delete existing members if updating
  if (assignment) {
    await prisma.revenueMember.deleteMany({
      where: { revenueAssignmentId: assignment.id },
    })
  } else {
    assignment = await prisma.revenueAssignment.create({
      data: {
        projectId: projectRevenue.projectId,
        projectRevenueId,
        role,
      },
      include: {
        members: true,
      },
    })
  }
  
  // Get revenue settings for calculation
  const settings = await getRevenueSettings(prisma)
  const rolePercentage = getRolePercentage(role, settings)
  const roleAmount = calculateRoleRevenue(projectRevenue.netRevenue, rolePercentage)
  
  // Create new member records with calculated amounts
  const newMembers = await Promise.all(
    members.map((member) => {
      const amountEarned = calculateMemberRevenue(roleAmount, member.sharePercentage)
      return prisma.revenueMember.create({
        data: {
          revenueAssignmentId: assignment.id,
          userId: member.userId,
          sharePercentage: member.sharePercentage,
          amountEarned,
        },
      })
    })
  )
  
  // Track history
  await prisma.revenueHistory.create({
    data: {
      projectId: projectRevenue.projectId,
      projectRevenueId,
      changeType: 'assignment_change',
      changedBy: userId,
      newData: JSON.stringify({
        role,
        members: newMembers.map(m => ({
          userId: m.userId,
          sharePercentage: m.sharePercentage,
          amountEarned: m.amountEarned,
        })),
      }),
    },
  })
  
  return await prisma.revenueAssignment.findUnique({
    where: { id: assignment.id },
    include: {
      members: true,
    },
  })
}

/**
 * Get profit summary for a project
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Complete profit distribution summary
 */
const getProfitSummary = async (prisma, projectId) => {
  const revenue = await getProjectRevenue(prisma, projectId)
  const settings = await getRevenueSettings(prisma)
  
  // Calculate full breakdown
  const { breakdown, total } = calculateFullBreakdown(settings, revenue.netRevenue)
  
  // Get all assigned roles
  const assignments = revenue.assignments.reduce((acc, assignment) => {
    acc[assignment.role] = assignment.members.map(m => ({
      userId: m.userId,
      sharePercentage: m.sharePercentage,
      amountEarned: m.amountEarned,
    }))
    return acc
  }, {})
  
  // Calculate unused roles (roles not in assignments)
  const rolesList = getRevenueRoles()
  const assignedRoles = new Set(revenue.assignments.map(a => a.role))
  const unusedRoles = rolesList.filter(r => !assignedRoles.has(r.key) && r.key !== 'reserve')
  const unusedAmount = unusedRoles.reduce(
    (sum, role) => sum + breakdown[toCamelCase(role.key)],
    0
  )
  
  return {
    projectId,
    totalAmount: revenue.totalAmount,
    expense: revenue.expense,
    netRevenue: revenue.netRevenue,
    breakdown: {
      quotation: breakdown.quotation,
      marketing: breakdown.marketing,
      graphics: breakdown.graphics,
      clientHunt: breakdown.clientHunt,
      qa: breakdown.qa,
      secondary: breakdown.secondary,
      core: breakdown.core,
      reserve: breakdown.reserve + unusedAmount, // Add unused amounts to reserve
    },
    assignments,
    unusedRoles: unusedRoles.map(r => r.key),
    totalReserve: breakdown.reserve + unusedAmount,
    createdAt: revenue.createdAt,
    updatedAt: revenue.updatedAt,
  }
}

/**
 * Get revenue history for a project
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} projectId - Project ID
 * @param {Object} options - Pagination options { skip, take }
 * @returns {Promise<Object>} History records with pagination
 */
const getRevenueHistory = async (prisma, projectId, options = {}) => {
  const { skip = 0, take = 50 } = options
  
  const [history, total] = await Promise.all([
    prisma.revenueHistory.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.revenueHistory.count({ where: { projectId } }),
  ])
  
  return {
    data: history.map(h => ({
      ...h,
      oldData: h.oldData ? JSON.parse(h.oldData) : null,
      newData: h.newData ? JSON.parse(h.newData) : null,
    })),
    total,
    skip,
    take,
  }
}

/**
 * Get member earnings summary across all projects
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User's earnings across projects
 */
const getUserEarnings = async (prisma, userId) => {
  const members = await prisma.revenueMember.findMany({
    where: { userId },
    include: {
      revenueAssignment: {
        include: {
          projectRevenue: true,
        },
      },
    },
  })
  
  const earnings = members.reduce((acc, member) => {
    const projectId = member.revenueAssignment.projectRevenue.projectId
    if (!acc[projectId]) {
      acc[projectId] = {
        projectId,
        totalAmount: member.revenueAssignment.projectRevenue.totalAmount,
        totalEarned: 0,
        roles: [],
      }
    }
    acc[projectId].totalEarned += member.amountEarned
    acc[projectId].roles.push({
      role: member.revenueAssignment.role,
      sharePercentage: member.sharePercentage,
      amountEarned: member.amountEarned,
    })
    return acc
  }, {})
  
  return Object.values(earnings)
}

/**
 * Helper function to convert snake_case to camelCase
 */
const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
}

/**
 * Get role percentage from settings
 */
const getRolePercentage = (role, settings) => {
  const roleMap = {
    quotation: settings.quotationPercentage,
    marketing: settings.marketingPercentage,
    graphics: settings.graphicsPercentage,
    client_hunt: settings.clientHuntPercentage,
    qa: settings.qaPercentage,
    secondary: settings.secondaryPercentage,
    core: settings.corePercentage,
    reserve: settings.reservePercentage,
  }
  
  return roleMap[role] || 0
}

export {
  getRevenueSettings,
  updateRevenueSettings,
  createOrUpdateProjectRevenue,
  getProjectRevenue,
  assignMembersToRole,
  getProfitSummary,
  getRevenueHistory,
  getUserEarnings,
}
