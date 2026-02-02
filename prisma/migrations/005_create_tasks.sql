-- CreateTable
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serial" INTEGER DEFAULT 1,
    "project_id" INTEGER,
    "project_meeting_id" INTEGER,
    "parent_task_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'mid',
    "task_status" TEXT NOT NULL DEFAULT 'pending',
    "submission_date" DATETIME,
    "target_date" DATETIME,
    "execution_date" DATETIME,
    "completion_date" DATETIME,
    "total_duration" INTEGER DEFAULT 0,
    "assigned_to" INTEGER,
    "comment" TEXT,
    "status" TINYINT NOT NULL DEFAULT 1, -- 1: active, 0: inactive
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance (as per plan.md)
CREATE INDEX IF NOT EXISTS "idx_tasks_project_id" ON "tasks"("project_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_project_meeting_id" ON "tasks"("project_meeting_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_assigned_to" ON "tasks"("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_tasks_status" ON "tasks"("task_status");
CREATE INDEX IF NOT EXISTS "idx_tasks_priority" ON "tasks"("priority");
CREATE INDEX IF NOT EXISTS "idx_tasks_submission_date" ON "tasks"("submission_date");
CREATE INDEX IF NOT EXISTS "idx_tasks_assigned_status" ON "tasks"("assigned_to", "task_status");
CREATE INDEX IF NOT EXISTS "idx_tasks_status_submission_date" ON "tasks"("task_status", "submission_date");
CREATE INDEX IF NOT EXISTS "idx_tasks_project_status_date" ON "tasks"("project_id", "task_status", "submission_date");
CREATE INDEX IF NOT EXISTS "idx_tasks_task_status_serial" ON "tasks"("task_status", "serial");
