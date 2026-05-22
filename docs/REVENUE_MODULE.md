# Revenue Distribution & Profit Share Management Module

A complete revenue distribution system for managing profit sharing across roles and team members in your project management system.

## Features

- **Dynamic Revenue Settings**: Configure distribution percentages for 8 different roles
- **Project-wise Revenue Management**: Track amount, expenses, and net revenue per project
- **Member Assignment System**: Assign multiple team members to roles with custom share percentages
- **Automatic Calculations**: Real-time profit distribution calculations
- **History Tracking**: Complete audit trail of all revenue changes
- **Member Earnings Dashboard**: View individual member earnings across projects
- **Responsive UI**: Fully responsive design for all devices

## Company Revenue Rules

Default distribution percentages:

| Role | Percentage | Description |
|------|-----------|-------------|
| Quotation Creation | 2% | Creating quotations for clients |
| Marketing Support | 5% | Marketing and promotion activities |
| Graphics Work | 5% | Design and graphics creation |
| Client Hunting/Achieving | 5% | Business development activities |
| Quality Assurance (QA) | 8% | Testing and quality checks |
| Secondary Major Work | 10% | Support development work |
| Core Work | 25% | Primary development work |
| Company Reserve | 40% | Company retention |

**Total: 100%**

## Database Schema

### RevenueSettings
Stores the percentage distribution configuration:
```sql
- quotationPercentage (REAL)
- marketingPercentage (REAL)
- graphicsPercentage (REAL)
- clientHuntPercentage (REAL)
- qaPercentage (REAL)
- secondaryPercentage (REAL)
- corePercentage (REAL)
- reservePercentage (REAL)
- updatedBy (INT FK to users)
- updatedAt (DATETIME)
```

### ProjectRevenue
Tracks project financial data:
```sql
- projectId (INT, UNIQUE FK to projects)
- totalAmount (FLOAT)
- expense (FLOAT)
- netRevenue (FLOAT) - calculated as totalAmount - expense
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

### RevenueAssignment
Maps roles to project:
```sql
- projectRevenueId (INT FK to project_revenues)
- role (STRING) - role key
- isUnused (BOOLEAN) - if true, amount goes to reserve
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

### RevenueMember
Assigns team members to role assignments:
```sql
- revenueAssignmentId (INT FK to revenue_assignments)
- userId (INT FK to users)
- sharePercentage (FLOAT) - 0-100
- amountEarned (FLOAT) - calculated amount
- createdAt (DATETIME)
- updatedAt (DATETIME)
```

### RevenueHistory
Audit trail of all changes:
```sql
- projectId (INT)
- projectRevenueId (INT FK to project_revenues)
- changeType (STRING) - 'amount_change', 'expense_change', 'assignment_change', 'settings_change'
- oldData (JSON)
- newData (JSON)
- changedBy (INT FK to users)
- createdAt (DATETIME)
```

## API Endpoints

### Revenue Settings
- **GET** `/revenue/settings` - Get current settings
- **PUT** `/revenue/settings` - Update settings (watcher only)

### Project Revenue
- **POST** `/project/:projectId/revenue` - Create/update project revenue
- **GET** `/project/:projectId/revenue` - Get project revenue details
- **PUT** `/project/:projectId/revenue` - Update project amounts

### Revenue Assignments
- **POST** `/project/:projectId/revenue/assign` - Assign members to role (watcher only)

### Profit Summary & History
- **GET** `/project/:projectId/profit-summary` - Get complete profit breakdown
- **GET** `/project/:projectId/revenue-history` - Get change history (paginated)

### User Earnings
- **GET** `/user/:userId/earnings` - Get user's earnings across all projects

## Frontend Components

### RevenueDashboard (`src/components/revenue/RevenueDashboard.vue`)
Main dashboard showing:
- Summary cards (total amount, expenses, net revenue, reserve)
- Revenue distribution pie chart
- Role assignments with member details
- Member assignment modal

**Props:**
- `projectId` (Number, required) - The project ID

**Features:**
- Real-time calculations
- Interactive pie chart
- Member assignment interface
- Automatic recalculation on changes

### RevenueSettingsPage (`src/components/revenue/RevenueSettingsPage.vue`)
Configuration page for distribution percentages:
- Individual percentage inputs for each role
- Real-time validation
- Example calculations
- Change history

**Features:**
- Watcher-only access
- Validation (must sum to 100%)
- Example calculations based on sample data
- Last updated timestamp

### MemberProfitTable (`src/components/revenue/MemberProfitTable.vue`)
Displays individual member earnings:
- Member name
- Assigned roles
- Share percentages
- Amount earned
- Total earnings calculation

### RevenueHistoryTimeline (`src/components/revenue/RevenueHistoryTimeline.vue`)
Shows complete history of changes:
- Change type and timestamp
- Before/after comparison
- User who made the change
- Pagination support

### ProjectRevenueView (`src/components/revenue/ProjectRevenueView.vue`)
Tabbed interface combining all components:
- Dashboard tab
- Member Earnings tab
- History tab

**Props:**
- `projectId` (Number, required)

## Frontend Utilities

