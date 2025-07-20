# Tybee Games Development Tasks

This directory contains detailed task specifications for implementing the Tybee Games application. Each task is self-contained with requirements, implementation details, and acceptance criteria.

## Task Overview

### Phase 1: Foundation ✅

- **[01-database-setup.md](01-database-setup.md)** - ✅ **COMPLETED** - Drizzle ORM + D1 database setup
- **[02-typescript-models.md](02-typescript-models.md)** - ✅ **COMPLETED** - Type-safe data models
- **[03-seed-database.md](03-seed-database.md)** - 🔄 **IN PROGRESS** - Sample data seeding

### Phase 2: Core Customer Experience

- **[04-game-browsing.md](04-game-browsing.md)** - ⏳ **PENDING** - HTMX game catalog (HIGH PRIORITY)
- **[05-game-filtering.md](05-game-filtering.md)** - ⏳ **PENDING** - Search and filtering
- **[06-checkout-flow.md](06-checkout-flow.md)** - ⏳ **PENDING** - Game checkout process (HIGH PRIORITY)
- **[07-game-return.md](07-game-return.md)** - ⏳ **PENDING** - Return with privacy-first data purging (HIGH PRIORITY)
- **[08-recommendation-engine.md](08-recommendation-engine.md)** - ⏳ **PENDING** - Game suggestion algorithm

### Phase 3: Admin Features

- **[09-google-oauth.md](09-google-oauth.md)** - ⏳ **PENDING** - Staff authentication
- **[10-admin-crud.md](10-admin-crud.md)** - ⏳ **PENDING** - Games/inventory management

### Phase 4: Enhanced Features

- **[11-real-time-updates.md](11-real-time-updates.md)** - ⏳ **PENDING** - SSE for live availability (LOW PRIORITY)
- **[12-pwa-features.md](12-pwa-features.md)** - ⏳ **PENDING** - Offline capabilities (LOW PRIORITY)

## Current State

### ✅ Completed

- Database schema with all entities (games, copies, checkouts, staff, analytics)
- TypeScript type definitions using Drizzle ORM
- Database migrations applied to Cloudflare D1
- Project structure and configuration

### 🔄 In Progress

- **Task 03**: Database seeding mechanism needs to be completed
  - Sample data exists in `src/database/seed.ts`
  - Need to implement proper seeding approach using existing config

### 🎯 Next Recommended Task

**Task 04: Game Browsing** - This is the core customer-facing feature and unblocks most other development.

## Dependencies

```
01 (Database) → 02 (Types) → 03 (Seed Data)
                                ↓
04 (Browsing) ← 05 (Filtering) ← 08 (Recommendations)
    ↓
06 (Checkout) → 07 (Return)
    ↓
09 (OAuth) → 10 (Admin)
    ↓
11 (Real-time) ← 12 (PWA)
```

## Architecture Context

- **Framework**: HonoJS on Cloudflare Workers
- **Database**: Cloudflare D1 with Drizzle ORM
- **Frontend**: HTMX + Vanilla CSS (no complex JavaScript)
- **Authentication**: Google OAuth for staff, shared tablet access for customers
- **Privacy**: Customer data automatically purged on game return
- **Deployment**: Cloudflare Workers with edge distribution

## Getting Started for New Development

1. **Read SPEC.md** - Complete technical specification
2. **Review database schema** in `src/database/schema.ts`
3. **Complete Task 03** - Get sample data loaded
4. **Start Task 04** - Core game browsing functionality

## Environment Setup

Required environment variables (see `.env.example`):

- `CLOUDFLARE_API_TOKEN` - For D1 database access
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `DATABASE_ID` - D1 database UUID

Current database:

- **Name**: prod-d1-pool-turtle-tybee-games-atlas
- **ID**: a6483d3d-691b-46f8-ada8-6cdaf3383647
- **Status**: Tables created, ready for seeding

## Development Commands

```bash
npm run dev          # Start development server
npm run db:generate  # Generate new migrations
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio
npm run build        # Build for production
npm run deploy       # Deploy to Cloudflare
```

## File Structure

```
tybee-games/
├── src/
│   ├── database/
│   │   ├── schema.ts        # Database schema & types
│   │   ├── connection.ts    # Database connection helper
│   │   ├── seed.ts         # Sample data (single source of truth)
│   │   └── migrations/     # Generated SQL migrations
│   └── index.ts            # Main Hono application
├── tasks/                  # This directory - task specifications
├── SPEC.md                # Complete technical specification
├── README.md              # Project overview
├── wrangler.toml          # Cloudflare Workers config
└── drizzle.config.ts      # Database configuration
```

Each task file contains:

- Current status and dependencies
- Detailed requirements from SPEC.md
- Implementation guidance
- Code examples and patterns
- Acceptance criteria
- Files to create/modify

Perfect for handoff between development sessions! 🚀
