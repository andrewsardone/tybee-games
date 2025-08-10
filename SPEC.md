# Tybee Games - Technical Specification

## Overview

Tybee Games is a comprehensive board game rental management system designed for restaurants and entertainment venues. The platform provides an intuitive tablet-based interface for customers to discover, get personalized recommendations for, and rent board games, while offering powerful administrative tools for staff to manage inventory and track rentals.

## Current Implementation Status

### ✅ **COMPLETED PHASES**

#### **Phase 1: Data Layer & Caching (COMPLETED)**

- **BGG API Integration**: Complete BoardGameGeek API service with fuzzy search and automatic ID resolution
- **Hybrid Data Architecture**: Google Sheets for inventory + BGG API for rich game data + smart KV caching
- **Stale-While-Revalidate Caching**: 30-minute TTL with background refresh for zero-downtime updates
- **Progressive Enhancement**: Basic game info loads first, BGG data enriches asynchronously
- **Admin Endpoints**: Catalog refresh, sync status, and cache management capabilities

#### **Phase 2: Navigation & Home Screen (COMPLETED)**

- **Two-Path Home Screen**: Clear Browse vs Recommend user journey
- **HTMX-Powered Navigation**: Smooth transitions with View Transition API
- **Route Restructuring**: `/` → `/browse` → `/recommend` flow
- **Loading States**: Skeleton cards, spinners, and error handling
- **Mobile-Responsive Design**: Touch-friendly interfaces with responsive layouts

#### **Phase 3: Recommendation Wizard (COMPLETED)**

- **5-Step Wizard Flow**: Player count → Learning complexity → Duration → Strategy vs Luck → Themes
- **Smart Recommendation Algorithm**:
  - Player count matching (critical - 40 points)
  - Duration and complexity scoring (25 + 20 points)
  - Strategy preference alignment (10 points)
  - Theme/category matching (15 points)
  - BGG rating and popularity bonuses (10 points total)
- **Rich Results Experience**: Top 3 recommendations with match percentages and detailed explanations
- **Interactive UI Components**: Visual player selection, complexity descriptions, strategy slider, theme multi-select

#### **Phase 4A: Game Details & Polish (COMPLETED)**

- **Individual Game Detail Pages**: Rich `/games/:id` routes with comprehensive BGG data display
- **Advanced Filtering System**:
  - Enhanced search across names, publishers, categories, mechanics
  - Collapsible advanced filters (category, mechanic, rating, year range)
  - Availability toggle and flexible duration/complexity matching
- **Enhanced User Experience**: Clickable game cards, "View Details" buttons, mobile-responsive design
- **Image Optimization**: Lazy loading, error handling, and loading states throughout

#### **Performance & Reliability Improvements (Latest)**

- **BGG API Rate Limiting**: Comprehensive rate limiting with 2-second delays, exponential backoff, and retry logic
- **Batch Processing**: Sequential BGG enrichment (5 games at a time) to prevent API overwhelm
- **Stale-While-Revalidate Caching**: Instant app startup - serves cached content immediately while refreshing in background
- **Progressive Enrichment**: Gradual BGG data enrichment without blocking user experience
- **Graceful Degradation**: Games work with basic data if BGG enrichment fails

### **Current Architecture**

- **Frontend**: HTMX + TypeScript + Progressive Web App capabilities
- **Backend**: Hono.js on Cloudflare Workers with server-side rendering
- **Data Layer**: Google Sheets (inventory) + BGG API (game data) + D1 SQLite (operational data) + KV (caching)
- **Caching Strategy**: True stale-while-revalidate with 30-minute TTL and 2x stale serving window
- **API Integration**: Rate-limited BGG API with batch processing and comprehensive error handling
- **Deployment**: Cloudflare Workers with edge deployment and automatic scaling

### **Current Route Structure**

```
GET /                           # Two-path home screen
GET /browse                     # Advanced filtering and game discovery
GET /browse/games               # HTMX endpoint for filtered game cards
GET /games/:id                  # Individual game detail pages
GET /recommend                  # 5-step recommendation wizard
GET /recommend/step/1-5         # Individual wizard steps
GET /recommend/results          # Personalized recommendations
GET /api/stats                  # Home page statistics
GET /admin/*                    # Admin endpoints for sync and cache management

# Admin API Endpoints
POST /admin/full-resync         # Fast refresh - returns cached data, refreshes in background
POST /admin/force-clear-cache   # Force clear all caches (use sparingly)
POST /admin/enrich-missing      # Progressive BGG enrichment for missing games
GET  /admin/enrichment-status   # Check BGG data coverage and missing games
POST /admin/sync-copies         # Sync game copies from Google Sheets
GET  /admin/sync-status         # Check sync status and out-of-sync games
POST /admin/cache/refresh       # Refresh sheets and enriched catalog cache
POST /admin/cache/invalidate    # Invalidate all caches
```

