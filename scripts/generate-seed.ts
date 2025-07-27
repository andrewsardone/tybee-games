#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { getTableColumns } from 'drizzle-orm';
import {
  gameCopies,
  staffUsers,
  type NewGameCopy,
  type NewStaffUser,
} from '../src/database/schema.js';

// Note: Games data is now managed in Google Sheets, not seeded in database
// This seed script only creates game copies that reference games from Google Sheets

// Type-safe game copies data
const gameCopiesData: NewGameCopy[] = [
  // Settlers of Catan - 2 copies
  {
    id: 'settlers-copy-1',
    gameId: 'settlers-of-catan',
    copyNumber: 1,
    location: 'Shelf A-1',
    status: 'available',
    condition: 'excellent',
    totalCheckouts: 0,
  },
  {
    id: 'settlers-copy-2',
    gameId: 'settlers-of-catan',
    copyNumber: 2,
    location: 'Shelf A-1',
    status: 'available',
    condition: 'excellent',
    totalCheckouts: 0,
  },

  // Ticket to Ride - 2 copies
  {
    id: 'ticket-copy-1',
    gameId: 'ticket-to-ride',
    copyNumber: 1,
    location: 'Shelf A-2',
    status: 'available',
    condition: 'excellent',
    totalCheckouts: 0,
  },
  {
    id: 'ticket-copy-2',
    gameId: 'ticket-to-ride',
    copyNumber: 2,
    location: 'Shelf A-2',
    status: 'available',
    condition: 'excellent',
    totalCheckouts: 0,
  },

  // Azul - 1 copy
  {
    id: 'azul-copy-1',
    gameId: 'azul',
    copyNumber: 1,
    location: 'Shelf B-1',
    status: 'available',
    condition: 'excellent',
    totalCheckouts: 0,
  },

  // Wingspan - 1 copy
  {
    id: 'wingspan-copy-1',
    gameId: 'wingspan',
    copyNumber: 1,
    location: 'Shelf B-2',
    status: 'available',
    condition: 'excellent',
    totalCheckouts: 0,
  },

  // Codenames - 3 copies (popular party game)
  {
    id: 'codenames-copy-1',
    gameId: 'codenames',
    copyNumber: 1,
    location: 'Shelf C-1',
    status: 'available',
    condition: 'excellent',
    totalCheckouts: 0,
  },
  {
    id: 'codenames-copy-2',
    gameId: 'codenames',
    copyNumber: 2,
    location: 'Shelf C-1',
    status: 'available',
    condition: 'excellent',
    totalCheckouts: 0,
  },
  {
    id: 'codenames-copy-3',
    gameId: 'codenames',
    copyNumber: 3,
    location: 'Shelf C-1',
    status: 'available',
    condition: 'excellent',
    totalCheckouts: 0,
  },

  // Splendor - 1 copy
  {
    id: 'splendor-copy-1',
    gameId: 'splendor',
    copyNumber: 1,
    location: 'Shelf B-3',
    status: 'available',
    condition: 'excellent',
    totalCheckouts: 0,
  },
];

// Type-safe staff users data
const sampleStaffData: NewStaffUser[] = [
  {
    id: 'staff-1',
    googleId: 'sample-google-id',
    email: 'staff@poolturtle.com',
    name: 'Sample Staff Member',
    role: 'admin',
    isActive: true,
  },
];

// Helper functions for type-safe SQL generation
function escapeSQL(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  return String(value);
}

// Type-safe function to generate SQL using Drizzle table definitions
function generateTypeSafeInsertSQL<T extends Record<string, any>>(
  table: any,
  tableName: string,
  data: T[]
): string {
  if (data.length === 0) return '';

  // Get the actual column names from the Drizzle table definition
  const columns = getTableColumns(table);
  const columnNames = Object.keys(columns);

  // Map TypeScript property names to database column names
  const values = data
    .map((row) => {
      const mappedValues = columnNames.map((colName) => {
        // Use the TypeScript property name as key to get the value
        const value = row[colName];
        return escapeSQL(value);
      });
      return `(${mappedValues.join(', ')})`;
    })
    .join(',\n  ');

  const dbColumnNames = columnNames.map((colName) => columns[colName].name);
  return `INSERT INTO ${tableName} (${dbColumnNames.join(', ')}) VALUES\n  ${values};`;
}

function generateSeedSQL(): string {
  const sql = [
    '-- Generated seed data for Tybee Games',
    '-- This file is auto-generated from scripts/generate-seed.ts',
    '-- Do not edit manually - edit the TypeScript source instead',
    '',
    '-- NOTE: Games data is now managed in Google Sheets, not in database',
    '-- This seed only creates game copies and staff data',
    '',
    '-- Clear existing data (in dependency order)',
    'DELETE FROM checkout_analytics;',
    'DELETE FROM checkouts;',
    'DELETE FROM game_copies;',
    'DELETE FROM staff_users;',
    '',
    '-- Insert game copies (these reference games from Google Sheets)',
    generateTypeSafeInsertSQL(gameCopies, 'game_copies', gameCopiesData),
    '',
    '-- Insert sample staff',
    generateTypeSafeInsertSQL(staffUsers, 'staff_users', sampleStaffData),
    '',
  ];

  return sql.join('\n');
}

function main() {
  const seedSQL = generateSeedSQL();
  const outputPath = path.join(process.cwd(), 'tmp/seed.sql');

  // Write to file
  fs.writeFileSync(outputPath, seedSQL, 'utf8');
  console.log(`✅ Generated seed SQL at: ${outputPath}`);

  // Also output to stdout if requested
  if (process.argv.includes('--stdout')) {
    console.log('\n' + seedSQL);
  }
}

main();
