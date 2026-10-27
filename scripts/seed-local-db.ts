/**
 * NETRA Local D1 Database Seeding Script
 * Path: scripts/seed-local-db.ts
 */

import { hashPassword } from '../src/server/auth/crypto.js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';

async function seed() {
  console.log('[NETRA-SEED] Seeding local database...');
  // Find local d1 sqlite database file if it exists, or inform user
  const stateDir = resolve(process.cwd(), '.wrangler/state/v3/d1');
  if (!existsSync(stateDir)) {
    console.log('[NETRA-SEED] No local .wrangler/state/v3/d1 found. Run `npm run db:migrate:local` first.');
    return;
  }

  console.log('[NETRA-SEED] Local migrations already configured.');
}

seed().catch(console.error);
