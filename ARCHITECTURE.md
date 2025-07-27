# Tybee Games - System Architecture

## Overview

Tybee Games uses a **hybrid data architecture** that combines the ease of Google Sheets for catalog management with the robustness of SQLite for operational data. This approach allows non-technical staff to manage the games catalog while maintaining data integrity for complex operations like checkout tracking.

## System Design

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Google Sheets │    │  Cloudflare      │    │   SQLite (D1)   │
│   (Games Catalog)│◄──►│  Workers + Hono  │◄──►│ (Operational)   │
│                 │    │                  │    │                 │
│ • Game Info     │    │ • API Routes     │    │ • Game Copies   │
│ • Copy Counts   │    │ • Sync Logic     │    │ • Checkouts     │
│ • Staff Managed │    │ • Cron Triggers  │    │ • Staff Users   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────▼────────┐              │
         │              │   Sync Service  │              │
         │              │                 │              │
         └──────────────►│ • Every 6 hrs  │◄─────────────┘
                        │ • Manual Trigger│
                        │ • Copy Reconcile│
                        └─────────────────┘
```

## Data Architecture

### Google Sheets (Source of Truth for Games)

**Purpose**: Staff-friendly game catalog management

**Required Columns**:

```
id              | Unique identifier (e.g., "monopoly-classic")
name            | Game title (e.g., "Monopoly Classic")
description     | Brief game description
publisher       | Game publisher (e.g., "Hasbro")
year            | Publication year (e.g., 2008)
image_url       | URL to game image (optional)
min_players     | Minimum players (e.g., 2)
max_players     | Maximum players (e.g., 6)
min_duration    | Minimum play time in minutes (e.g., 60)
max_duration    | Maximum play time in minutes (e.g., 180)
complexity_level| Difficulty 1-5 (1=easy, 5=complex)
strategy_luck_rating | Strategy vs Luck 1-5 (1=luck, 5=strategy)
themes          | Comma-separated themes (e.g., "strategy,family")
is_active       | TRUE/FALSE for active games
total_copies    | Number of physical copies owned
```

**Example Row**:

```
monopoly-classic | Monopoly Classic | The classic property trading game | Hasbro | 2008 | https://... | 2 | 6 | 60 | 180 | 2 | 3 | strategy,family | TRUE | 3
```

### SQLite D1 (Operational Data)

**Purpose**: Complex relational data and transactions

**Tables**:

- `game_copies` - Individual physical game copies (gameId references Google Sheets)
- `checkouts` - Rental tracking with customer info
- `staff_users` - Authentication and authorization
- `checkout_analytics` - Anonymized usage data (gameId references Google Sheets)

## Synchronization System

### Automatic Sync (Cron Triggers)

**Schedule**: Every 30 minutes (`*/30 * * * *`)

- Runs at **:00** and **:30** of every hour
- Examples: 9:00, 9:30, 10:00, 10:30, etc.
- **48 sync operations per day** for near real-time updates

**Process**:

1. Fetch latest data from Google Sheets
2. Compare `total_copies` with current SQLite `game_copies` count
3. **Add copies** if sheets count > database count
4. **Remove available copies** if sheets count < database count
5. **Never remove checked-out copies** (safety feature)
6. Log all changes for monitoring

### Manual Sync (Admin Routes)

**Immediate Sync**: `POST /admin/sync-copies`

- Triggers same process as cron
- Used for urgent updates
- Returns detailed sync results

**Sync Status**: `GET /admin/sync-status`

- Shows games that are out of sync
- Displays differences between sheets and database
- Monitoring and troubleshooting tool

## API Routes

### Public Routes (Customer Tablets)

```
GET  /                    # Main browse page with game grid
GET  /games               # HTMX partial: filtered game results
```

### Admin Routes (Staff Access)

```
GET  /admin/sync-status   # Check sync status between sheets and DB
POST /admin/sync-copies   # Manually trigger copy synchronization
```

### Scheduled Handler

```
CRON */30 * * * *         # Automatic sync every 30 minutes
```

## Data Flow Examples

### Staff Updates Game Catalog

1. **Staff** edits Google Sheets (add game, change copy count)
2. **Cron trigger** runs every 30 minutes
3. **Sync service** detects changes
4. **SQLite** `game_copies` table updated automatically
5. **Customers** see updated availability within 30 minutes

### Customer Checks Out Game

1. **Customer** selects available game
2. **Hono app** creates `checkout` record in SQLite
3. **Game copy** status changes to "checked_out"
4. **Availability** updates in real-time for other customers
5. **Google Sheets** remains unchanged (operational data only)

### Emergency Inventory Update

1. **Staff** updates copy count in Google Sheets
2. **Admin** triggers manual sync via `POST /admin/sync-copies`
3. **Immediate reconciliation** without waiting for cron
4. **New copies** available for checkout instantly

## Environment Configuration

### Local Development (`.dev.vars`)

```bash
GOOGLE_SHEETS_API_KEY=your_api_key_here
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
```

### Production (Cloudflare Secrets)

- `GOOGLE_SHEETS_API_KEY` - Set as Worker secret
- `GOOGLE_SHEETS_SPREADSHEET_ID` - Set as Worker secret

### Non-Secret Config (`wrangler.jsonc`)

```json
{
  "vars": {
    "GOOGLE_SHEETS_RANGE": "Games!A:Z"
  },
  "triggers": {
    "crons": ["*/30 * * * *"]
  }
}
```

## Development and Seeding

### Seed Data

The seed script (`scripts/generate-seed.ts`) has been updated to reflect the new architecture:

- **No longer seeds games data** (managed in Google Sheets)
- **Seeds game copies** that reference game IDs from Google Sheets
- **Seeds staff users** for development and testing
- **Maintains referential integrity** through string-based game IDs

To use the seed data:

1. Set up your Google Sheets with the corresponding game IDs
2. Run `npm run db:seed` to populate game copies and staff

## Benefits of This Architecture

### ✅ **Staff-Friendly**

- Familiar Google Sheets interface
- No technical knowledge required
- Real-time collaboration between staff
- Easy bulk updates and data entry

### ✅ **Data Integrity**

- SQLite handles complex relationships
- ACID transactions for checkouts
- Foreign key constraints
- Audit trails for all operations

### ✅ **Operational Reliability**

- Automatic synchronization
- Manual override capabilities
- Safety features (never remove checked-out copies)
- Detailed logging and monitoring

### ✅ **Performance**

- Edge deployment with Cloudflare Workers
- Cached game data for fast browsing
- Efficient SQLite queries for availability
- Real-time updates without full page reloads

## Monitoring and Troubleshooting

### Sync Monitoring

- Check `/admin/sync-status` for out-of-sync games
- Review Cloudflare Worker logs for cron execution
- Monitor sync results in application logs

### Common Issues

- **Google Sheets API limits**: Automatic retry with exponential backoff
- **Invalid data in sheets**: Validation with detailed error messages
- **Network issues**: Graceful degradation, retry on next cron run
- **Checked-out copy conflicts**: Safety checks prevent data loss

This architecture provides the perfect balance of usability for staff and reliability for operations, ensuring smooth game management at The Pool Turtle.
