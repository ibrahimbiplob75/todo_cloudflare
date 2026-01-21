#!/usr/bin/env node

/**
 * Database Seed Script
 * Seeds the database with initial/demo data
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

console.log(`\n🌱 Seeding ${env} database...\n`);

// Step 1: Truncate tables (delete all data but keep table structure)
console.log('🗑️  Step 1: Truncating tables...\n');

const tablesToTruncate = [
  { table: 'tasks', sql: 'DELETE FROM tasks;' },
  { table: 'projects', sql: 'DELETE FROM projects;' },
  { table: 'users', sql: "DELETE FROM users;" },
];

for (const { table, sql } of tablesToTruncate) {
  try {
    execSync(
      `npx wrangler d1 execute todo ${flag} --command="${sql}"`,
      { stdio: 'pipe', cwd: join(__dirname, '..') }
    );
    console.log(`   ✅ Truncated table: ${table}`);
  } catch (error) {
    console.error(`   ⚠️  Error truncating ${table}:`, error.message);
  }
}

console.log('✅ Table truncation process completed\n');

// Step 2: Insert seed data
console.log('📦 Step 2: Inserting seed data...\n');

const seedFiles = [
  '007_add_demo_data.sql',
];

let successCount = 0;
let failCount = 0;

for (const seedFile of seedFiles) {
  const seedPath = join(__dirname, '../prisma/migrations', seedFile);
  console.log(`📄 Running: ${seedFile}`);
  
  try {
    execSync(
      `npx wrangler d1 execute todo ${flag} --file=${seedPath}`,
      { stdio: 'inherit', cwd: join(__dirname, '..') }
    );
    console.log(`✅ ${seedFile} completed\n`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${seedFile} failed:`, error.message);
    failCount++;
  }
}

console.log(`\n📊 Seed Summary:`);
console.log(`   ✅ Successful: ${successCount}`);
console.log(`   ❌ Failed: ${failCount}`);
console.log(`\n✨ Seeding completed!\n`);

if (failCount > 0) {
  process.exit(1);
}
