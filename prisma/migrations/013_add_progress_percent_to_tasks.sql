-- Add progress_percent column to tasks for task progress tracking
-- Run manually for existing DBs: npx wrangler d1 execute todo --local --file=prisma/migrations/013_add_progress_percent_to_tasks.sql
ALTER TABLE "tasks" ADD COLUMN "progress_percent" INTEGER NOT NULL DEFAULT 0;
