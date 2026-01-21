-- Insert 10 demo tasks with project_id = 1
INSERT INTO "users" (
  "name",
  "email",
  "password",
  "created_at",
  "updated_at"
) VALUES
  ('shefat', 'myphoto288@gmail.com', '11221122', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  
INSERT INTO "projects" (
  "title",
  "description",
  "creator",
  "created_at",
  "updated_at"
) VALUES
  ('Project 1', 'Description 1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "projects" (
  "title",
  "description",
  "creator",
  "created_at",
  "updated_at"
) VALUES
  ('Project 2', 'Description 2', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "tasks" (
  "project_id",
  "title",
  "description",
  "priority",
  "task_status",
  "assigned_to",
  "created_at",
  "updated_at"
) VALUES
  (1, 'Design User Interface', 'Create mockups and wireframes for the main dashboard', 'high', 'in_progress', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 'Implement Authentication', 'Set up JWT-based authentication system', 'urgent', 'pending', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 'Database Schema Design', 'Design and implement database schema for all entities', 'high', 'completed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 'API Endpoints Development', 'Create RESTful API endpoints for all features', 'mid', 'in_progress', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 'Frontend Components', 'Build reusable Vue components for the UI', 'mid', 'pending', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 'Testing Suite', 'Write unit and integration tests for all modules', 'low', 'pending', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 'Deployment Configuration', 'Set up CI/CD pipeline and deployment scripts', 'mid', 'pending', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 'Documentation', 'Write comprehensive documentation for the project', 'low', 'pending', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 'Performance Optimization', 'Optimize database queries and API response times', 'high', 'pending', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (1, 'Security Audit', 'Review and fix security vulnerabilities', 'urgent', 'pending', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
