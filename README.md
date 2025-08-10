# Tybee Games

A web application for browsing and managing board games available for borrowing at [The Pool Turtle] a restaurant bar. Optimized for iPad tablets and designed for easy use in a hospitality setting.

## Tech Stack

- **Framework**: [HonoJS](https://hono.dev/) - Lightweight web framework
- **Runtime**: Cloudflare Workers - Edge computing platform
- **Frontend**: HTMX for dynamic interactions without complex JavaScript
- **Language**: TypeScript for type safety and better developer experience
- **Styling**: Vanilla CSS with mobile-first responsive design
- **Data Sources**: Google Sheets (inventory) + BoardGameGeek API (game data)
- **Database**: Cloudflare D1 (SQLite) for operational data
- **Caching**: Cloudflare KV with stale-while-revalidate strategy

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd tybee-games
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your actual values
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8787`

## Available Scripts

### Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm test` - Run tests (not yet implemented)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Database Management

- `npm run db:migrate` - Apply database migrations locally
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Drizzle Studio for database inspection

### Cache & Data Management

- `npm run admin:full-resync` - Fast refresh (returns cached data, refreshes in background)
- `npm run admin:force-clear-cache` - Force clear all caches (use sparingly)
- `npm run admin:enrich-missing` - Progressively enrich games missing BGG data
- `npm run admin:enrichment-status` - Check BGG data coverage and missing games
- `npm run cache:refresh` - Refresh sheets and enriched catalog cache
- `npm run cache:invalidate` - Invalidate all caches

### Production Scripts

Add `:prod` suffix to run against production (e.g., `npm run admin:full-resync:prod`)

## Project Structure

```
tybee-games/
├── src/
│   ├── components/       # React/JSX components
│   ├── database/         # Database schema and migrations
│   ├── services/         # Business logic and external integrations
│   └── index.tsx         # Main application entry point
├── ARCHITECTURE.md       # Detailed system architecture documentation
├── SPEC.md              # Technical specification and requirements
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── wrangler.jsonc       # Cloudflare Workers configuration
└── README.md           # This file
```

## Features

### Current Features

#### **Core Functionality**

- **Two-Path Navigation**: Clear Browse vs Recommend user journey
- **Advanced Game Browsing**: Grid layout with rich BGG data and advanced filtering
- **Individual Game Details**: Comprehensive game pages with BGG integration
- **5-Step Recommendation Wizard**: Personalized game suggestions with explanations
- **Instant App Startup**: Stale-while-revalidate caching for zero loading screens

#### **Data & Performance**

- **Hybrid Data Architecture**: Google Sheets inventory + BoardGameGeek API enrichment
- **Smart Caching**: 30-minute TTL with background refresh, serves stale content instantly
- **BGG API Integration**: Rate-limited with batch processing and comprehensive error handling
- **Progressive Enhancement**: Basic game info loads first, BGG data enriches asynchronously

#### **User Experience**

- **Mobile-Responsive Design**: Optimized for iPad tablets and mobile devices
- **HTMX-Powered Navigation**: Dynamic content loading without page refreshes
- **Advanced Filtering**: Search by name, category, mechanic, rating, year, complexity
- **Loading States**: Skeleton cards, spinners, and graceful error handling

#### **Admin Features**

- **Cache Management**: Multiple endpoints for different refresh strategies
- **BGG Data Enrichment**: Progressive enrichment and status monitoring
- **Sync Management**: Google Sheets synchronization with conflict detection
- **Analytics**: Game popularity, enrichment status, and usage metrics

### Planned Features (Phase 4B+)

- **Rental Management**: Checkout flow, return processing, overdue tracking
- **Admin Dashboard**: Active rentals overview, inventory management
- **User Accounts**: Rental history, preferences, wishlist system
- **Email Notifications**: Checkout confirmations, return reminders
- **Advanced Analytics**: Usage patterns, popular games, ROI tracking

## Development

### Architecture

The application uses a sophisticated hybrid data architecture with intelligent caching:

#### **Data Layer**

- **Google Sheets**: Game inventory (source of truth for availability)
- **BoardGameGeek API**: Rich game data (images, descriptions, ratings, mechanics)
- **Cloudflare D1**: Operational data (game copies, checkouts, analytics)
- **Cloudflare KV**: Intelligent caching with stale-while-revalidate strategy

#### **Performance Strategy**

- **Stale-While-Revalidate**: Instant app startup, background data refresh
- **BGG Rate Limiting**: 2-second delays, exponential backoff, batch processing
- **Progressive Enhancement**: Basic data loads first, enrichment happens asynchronously
- **Edge Deployment**: Global CDN with sub-100ms response times

#### **Application Architecture**

- **Backend**: HonoJS with server-side rendering and HTMX integration
- **Frontend**: HTMX for dynamic interactions, vanilla CSS for styling
- **Caching**: 30-minute TTL with 2x stale serving window
- **Sync**: Automated synchronization with conflict detection and resolution

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md) and [SPEC.md](./SPEC.md).

### Key Routes

#### **User Routes**

- `GET /` - Two-path home screen (Browse vs Recommend)
- `GET /browse` - Advanced game browsing with filters
- `GET /games/:id` - Individual game detail pages
- `GET /recommend` - 5-step recommendation wizard
- `GET /recommend/results` - Personalized game recommendations

#### **API Routes**

- `GET /browse/games` - HTMX endpoint for filtered game cards
- `GET /api/stats` - Home page statistics
- `GET /recommend/step/1-5` - Recommendation wizard steps

#### **Admin Routes**

- `POST /admin/full-resync` - Fast refresh with background update
- `POST /admin/force-clear-cache` - Complete cache invalidation
- `POST /admin/enrich-missing` - Progressive BGG data enrichment
- `GET /admin/enrichment-status` - BGG data coverage report

### Styling Guidelines

The application uses a clean, Apple-inspired design suitable for restaurant environments:

- Sans-serif fonts for readability
- Card-based layout for touch interaction
- Subtle shadows and hover effects
- Color-coded availability status
- Large touch targets for tablet use

## Deployment

### Cloudflare Workers

1. Install Wrangler CLI (included in dev dependencies):

```bash
npx wrangler login
```

2. Deploy to Cloudflare:

```bash
npm run deploy
```

### Environment Configuration

This project uses Wrangler's unified approach for environment variables:

#### Local Development (`.dev.vars`)

For secrets and sensitive data that should not be committed:

```bash
# .dev.vars
GOOGLE_SHEETS_API_KEY=your_api_key_here
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
```

#### Production Secrets (Cloudflare Dashboard)

Set these as Worker secrets in the Cloudflare dashboard:

- `GOOGLE_SHEETS_API_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`

#### Non-Secret Configuration (`wrangler.jsonc`)

For non-sensitive configuration that can be committed:

```json
{
  "vars": {
    "GOOGLE_SHEETS_RANGE": "Games!A:Z"
  }
}
```

#### Deployment Configuration

Update `wrangler.jsonc` for your specific deployment needs:

- Change the `name` field for your worker name
- Adjust `compatibility_date` if needed
- Add non-secret environment variables in the `vars` section

## Contributing

1. Follow the existing code style and patterns
2. Ensure TypeScript compilation passes: `npm run build`
3. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages
4. Test on mobile devices and tablets
5. Consider accessibility for restaurant/bar lighting conditions

### Commit Message Format

This project enforces Conventional Commits specification. Valid commit types:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes
- `build:` - Build system changes
- `perf:` - Performance improvements
- `revert:` - Reverting previous commits

## License

MIT

[The Pool Turtle]: https://www.thepoolturtle.com
