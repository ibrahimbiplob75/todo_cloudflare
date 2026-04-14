-- Add role column to users table for role-based access control
-- Supported roles: user, watcher (admin)
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';
