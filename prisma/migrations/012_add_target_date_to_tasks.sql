-- Add target_date column to tasks (for "Add to Todo" feature)
-- Run manually for existing DBs: npx wrangler d1 execute todo --local --file=prisma/migrations/012_add_target_date_to_tasks.sql
ALTER TABLE "tasks" ADD COLUMN "target_date" DATETIME;
