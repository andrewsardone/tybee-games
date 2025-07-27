# Tybee Games

A web application for browsing and managing board games available for borrowing at [The Pool Turtle] a restaurant bar. Optimized for iPad tablets and designed for easy use in a hospitality setting.

## Tech Stack

- **Framework**: [HonoJS](https://hono.dev/) - Lightweight web framework
- **Runtime**: Cloudflare Workers - Edge computing platform
- **Frontend**: HTMX for dynamic interactions
- **Language**: TypeScript
- **Styling**: Vanilla CSS with mobile-first design

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

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm test` - Run tests (not yet implemented)

## Project Structure

```
tybee-games/
├── src/
│   └── index.ts          # Main application entry point
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── wrangler.jsonc        # Cloudflare Workers configuration
└── README.md            # This file
```

## Features

### Current Features

- **Game Browsing**: Display available board games in a grid layout
- **Availability Status**: Shows if games are available or currently borrowed
- **Game Details**: Player count and estimated duration for each game
- **Responsive Design**: Optimized for iPad tablets and mobile devices
- **Real-time Updates**: Uses HTMX for dynamic content loading

### Planned Features

- Game suggestion system
- Search and filtering
- Reservation system
- Game reviews and ratings
- Admin panel for game management

## Development

### Architecture

The application follows a simple server-side rendered approach:

- **Backend**: HonoJS handles routing and serves HTML responses
- **Frontend**: HTMX provides dynamic interactions without complex JavaScript
- **Styling**: Mobile-first CSS with iPad optimizations
- **Data**: Games data from Google Sheets, other data in SQLite (Cloudflare D1)

### Key Routes

- `GET /` - Main application page
- `GET /games` - Returns games list as HTML fragment

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
    "GOOGLE_SHEETS_RANGE": "Sheet1!A:Z"
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
