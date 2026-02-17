#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs all migrations in order for local or production database
 */

import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationsDir = join(__dirname, '../prisma/migrations');
const isRemote = process.argv.includes('--remote') || process.argv.includes('--prod');
const env = isRemote ? 'remote' : 'local';
const flag = isRemote ? '--remote' : '--local';

console.log(`\n🚀 Running migrations for ${env} database...\n`);

// Step 1: Drop all tables
console.log('🗑️  Step 1: Dropping all existing tables...\n');

const tablesToDrop = ['project_meetings', 'tasks', 'projects', 'users'];

for (const table of tablesToDrop) {
  try {
    execSync(
      `npx wrangler d1 execute todo ${flag} --command="DROP TABLE IF EXISTS ${table};"`,
      { stdio: 'pipe', cwd: join(__dirname, '..') }
    );
    console.log(`   ✅ Dropped table: ${table}`);
  } catch (error) {
    // Ignore errors - table may not exist
    console.log(`   ⚠️  Table ${table} may not exist (skipping)`);
  }
}

console.log('✅ Table drop process completed\n');

// Step 2: Run migrations to create tables
console.log('📦 Step 2: Creating tables from migrations...\n');

// Migration files in order
const migrations = [
  '001_create_users.sql',
  '004_create_projects.sql',
  '005_create_tasks.sql',
  '008_create_project_meetings.sql',
];

// Get all SQL files from migrations directory
const allMigrations = readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql') && !file.includes('seed') && !file.includes('demo'))
  .sort();

// Use ordered migrations if they exist, otherwise use all sorted migrations
const migrationsToRun = migrations.filter(m => allMigrations.includes(m));

if (migrationsToRun.length === 0) {
  console.log('⚠️  No migrations found!');
  process.exit(1);
}

console.log(`Found ${migrationsToRun.length} migration(s) to run:\n`);

let successCount = 0;
let failCount = 0;

for (const migration of migrationsToRun) {
  const migrationPath = join(migrationsDir, migration);
  console.log(`📄 Running: ${migration}`);
  
  try {
    execSync(
      `npx wrangler d1 execute todo ${flag} --file="${migrationPath}"`,
      { stdio: 'inherit', cwd: join(__dirname, '..') }
    );
    console.log(`✅ ${migration} completed\n`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${migration} failed:`, error.message);
    failCount++;
    // Continue with next migration even if one fails
  }
}

console.log(`\n📊 Migration Summary:`);
console.log(`   ✅ Successful: ${successCount}`);
console.log(`   ❌ Failed: ${failCount}`);
console.log(`\n✨ Migration process completed!\n`);

if (failCount > 0) {
  process.exit(1);
}
