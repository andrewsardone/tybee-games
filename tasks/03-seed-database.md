# Task 03: Seed Database with Sample Games for Development

**Status:** ✅ COMPLETED  
**Priority:** Medium  
**Dependencies:** Tasks 01, 02  

## Description
Populate the development database with sample games, game copies, and staff data using the existing `src/database/seed.ts` file as the single source of truth.

## Final Implementation
✅ **CLI Script Approach** - Clean separation between app logic and development tooling

### Solution Overview
- Created `scripts/seed.ts` that connects to local D1 database using `better-sqlite3`
- Uses `LOCAL_DB_PATH` environment variable set by package.json find command
- Leverages existing `src/database/seed.ts` as single source of truth for sample data
- Added `npm run db:seed` script for easy execution

### Key Implementation Details
1. **Environment-based configuration**: Uses `NODE_ENV=development` and `LOCAL_DB_PATH`
2. **Wrangler database discovery**: Package.json script uses `find` command to locate SQLite file
3. **Direct SQLite connection**: Uses `better-sqlite3` for local development database access
4. **Clean architecture**: No pollution of application code with seeding logic

### Package.json Script
```bash
"db:seed": "NODE_ENV=development LOCAL_DB_PATH=$(find .wrangler/state/v3/d1/miniflare-D1DatabaseObject -type f -name '*.sqlite' -print -quit) tsx scripts/seed.ts"
```

### Sample Data Included
- ✅ 6 sample games (Catan, Ticket to Ride, Azul, Wingspan, Codenames, Splendor)
- ✅ Multiple game copies for inventory testing
- ✅ Sample staff user for admin testing

## Implementation Inspiration
- [Kevin Kipp's D1 + Drizzle blog post](https://kevinkipp.com/blog/going-full-stack-on-astro-with-cloudflare-d1-and-drizzle/)
- [Drizzle ORM GitHub discussion](https://github.com/drizzle-team/drizzle-orm/discussions/1545#discussioncomment-8689233)

## Acceptance Criteria
- ✅ Database populated with sample data from `src/database/seed.ts`
- ✅ Can run with simple command like `npm run db:seed`
- ✅ Works with existing Cloudflare D1 configuration
- ✅ No duplication of seed data

## Files Created/Modified
- `scripts/seed.ts` - CLI script for database seeding
- `package.json` - Added `db:seed` script with environment setup
- `package-lock.json` - Added `better-sqlite3` and `tsx` dependencies

## Usage
```bash
npm run db:seed
```

This task is complete and ready for use in development workflow.