## User Stories & Requirements

### Primary Users

**Customers (Primary Users)**

- Restaurant/bar patrons browsing available games
- Want to find games suitable for their group size and preferences
- Need to check out games for play and return them afterward
- Use tablets provided by the restaurant

**Staff (Administrative Users)**

- Restaurant staff managing game inventory
- Add new games, update game details, and track availability
- Monitor game checkout/return status
- Handle game maintenance and replacements

### Core User Flows

**Customer Workflows:**

1. **Browse Games**
   - View available games in grid/list format
   - See game availability status (available/checked out)
   - View basic game details (players, duration, description)

2. **Get Game Recommendations**
   - Input preferences:
     - Number of players in group
     - Time willing to spend learning rules
     - Total time available to play
     - Preference for luck vs strategy-based games
     - Preferred game themes/genres
   - Receive filtered game suggestions based on criteria
   - View detailed recommendations with reasoning

3. **Check Out Game**
   - Select available game to borrow
   - Confirm checkout with staff or self-service
   - Game status changes to "checked out"

4. **Return Game**
   - Mark game as returned
   - Game status changes back to "available"
   - Optional: Leave feedback/rating

**Staff Workflows:**

1. **Manage Game Inventory**
   - Add new games with detailed information
   - Update game details, availability, and condition
   - Remove games from inventory

2. **Monitor Activity**
   - View current checkout status
   - Track game popularity and usage patterns
   - Handle customer support requests

## Data Models

### Game Entity

**Master game information (one record per unique game title)**

```typescript
interface Game {
  id: string;
  name: string;
  description: string;
  publisher: string;
  year: number;
  imageUrl?: string;

  // Gameplay characteristics
  minPlayers: number;
  maxPlayers: number;
  minDuration: number; // minutes
  maxDuration: number; // minutes
  complexityLevel: number; // 1-5 (1 = easy to learn, 5 = complex)
  strategyLuckRating: number; // 1-5 (1 = mostly luck, 5 = mostly strategy)
  themes: string[]; // e.g., ["strategy", "fantasy", "cooperative"]

  // Metadata
  dateAdded: Date;
  isActive: boolean;
}
```

### GameCopy Entity

**Individual physical copies of games (multiple copies per game)**

```typescript
interface GameCopy {
  id: string;
  gameId: string; // Reference to Game entity
  copyNumber: number; // Copy 1, Copy 2, etc.

  // Inventory management
  status: 'available' | 'checked_out' | 'maintenance' | 'missing';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location: string; // "Shelf A-3", "Storage", etc.

  // Checkout tracking
  currentCheckoutId?: string;
  lastCheckedOut?: Date;
  totalCheckouts: number;

  // Metadata
  dateAdded: Date;
  notes?: string;
}
```

### Checkout Entity

**Tracking game rentals**

```typescript
interface Checkout {
  id: string;
  gameCopyId: string;
  customerName?: string; // Optional for anonymous checkouts
  checkedOutAt: Date;
  expectedReturnAt?: Date;
  returnedAt?: Date;
  status: 'active' | 'returned' | 'overdue';
  staffMemberId?: string; // Who processed the checkout
}
```

## API Specification

### Authentication Strategy

**Customer Access (Public Tablets)**

- Single shared username/password known only to staff
- Staff enters credentials when setting up iPads in restaurant
- Tablets remain logged in for customer use
- No individual customer accounts needed

**Staff/Admin Access**

- Google OAuth integration
- Allowlisted Google accounts for authorized staff
- Access admin functions from personal devices or staff terminals

### Endpoints

**Public Routes (Customer Access)**

```
GET  /                     # Main browse page
GET  /games                # Game listing with filters/search
GET  /games/:id           # Individual game details
GET  /recommend           # Recommendation form
POST /recommend           # Get game recommendations
GET  /checkout/:gameId    # Checkout confirmation page
POST /checkout            # Process game checkout
POST /return/:checkoutId  # Return a game
```

**Protected Routes (Staff Access)**