### `src/utils/revenueHelpers.js`
Provides helper functions:
- `formatCurrency(amount, currency)` - Format currency display
- `getRevenueRoles()` - Get role configuration
- `getRoleLabel(roleKey)` - Get role display name
- `getRoleColor(roleKey)` - Get role color for charts
- `calculatePercentage(amount, percentage)` - Calculate percentage of amount
- `getChangeTypeLabel(changeType)` - Format change type for display

## Backend Services

### `server/services/revenueService.js`
Core business logic:
- `getRevenueSettings()` - Get or create default settings
- `updateRevenueSettings()` - Update percentage configuration
- `createOrUpdateProjectRevenue()` - Create/update project revenue with history
- `getProjectRevenue()` - Retrieve project revenue data
- `assignMembersToRole()` - Assign team members to role
- `getProfitSummary()` - Get complete profit breakdown
- `getRevenueHistory()` - Retrieve change history
- `getUserEarnings()` - Get user's earnings across projects

### `server/utils/revenueCalculations.js`
Calculation utilities:
- `calculateNetRevenue(totalAmount, expense)` - Net = Total - Expense
- `calculateRoleRevenue(netRevenue, percentage)` - Role amount = Net × %
- `calculateMemberRevenue(roleAmount, sharePercentage)` - Member amount = Role × %
- `calculateReserveRevenue()` - Include unused role amounts
- `validateAssignments()` - Validate role assignments
- `calculateEqualShare()` - Equal distribution among members
- `validateSharePercentages()` - Validate percentages sum to 100%
- `calculateFullBreakdown()` - Calculate all role revenues
- `getRevenueRoles()` - Get role metadata
- `formatCurrency()` - Format for display

## Routes

### `server/routes/revenueRoutes.js`
Handles all revenue-related endpoints with authentication and authorization checks.

## Integration with Projects

The revenue module is integrated into the project view:

1. Navigate to any project
2. Scroll to the "Revenue" tab in the project details
3. View and manage:
   - Revenue dashboard
   - Member profit distribution
   - Change history

## Access Control

- **Normal Users**: Can view revenue summaries and their own earnings
- **Watchers/Admins**: Can:
  - Create and update revenue settings
  - Assign members to roles
  - View all user earnings
  - Manage all project revenue

## Business Logic

### Revenue Calculation Flow

1. **Project Amount** - Initial project value
2. **Subtract Expenses** → **Net Revenue**
3. **Apply Distribution Percentages** → **Role Amounts**
4. **Distribute to Assigned Members** → **Member Earnings**

### Unused Roles Handling

If a role is not used in a project:
- Its percentage amount is added to Company Reserve
- Example: If Graphics is not used, its 5% goes to reserve (45% total reserve)

### Multiple Member Assignment

When multiple members are assigned to one role:
- **Default**: Equal split among members
- **Custom**: Define individual share percentages (must sum to 100%)

### Example Calculation

```
Project: 100,000 BDT
Expense: 10,000 BDT
Net Revenue: 90,000 BDT

Quotation (2%): 1,800 BDT
Marketing (5%): 4,500 BDT
Graphics (5%): Not used → 0 BDT
Client Hunt (5%): 4,500 BDT
QA (8%): 7,200 BDT → 2 members = 3,600 each
Secondary (10%): 9,000 BDT
Core (25%): 22,500 BDT → Ibrahim (70%) = 15,750, Nashid (30%) = 6,750
Reserve (40%): 36,000 BDT + 4,500 BDT (unused graphics) = 40,500 BDT
```

## File Structure

```
server/
├── routes/
│   └── revenueRoutes.js
├── services/
│   └── revenueService.js
└── utils/
    └── revenueCalculations.js

src/
├── components/revenue/
│   ├── RevenueDashboard.vue
│   ├── RevenueSettingsPage.vue
│   ├── MemberProfitTable.vue
│   ├── RevenueHistoryTimeline.vue
│   └── ProjectRevenueView.vue
└── utils/
    └── revenueHelpers.js
```

## Migration

Run database migration to create revenue tables:
```bash
npm run migrate
```

The migration file `015_create_revenue_tables.sql` creates:
- `revenue_settings`
- `project_revenues`
- `revenue_assignments`
- `revenue_members`
- `revenue_history`

With default revenue settings inserted automatically.

## Environment Variables

No additional environment variables needed. Uses existing:
- `VITE_API_BASE_URL` - API endpoint
- `Authorization` - Bearer token from localStorage

## Error Handling

- Validates percentages sum to 100%
- Validates share distributions equal 100%
- Handles missing revenue records gracefully
- Validates user access permissions
- Provides detailed error messages

## Future Enhancements

- [ ] Export revenue reports as PDF
- [ ] Tax calculation support
- [ ] Multi-currency support
- [ ] Recurring revenue templates
- [ ] Advanced analytics and forecasting
- [ ] Approval workflow for revenue changes
- [ ] Direct payment integration

## Support

For issues or questions about the revenue module, check:
1. Console logs for API errors
2. History tab for recent changes
3. Backend error responses in network tab

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Company**: Intellisoft.IT
