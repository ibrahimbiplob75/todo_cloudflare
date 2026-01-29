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
  "id",
  "title",
  "description",
  "creator",
  "created_at",
  "updated_at"
) VALUES
  (1, 'Project 1', 'Description 1', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "projects" (
  "id",
  "title",
  "description",
  "creator",
  "created_at",
  "updated_at"
) VALUES
  (2, 'Project 2', 'Description 2', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "tasks" (
  "project_id",
  "project_meeting_id",
  "parent_task_id",
  "title",
  "description",
  "priority",
  "task_status",
  "submission_date",
  "execution_date",
  "completion_date",
  "assigned_to",
  "created_at",
  "updated_at"
) VALUES
  (
    1, 
    1, 
    NULL, 
    'Design User Interface', 
    'Create mockups and wireframes for the main dashboard', 
    'high', 
    'in_progress', 
    datetime('now', '-10 days'), 
    datetime('now', '-6 days'), 
    datetime('now', '-4 days'),
    (SELECT id FROM users WHERE email = 'myphoto288@gmail.com'), 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
  );