```
GET  /auth/google         # Initiate Google OAuth
GET  /auth/callback       # OAuth callback
POST /auth/logout         # Staff logout

GET  /admin               # Admin dashboard
GET  /admin/games         # Manage games catalog
POST /admin/games         # Add new game to catalog
PUT  /admin/games/:id     # Update game information
GET  /admin/copies        # Manage game copies
POST /admin/copies        # Add new game copy
PUT  /admin/copies/:id    # Update copy status/condition
GET  /admin/checkouts     # View active checkouts
GET  /admin/analytics     # Usage statistics
```

**HTMX Partial Routes (HTML fragment responses)**

```
GET  /partials/games           # HTML game cards with filters applied
GET  /partials/recommend       # HTML recommendation results
GET  /partials/availability/:gameId  # HTML availability status update
GET  /partials/game-card/:id   # HTML for individual game card
GET  /partials/checkout-form/:gameId  # HTML checkout form
```

## User Interface Specification

### Layout Requirements

**Home Screen Layout**

- Primary split: "Browse All Games" vs "Get Recommendations"
- Large, prominent buttons for main actions
- Secondary section: "Popular Games" carousel/grid (lower priority)
- Clean, minimal design suitable for quick decision-making

**iPad/Tablet Optimizations**

- Touch targets minimum 44px for easy finger navigation
- Large, readable fonts (minimum 16px body text)
- High contrast color schemes for various lighting conditions
- Minimal scrolling on primary screens
- Fast loading with skeleton screens for perceived performance

**Game Browsing Interface**

- Grid layout with large game images
- Clear availability indicators (green/red status badges)
- Filtering options: player count, duration, complexity, theme
- Quick view modal for game details without page navigation

**Recommendation Flow**

- Single form with all criteria on one screen:
  - Player count slider/picker
  - Learning time preference (quick/moderate/deep)
  - Play duration available (15min, 30min, 1hr, 2hr+)
  - Strategy vs Luck preference slider (1-5 scale)
  - Theme checkboxes (strategy, party, cooperative, etc.)
- Instant results below form using HTMX
  - Form submits to `/partials/recommend` and returns HTML game cards
  - Results replace content in target div without page reload
- Clear explanations for why games were recommended (included in HTML response)

### Interaction Patterns

**Touch-First Design**

- Large tap targets for all interactive elements
- Swipe gestures for browsing game lists
- Pull-to-refresh for real-time availability updates
- Haptic feedback for checkout/return actions (if supported)

**Navigation**

- Breadcrumb navigation for deep screens
- Prominent "Back" buttons
- Quick access to home from any screen
- Clear checkout status indicator when user has active rentals

### Design & Aesthetic Considerations

**Restaurant Integration**

- Themeable color scheme to match restaurant branding
- Configurable logo/header area
- Clean, professional appearance suitable for dining environment
- Easy-to-clean interface design (minimal decorative elements)

**Accessibility**

- High contrast mode for different lighting conditions
- Large text options for visually impaired users
- Simple language and clear iconography
- Works well in both bright daylight and dim evening restaurant lighting

## Technical Architecture

### Technology Stack

**Frontend**

- HTMX for dynamic interactions without complex JavaScript
- Vanilla CSS with mobile-first responsive design
- Progressive Web App (PWA) capabilities for offline support

**Backend**

- HonoJS web framework running on Cloudflare Workers
- TypeScript for type safety and better developer experience
- Server-side rendering with HTMX for dynamic content

**Data Storage**

- **Google Sheets** for games catalog (source of truth)
  - Staff-friendly interface for managing game information
  - Real-time updates without deployments
  - Non-technical staff can easily add/edit games
- **Cloudflare D1** (SQLite) for operational data
  - Game copies, checkouts, staff users, analytics
  - Suitable for restaurant-scale inventory (50-200 games)
  - Edge deployment for low latency
- **Cloudflare KV** for configuration and caching
  - Authentication settings, feature flags
  - Stale-while-revalidate caching with 30-minute TTL
  - BGG API response caching (7 days search, 24 hours game data)
  - Enriched game catalog caching with background refresh

**Asset Management**

- **Cloudflare Images** for game photos and thumbnails
- Automatic optimization and resizing for different screen sizes
- Staff upload interface in admin panel for game images

**Real-time Features**

- **Server-Sent Events (SSE)** for real-time availability updates
  - Send HTML fragments for HTMX to swap into availability indicators
  - Trigger HTMX requests to refresh specific game cards when status changes
- **HTMX Polling** as fallback for real-time updates
  - Periodic refresh of game availability using `hx-trigger="every 30s"`
- Live status updates when games are checked out/returned
  - HTML partial updates for availability badges and checkout status

