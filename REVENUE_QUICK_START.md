# Revenue Module - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Apply Database Migration
```bash
npm run migrate
```

### Step 2: Access as Watcher
1. Log in with a watcher account
2. Go to **Revenue Settings** (in sidebar)
3. Review default percentages (should sum to 100%)
4. Click **Save Settings** if you make changes

### Step 3: Add Revenue to a Project
1. Go to any **Project**
2. Scroll to **Revenue** tab
3. Enter:
   - Total Project Amount (e.g., 100,000)
   - Total Expenses (e.g., 10,000)
4. System calculates Net Revenue automatically
5. Tab shows all key metrics

### Step 4: Assign Team Members
1. In Revenue Dashboard, click **+ Assign Members**
2. Select a role (e.g., "Core Work")
3. Click **+ Add Member** to add team members
4. Enter each member's share percentage
5. Percentages must sum to 100%
6. Click **Assign Members**

### Step 5: View Results
- **Dashboard Tab**: See pie chart and breakdown
- **Member Earnings Tab**: View each member's earnings
- **History Tab**: See all changes with timestamps

---

## 📊 Example: Quick Calculation

**Project Data:**
- Amount: 100,000 BDT
- Expense: 10,000 BDT
- **Net Revenue: 90,000 BDT** ✅

**Default Distribution:**
```
Quotation (2%)    → 1,800 BDT
Marketing (5%)    → 4,500 BDT
Graphics (5%)     → 4,500 BDT (or to Reserve if unused)
Client Hunt (5%)  → 4,500 BDT
QA (8%)          → 7,200 BDT
Secondary (10%)   → 9,000 BDT
Core (25%)       → 22,500 BDT
Reserve (40%)    → 36,000 BDT (+ unused amounts)
```

**Example: Assign 2 people to QA (8% = 7,200 BDT)**
- Person A: 60% → 4,320 BDT
- Person B: 40% → 2,880 BDT

---

## 🎯 Common Tasks

### View Project Revenue
1. Project → Revenue Tab → Dashboard
2. See all key metrics in summary cards

### Update Project Amount
1. Project → Revenue Tab
2. Change "Total Project Amount"
3. All calculations update automatically
4. History automatically records the change

### Change Member Assignment
1. Project → Revenue Tab → Dashboard
2. Click "+ Assign Members" again
3. Select same role
4. Replace members and percentages
5. Click "Assign Members"

### Check Member Earnings
1. Project → Revenue Tab → Member Earnings
2. See each member's total earnings
3. View role-wise breakdown

### See All Changes
1. Project → Revenue Tab → History
2. Scroll through timeline
3. See before/after for each change
4. Click "Next" for older changes

### Adjust Distribution Percentages
1. Sidebar → Revenue Settings
2. Change any percentage
3. Must sum to 100%
4. Click "Save Settings"
5. All projects recalculate automatically

---

## 🔑 Key Points to Remember

✅ **Percentages must always sum to 100%**
- Revenue Settings: All 8 percentages
- Member assignments: All members' shares

✅ **Unused roles go to Reserve**
- If Graphics not used, its 5% → Company Reserve
- Unused amounts automatically added

✅ **Multiple members can share a role**
- Except Client Hunting (can have multi-role)
- Share percentages must sum to 100%

✅ **Only Watchers can**
- Change revenue settings
- Assign members to roles

✅ **All users can**
- View project revenue
- View member earnings
- See history

---

## 📱 On Mobile

Everything works on mobile:
- Swipe to navigate tabs
- Scroll modals
- Touch-friendly inputs
- Responsive cards

---

## ❓ Troubleshooting

**"Percentages must sum to 100%"**
→ Check your numbers add up to exactly 100%

**"Member share must equal 100%"**
→ When assigning members, their shares must sum to 100%

**Revenue not saving**
→ Check error message for specific issue
→ Ensure all required fields filled

**Member not showing earnings**
→ Check they're assigned in Dashboard tab
→ Reload page if needed

---

## 🔗 Navigation Paths

| Task | Path |
|------|------|
| Revenue Settings | Sidebar → Revenue Settings |
| Project Revenue | Projects → Select Project → Revenue Tab |
| Member Earnings | Project → Revenue → Member Earnings Tab |
| Change History | Project → Revenue → History Tab |

---

## 📞 Need Help?

Refer to:
- `docs/REVENUE_MODULE.md` - Complete documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- Check browser console for error messages
- Review history tab to trace changes

---

**That's it! You're ready to manage revenue distribution.** 🎉
