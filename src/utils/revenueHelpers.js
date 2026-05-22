/**
 * Revenue Calculations Composable
 * Provides revenue-related calculations for frontend
 */

/**
 * Format currency for display
 */
const formatCurrency = (amount, currency = 'BDT') => {
  if (typeof amount !== 'number') return `${currency} 0.00`
  
  return `${currency} ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Get revenue role display information
 */
const getRevenueRoles = () => {
  return [
    { key: 'quotation', label: 'Quotation Creation', percentage: 2, color: '#3B82F6' },
    { key: 'marketing', label: 'Marketing Support', percentage: 5, color: '#8B5CF6' },
    { key: 'graphics', label: 'Graphics Work', percentage: 5, color: '#EC4899' },
    { key: 'client_hunt', label: 'Client Hunting/Achieving', percentage: 5, color: '#F59E0B' },
    { key: 'qa', label: 'Quality Assurance (QA)', percentage: 8, color: '#10B981' },
    { key: 'secondary', label: 'Secondary Major Work', percentage: 10, color: '#06B6D4' },
    { key: 'core', label: 'Core Work', percentage: 25, color: '#EF4444' },
  ]
}

/**
 * Get role label by key
 */
const getRoleLabel = (roleKey) => {
  const role = getRevenueRoles().find(r => r.key === roleKey)
  return role ? role.label : roleKey
}

/**
 * Get role color by key
 */
const getRoleColor = (roleKey) => {
  const role = getRevenueRoles().find(r => r.key === roleKey)
  return role ? role.color : '#999999'
}

/**
 * Calculate percentage of amount
 */
const calculatePercentage = (amount, percentage) => {
  return (amount * percentage) / 100
}

/**
 * Format change type for display
 */
const getChangeTypeLabel = (changeType) => {
  const labels = {
    'amount_change': 'Amount Updated',
    'expense_change': 'Expense Updated',
    'assignment_change': 'Assignment Updated',
    'settings_change': 'Settings Changed',
  }
  return labels[changeType] || changeType
}

export {
  formatCurrency,
  getRevenueRoles,
  getRoleLabel,
  getRoleColor,
  calculatePercentage,
  getChangeTypeLabel,
}