### Caching & Performance Strategy

**Stale-While-Revalidate Pattern**

- **Instant App Startup**: Cached content served immediately, no loading screens
- **Background Refresh**: Data updates happen behind the scenes
- **30-minute TTL**: Fresh data for 30 minutes, stale serving for up to 60 minutes
- **Graceful Degradation**: App works even if BGG API is down

**BGG API Integration**

- **Rate Limiting**: 2-second delays between requests with exponential backoff
- **Batch Processing**: Sequential enrichment (5 games at a time) to prevent API overwhelm
- **Retry Logic**: Automatic retries for 429 rate limits and 202 processing responses
- **Progressive Enrichment**: Gradual BGG data enrichment without blocking user experience
- **Comprehensive Caching**: 7-day search cache, 24-hour game data cache

**Cache Management**

- **Smart Refresh**: `refreshCatalog()` serves cached data while updating in background
- **Force Clear**: `forceClearAndRebuild()` for complete cache invalidation (use sparingly)
- **Progressive Updates**: `enrichMissingGames()` for gradual data improvement
- **Admin Controls**: Multiple endpoints for different cache management needs

**Performance Optimizations**

- **Edge Deployment**: Cloudflare Workers for global low latency
- **Image Optimization**: Lazy loading with error handling and placeholders
- **HTMX Efficiency**: Minimal JavaScript, server-side rendering
- **Batch Operations**: Grouped database queries and API calls

### Data Storage Schema

**D1 Tables**

