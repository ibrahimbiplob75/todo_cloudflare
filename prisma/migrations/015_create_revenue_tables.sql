-- Create revenue settings table
CREATE TABLE IF NOT EXISTS revenue_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_percentage REAL NOT NULL DEFAULT 2.0,
  marketing_percentage REAL NOT NULL DEFAULT 5.0,
  graphics_percentage REAL NOT NULL DEFAULT 5.0,
  client_hunt_percentage REAL NOT NULL DEFAULT 5.0,
  qa_percentage REAL NOT NULL DEFAULT 8.0,
  secondary_percentage REAL NOT NULL DEFAULT 10.0,
  core_percentage REAL NOT NULL DEFAULT 25.0,
  reserve_percentage REAL NOT NULL DEFAULT 40.0,
  updated_by INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create project revenue table
CREATE TABLE IF NOT EXISTS project_revenues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  total_amount REAL NOT NULL,
  expense REAL NOT NULL DEFAULT 0.0,
  net_revenue REAL NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_revenues_project_id ON project_revenues(project_id);

-- Create revenue assignments table
CREATE TABLE IF NOT EXISTS revenue_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  project_revenue_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  is_unused BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_revenue_id) REFERENCES project_revenues(id) ON DELETE CASCADE,
  UNIQUE(project_revenue_id, role)
);

CREATE INDEX IF NOT EXISTS idx_revenue_assignments_project_id ON revenue_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_revenue_assignments_project_revenue_id ON revenue_assignments(project_revenue_id);

-- Create revenue members table
CREATE TABLE IF NOT EXISTS revenue_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  revenue_assignment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  share_percentage REAL NOT NULL DEFAULT 0.0,
  amount_earned REAL NOT NULL DEFAULT 0.0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (revenue_assignment_id) REFERENCES revenue_assignments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_revenue_members_assignment_id ON revenue_members(revenue_assignment_id);
CREATE INDEX IF NOT EXISTS idx_revenue_members_user_id ON revenue_members(user_id);

-- Create revenue history table
CREATE TABLE IF NOT EXISTS revenue_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  project_revenue_id INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  old_data TEXT,
  new_data TEXT,
  changed_by INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_revenue_id) REFERENCES project_revenues(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_revenue_history_project_id ON revenue_history(project_id);
CREATE INDEX IF NOT EXISTS idx_revenue_history_project_revenue_id ON revenue_history(project_revenue_id);
CREATE INDEX IF NOT EXISTS idx_revenue_history_created_at ON revenue_history(created_at);

-- Insert default revenue settings
INSERT OR IGNORE INTO revenue_settings (id) VALUES (1);
