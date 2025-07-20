# Task 03: Seed Database with Sample Games for Development

**Status:** 🔄 IN PROGRESS  
**Priority:** Medium  
**Dependencies:** Tasks 01, 02  

## Description
Populate the development database with sample games, game copies, and staff data using the existing `src/database/seed.ts` file as the single source of truth.

## Current State
- ✅ Created `src/database/seed.ts` with sample data including:
  - 6 sample games (Catan, Ticket to Ride, Azul, Wingspan, Codenames, Splendor)
  - Multiple game copies for inventory testing
  - Sample staff user for admin testing
- ❌ Seeding mechanism not yet working properly

## Challenges Encountered
1. Initial approach tried to use Wrangler worker scripts but ran into module compatibility issues
2. Need to find the right way to execute the seed function using existing Drizzle/D1 setup
3. Want to avoid duplicating seed data - keep `src/database/seed.ts` as single source of truth

## Possible Approaches
1. **HTTP Endpoint Approach**: Add `/seed` endpoint to main Hono app that calls `seedDatabase()` function
2. **Wrangler Command Approach**: Use `wrangler d1 execute` with generated SQL from seed data
3. **CLI Script Approach**: Create a proper CLI script that connects to D1 and runs seed function

## Acceptance Criteria
- [ ] Database populated with sample data from `src/database/seed.ts`
- [ ] Can run with simple command like `npm run db:seed`
- [ ] Works with existing Cloudflare D1 configuration
- [ ] No duplication of seed data

## Files Involved
- `src/database/seed.ts` - Source of truth for seed data
- `src/database/connection.ts` - Database connection helper
- `scripts/seed-database.ts` - Attempted seed script (needs fixing)

## Environment Context
- Database ID: `a6483d3d-691b-46f8-ada8-6cdaf3383647`
- Database name: `prod-d1-pool-turtle-tybee-games-atlas`
- Cloudflare credentials configured in `.env` file

## Next Steps
Choose and implement one of the approaches above to get the database seeded with sample data for development.