#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { seedDatabase } from '../src/database/seed';
import * as schema from '../src/database/schema';

async function main() {
  console.log('🌱 Seeding database with sample data...');

  if (process.env.NODE_ENV !== 'development') {
    console.error('❌ This script only works in development mode');
    console.error('Set NODE_ENV=development to run database seeding');
    process.exit(1);
  }

  const localDbPath = process.env.LOCAL_DB_PATH;
  if (!localDbPath) {
    console.error('❌ LOCAL_DB_PATH environment variable not set');
    console.error(
      'This should be automatically set by the package.json script'
    );
    process.exit(1);
  }

  try {
    console.log(`📍 Using local database: ${localDbPath}`);

    // Connect to local SQLite database
    const sqlite = new Database(localDbPath);
    const db = drizzle(sqlite, { schema });

    await seedDatabase(db);
    console.log('✅ Database seeded successfully!');

    sqlite.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('\nMake sure:');
    console.error('1. You have run database migrations: npm run db:migrate');
    console.error(
      '2. Wrangler has created the local database (try running `npm run dev` first)'
    );
    process.exit(1);
  }
}

main();
