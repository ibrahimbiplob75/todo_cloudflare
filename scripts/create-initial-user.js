/**
 * Script to create the initial user in D1 database
 * Run with: wrangler d1 execute todo --local --command="INSERT INTO users (name, email, password) VALUES ('shefat', 'myphoto288@gmail.com', '11221122');"
 * Or use: npm run create:user
 */

// This script is meant to be run via wrangler CLI
// For programmatic execution, you would need to use the D1 API or run migrations

console.log(`
To create the initial user, run one of these commands:

For local development:
  wrangler d1 execute todo --local --file=./prisma/migrations/001_create_users.sql
  wrangler d1 execute todo --local --command="INSERT INTO users (name, email, password) VALUES ('shefat', 'myphoto288@gmail.com', '11221122');"

For production:
  wrangler d1 execute todo --file=./prisma/migrations/001_create_users.sql
  wrangler d1 execute todo --command="INSERT INTO users (name, email, password) VALUES ('shefat', 'myphoto288@gmail.com', '11221122');"

Or use the API endpoint:
  POST /api/users
  Body: { "name": "shefat", "email": "myphoto288@gmail.com", "password": "11221122" }
`);