```sql
-- Games catalog
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  publisher TEXT,
  year INTEGER,
  image_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  min_duration INTEGER,
  max_duration INTEGER,
  complexity_level INTEGER,
  strategy_luck_rating INTEGER,
  themes TEXT, -- JSON array
  is_active BOOLEAN DEFAULT true,
  date_added DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Physical game copies
CREATE TABLE game_copies (
  id TEXT PRIMARY KEY,
  game_id TEXT REFERENCES games(id),
  copy_number INTEGER,
  status TEXT CHECK(status IN ('available', 'checked_out', 'maintenance', 'missing')),
  condition TEXT CHECK(condition IN ('excellent', 'good', 'fair', 'poor')),
  location TEXT,
  current_checkout_id TEXT,
  last_checked_out DATETIME,
  total_checkouts INTEGER DEFAULT 0,
  date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Checkout tracking
CREATE TABLE checkouts (
  id TEXT PRIMARY KEY,
  game_copy_id TEXT REFERENCES game_copies(id),
  customer_name TEXT,
  checked_out_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expected_return_at DATETIME,
  returned_at DATETIME,
  status TEXT CHECK(status IN ('active', 'returned', 'overdue')),
  staff_member_id TEXT
);

-- Staff authentication
CREATE TABLE staff_users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Deployment & Infrastructure

**Cloudflare Workers Deployment**

- Single worker handling all routes and API endpoints
- Edge deployment for global low latency
- Automatic scaling based on traffic
- Built-in DDoS protection and security

**Environment Configuration**

- Production/staging environments via Wrangler
- Environment variables for API keys and configuration
- Database migrations managed via D1 CLI tools

**CI/CD Pipeline**

- GitHub Actions for automated deployment
- TypeScript compilation and linting checks
- Automatic database migrations on deployment

## Security & Privacy

### Data Protection

**Customer Privacy**

- Require customer name for checkout (accountability and contact if needed)
- **Automatic data purging**: Customer names deleted immediately upon game return
- Anonymized checkout logs retained for analytics (no personal identifiers)
- No long-term storage of personal customer information

**Data Retention Policy**

```sql
-- Example of anonymized checkout history for analytics
CREATE TABLE checkout_analytics (
  id TEXT PRIMARY KEY,
  game_id TEXT, -- Reference to game, not copy
  checkout_date DATE, -- Day only, no time for privacy
  duration_minutes INTEGER, -- How long game was out
  returned BOOLEAN, -- Whether it was returned or went missing
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Security Measures**

- HTTPS enforcement on all routes and API endpoints
- Google OAuth for staff with allowlisted email addresses only
- Session management with secure cookies and CSRF protection
- Rate limiting on public endpoints to prevent abuse

### Access Control

**Customer Tablets (Public Access)**

- Read-only access to game catalog and recommendations
- Can initiate checkouts but cannot access admin functions
- Session timeout after 15 minutes of inactivity
- Automatic return to home screen after checkout completion

**Staff Access Levels**

- **Staff Role**: Manage checkouts, update game status, view current inventory
- **Admin Role**: Full CRUD on games catalog, user management, analytics access
- **Manager Role**: All admin functions plus system configuration and allowlist management

**Session Security**

- Auto-logout staff sessions after 2 hours of inactivity
- Secure session tokens with rotation on sensitive operations
- Device-specific session binding for staff accounts

## Performance Requirements

### Load Times

- Initial page load: < 2 seconds on restaurant WiFi
- Game browsing/filtering: < 500ms response time
- Checkout process: < 1 second end-to-end
- Real-time updates: < 100ms latency for availability changes

### Offline Capability

- **PWA with Service Worker** for basic offline functionality
- Cache game catalog for browsing when connection is poor
- Queue checkout/return actions when offline, sync when reconnected
- Offline-first design for reliability in restaurant environment

### Scalability

- Support for multiple restaurant locations (multi-tenant architecture)
- Handle concurrent usage from 10+ tablets simultaneously
- Database queries optimized for < 50ms response times
- CDN delivery for static assets and images

## Next Phase Recommendations

### **RECOMMENDED NEXT: Phase 4B - Rental Management** 📋

**Priority: HIGH** - Completes the core business functionality

This phase would transform the current discovery platform into a fully functional rental business:

#### **Checkout Flow**

- **Game Reservation System**: Allow customers to reserve available games
- **Customer Information Collection**: Name and contact details for accountability
- **Checkout Confirmation**: Clear confirmation with game details and expected return time
- **Staff Notification**: Alert staff when games are checked out

#### **Return Management**

- **Return Processing**: Staff interface to mark games as returned
- **Condition Assessment**: Track game condition and maintenance needs
- **Automatic Availability Updates**: Real-time status updates across all tablets
- **Overdue Tracking**: Identify and manage overdue rentals

#### **Admin Dashboard**

- **Active Rentals Overview**: Real-time view of all checked-out games
- **Inventory Management**: Add/edit games, manage copies, track conditions
- **Usage Analytics**: Popular games, peak times, utilization rates
- **Staff Management**: User roles, permissions, and activity logs

#### **Email Notifications**

- **Checkout Confirmations**: Professional email receipts for customers
- **Return Reminders**: Automated reminders for overdue games
- **Staff Alerts**: Notifications for important events and issues

**Why Phase 4B Next:**

- **Completes the MVP**: Turns browsers into paying customers
- **Enables Business Operations**: Staff can actually manage rentals
- **High ROI**: Directly impacts revenue generation
- **Natural User Journey**: Customers can now complete the full rental process

### **Alternative Phases for Consideration**

#### **Phase 4C: Enhanced Features** ⚡

**Priority: MEDIUM** - Power user features for increased engagement

- User accounts with rental history and preferences
- Wishlist system with availability notifications
- Customer reviews and ratings
- PWA features for offline functionality

#### **Phase 4D: Analytics & Growth** 📊

**Priority: LOWER** - Optimization and scaling features

- Advanced usage analytics and reporting
- A/B testing framework for UI improvements
- SEO optimization for organic discovery
- Social sharing and viral growth features

## Future Enhancements

### Phase 2 Features (Next 3-6 months)

- **Advanced Analytics Dashboard**
  - Game popularity metrics and trends
  - Peak usage times and patterns
  - Inventory utilization reports
  - Customer flow analytics (anonymized)

- **Enhanced Recommendation Engine**
  - Machine learning based on checkout patterns
  - Seasonal/time-based recommendations
  - Group size optimization suggestions
  - "Customers who liked X also enjoyed Y" features

- **Customer Feedback System**
  - Post-game rating and review collection
  - Integration with recommendation algorithm
  - Staff-visible feedback for game maintenance

### Phase 3+ Features (6+ months)

- **Multi-Location Support**
  - Central management for restaurant chains
  - Location-specific inventory and branding
  - Cross-location analytics and best practices

- **POS System Integration**
  - Link game checkouts to customer orders
  - Automatic game recommendations based on meal duration
  - Revenue tracking for game program ROI

- **Mobile Staff App**
  - Native iOS/Android app for staff management
  - Push notifications for overdue games
  - Remote inventory management capabilities

- **Advanced Features**
  - Waitlist system for popular games
  - Reservation system for special events
  - Tournament/event management tools
  - Customer loyalty program integration
  - QR code scanning for quick game identification

### Long-term Vision

- **AI-Powered Experience**
  - Computer vision for automatic game return detection
  - Predictive inventory management
  - Dynamic pricing for premium games
  - Voice-activated game recommendations
