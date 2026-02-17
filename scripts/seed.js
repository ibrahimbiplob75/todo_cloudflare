#!/usr/bin/env node

/**
 * Database Seed Script
 * Drops all tables → creates tables from migrations → seeds demo data
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isRemote = process.argv.includes('--remote') || process.argv.includes('--prod');
const env = isRemote ? 'remote' : 'local';
const flag = isRemote ? '--remote' : '--local';
const migrationsDir = join(__dirname, '../prisma/migrations');
const projectRoot = join(__dirname, '..');

function run(cmd, inherit = false) {
  return execSync(cmd, { cwd: projectRoot, stdio: inherit ? 'inherit' : 'pipe' });
}

console.log(`\n🌱 Seed ${env} database (drop → create → seed)\n`);

// Step 1: Drop all tables (dependents first)
console.log('🗑️  Step 1: Dropping all tables...\n');

const tablesToDrop = ['project_meetings', 'tasks', 'projects', 'users'];

for (const table of tablesToDrop) {
  try {
    run(`npx wrangler d1 execute todo ${flag} --command="DROP TABLE IF EXISTS ${table};"`);
    console.log(`   ✅ Dropped: ${table}`);
  } catch (e) {
    console.log(`   ⚠️  ${table} (skip)`);
  }
}

console.log('✅ Drop completed\n');

// Step 2: Create tables from migrations
console.log('📦 Step 2: Creating tables...\n');

const createMigrations = [
  '001_create_users.sql',
  '004_create_projects.sql',
  '005_create_tasks.sql',
  '008_create_project_meetings.sql',
];

for (const m of createMigrations) {
  const p = join(migrationsDir, m);
  console.log(`📄 ${m}`);
  try {
    run(`npx wrangler d1 execute todo ${flag} --file=${p}`, true);
    console.log(`✅ ${m} done\n`);
  } catch (e) {
    console.error(`❌ ${m} failed:`, e.message);
    process.exit(1);
  }
}

console.log('✅ Create completed\n');

// Step 3: Seed data (007 = users/projects/tasks, 009 = meetings)
console.log('🌱 Step 3: Seeding data...\n');

const seedFiles = ['007_add_demo_data.sql', '009_add_meeting_seed.sql'];

for (const f of seedFiles) {
  const p = join(migrationsDir, f);
  console.log(`📄 ${f}`);
  try {
    run(`npx wrangler d1 execute todo ${flag} --file="${p}"`, true);
    console.log(`✅ "${f}" done\n`);
  } catch (e) {
    console.error(`❌ ${f} failed:`, e.message);
    process.exit(1);
  }
}

console.log('✨ Seed completed.\n');
