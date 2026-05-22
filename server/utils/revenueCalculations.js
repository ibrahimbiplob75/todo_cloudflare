/**
 * Revenue Calculation Utilities
 * Core business logic for profit distribution
 */

/**
 * Calculate net revenue from project amount and expenses
 * @param {number} totalAmount - Total project amount in BDT
 * @param {number} expense - Total project expenses in BDT
 * @returns {number} Net revenue (totalAmount - expense)
 */
const calculateNetRevenue = (totalAmount, expense = 0) => {
  if (typeof totalAmount !== 'number' || typeof expense !== 'number') {
    throw new Error('Both totalAmount and expense must be numbers')
  }
  
  const netRevenue = totalAmount - expense
  
  // Ensure net revenue is never negative
  return Math.max(0, netRevenue)
}

/**
 * Calculate revenue amount for a specific role based on percentage
 * @param {number} netRevenue - Net revenue amount
 * @param {number} percentage - Role percentage
 * @returns {number} Revenue allocated to the role
 */
const calculateRoleRevenue = (netRevenue, percentage) => {
  if (typeof netRevenue !== 'number' || typeof percentage !== 'number') {
    throw new Error('Both netRevenue and percentage must be numbers')
  }
  
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100')
  }
  
  return (netRevenue * percentage) / 100
}

/**
 * Calculate member revenue share
 * @param {number} roleAmount - Total amount allocated to the role
 * @param {number} memberSharePercentage - Individual member's share percentage (0-100)
 * @returns {number} Amount earned by the member
 */
const calculateMemberRevenue = (roleAmount, memberSharePercentage) => {
  if (typeof roleAmount !== 'number' || typeof memberSharePercentage !== 'number') {
    throw new Error('Both roleAmount and memberSharePercentage must be numbers')
  }
  
  if (memberSharePercentage < 0 || memberSharePercentage > 100) {
    throw new Error('Share percentage must be between 0 and 100')
  }
  
  return (roleAmount * memberSharePercentage) / 100
}

/**
 * Calculate total reserve amount (including unused role amounts)
 * @param {number} netRevenue - Net revenue
 * @param {number} reservePercentage - Reserve percentage
 * @param {number} unusedRoleAmounts - Sum of unused role amounts
 * @returns {number} Total reserve amount
 */
const calculateReserveRevenue = (netRevenue, reservePercentage, unusedRoleAmounts = 0) => {
  if (typeof netRevenue !== 'number' || typeof reservePercentage !== 'number') {
    throw new Error('netRevenue and reservePercentage must be numbers')
  }
  
  const baseReserve = calculateRoleRevenue(netRevenue, reservePercentage)
  return baseReserve + unusedRoleAmounts
}

/**
 * Validate revenue distribution assignments
 * @param {Object} assignments - Object with role: [userId] pairs
 * @param {Array<number>} allUserIds - Available user IDs for validation
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateAssignments = (assignments, allUserIds = []) => {
  const errors = []
  
  if (!assignments || typeof assignments !== 'object') {
    return { isValid: false, errors: ['Assignments must be an object'] }
  }
  
  // Get currently assigned users (excluding client_hunt which can be assigned multiple times)
  const assignedUsers = {}
  
  Object.entries(assignments).forEach(([role, userIds]) => {
    if (!Array.isArray(userIds)) {
      errors.push(`${role} must have an array of user IDs`)
      return
    }
    
    userIds.forEach(userId => {
      if (typeof userId !== 'number') {
        errors.push(`User ID must be a number in ${role}`)
      }
      
      // Rule: One user cannot take multiple work categories except Client Hunting
      if (role !== 'client_hunt' && assignedUsers[userId]) {
        errors.push(`User ${userId} is assigned to multiple roles. Only Client Hunting can be assigned multiple times.`)
      }
      
      assignedUsers[userId] = role
    })
  })
  
  return { isValid: errors.length === 0, errors }
}

/**
 * Calculate equal share distribution among members
 * @param {number} roleAmount - Total amount for the role
 * @param {number} memberCount - Number of members to split among
 * @returns {number} Share per member
 */
const calculateEqualShare = (roleAmount, memberCount) => {
  if (memberCount <= 0) {
    throw new Error('Member count must be greater than 0')
  }
  
  return roleAmount / memberCount
}

/**
 * Validate share percentages sum to 100
 * @param {Array<number>} percentages - Array of share percentages
 * @returns {Object} Validation result
 */
const validateSharePercentages = (percentages) => {
  if (!Array.isArray(percentages)) {
    return { isValid: false, error: 'Percentages must be an array' }
  }
  
  const sum = percentages.reduce((acc, p) => acc + p, 0)
  const tolerance = 0.01 // Allow small floating point errors
  const isValid = Math.abs(sum - 100) < tolerance
  
  return { 
    isValid, 
    error: isValid ? null : `Percentages sum to ${sum.toFixed(2)}% instead of 100%` 
  }
}

/**
 * Calculate profit summary for all roles in a project
 * @param {Object} revenueSettings - Revenue percentage settings
 * @param {number} netRevenue - Net revenue amount
 * @returns {Object} Detailed breakdown of all role revenues
 */
const calculateFullBreakdown = (revenueSettings, netRevenue) => {
  const breakdown = {
    quotation: calculateRoleRevenue(netRevenue, revenueSettings.quotationPercentage),
    marketing: calculateRoleRevenue(netRevenue, revenueSettings.marketingPercentage),
    graphics: calculateRoleRevenue(netRevenue, revenueSettings.graphicsPercentage),
    clientHunt: calculateRoleRevenue(netRevenue, revenueSettings.clientHuntPercentage),
    qa: calculateRoleRevenue(netRevenue, revenueSettings.qaPercentage),
    secondary: calculateRoleRevenue(netRevenue, revenueSettings.secondaryPercentage),
    core: calculateRoleRevenue(netRevenue, revenueSettings.corePercentage),
    reserve: calculateRoleRevenue(netRevenue, revenueSettings.reservePercentage),
  }
  
  return {
    breakdown,
    total: Object.values(breakdown).reduce((a, b) => a + b, 0),
  }
}

/**
 * Get revenue role metadata
 * @returns {Array} Array of role objects with display info
 */
const getRevenueRoles = () => {
  return [
    { key: 'quotation', label: 'Quotation Creation', color: '#3B82F6' },
    { key: 'marketing', label: 'Marketing Support', color: '#8B5CF6' },
    { key: 'graphics', label: 'Graphics Work', color: '#EC4899' },
    { key: 'client_hunt', label: 'Client Hunting/Achieving', color: '#F59E0B' },
    { key: 'qa', label: 'Quality Assurance (QA)', color: '#10B981' },
    { key: 'secondary', label: 'Secondary Major Work', color: '#06B6D4' },
    { key: 'core', label: 'Core Work', color: '#EF4444' },
  ]
}

/**
 * Format currency for display
 * @param {number} amount - Amount in smallest currency unit
 * @param {string} currency - Currency code (default: BDT)
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = 'BDT') => {
  return `${currency} ${amount.toLocaleString('en-BD', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
}

export {
  calculateNetRevenue,
  calculateRoleRevenue,
  calculateMemberRevenue,
  calculateReserveRevenue,
  validateAssignments,
  calculateEqualShare,
  validateSharePercentages,
  calculateFullBreakdown,
  getRevenueRoles,
  formatCurrency,
}
