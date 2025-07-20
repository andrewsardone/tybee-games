# Task 04: Build Core Game Browsing with HTMX

**Status:** ✅ COMPLETED  
**Priority:** High  
**Dependencies:** Task 03 (Database needs to be seeded) - ✅ Complete

## Description

Implement the core game browsing functionality using HTMX for dynamic interactions. This is the primary customer-facing feature for viewing available games.

## Requirements from SPEC.md

- Grid layout displaying game cards with images, titles, and basic info
- Show availability status (Available/Checked Out) prominently
- Display game details: player count, duration, complexity
- Touch-friendly design optimized for iPad tablets
- Real-time availability updates

## User Stories

- **As a customer**, I want to see all available games in an easy-to-browse format
- **As a customer**, I want to know immediately if a game is available or checked out
- **As a customer**, I want to see key game details without clicking into individual pages

## Technical Implementation

- Update `src/index.ts` to include game browsing routes
- Create `/games` route that returns game listing page
- Create `/partials/games` route that returns HTML game cards for HTMX
- Implement Drizzle queries to fetch games with availability status
- Design responsive CSS grid for iPad-optimized viewing

## HTMX Patterns to Use

```html
<!-- Auto-load games on page load -->
<div hx-get="/partials/games" hx-trigger="load" hx-target="#games-container">
  <div id="games-container">Loading games...</div>
</div>

<!-- Individual game card -->
<div class="game-card" id="game-{id}">
  <img src="{imageUrl}" alt="{name}" />
  <h3>{name}</h3>
  <p>{playerCount} players • {duration} min</p>
  <span class="status {available ? 'available' : 'checked-out'}">
    {available ? 'Available' : 'Checked Out'}
  </span>
</div>
```

## Database Queries Needed

```sql
-- Get all active games with availability count
SELECT g.*,
       COUNT(gc.id) as total_copies,
       COUNT(CASE WHEN gc.status = 'available' THEN 1 END) as available_copies
FROM games g
LEFT JOIN game_copies gc ON g.id = gc.game_id
WHERE g.is_active = true
GROUP BY g.id
```

## CSS Requirements

- Mobile-first responsive design
- Touch targets minimum 44px
- High contrast for restaurant lighting
- Loading states and skeleton screens
- Grid layout that adapts to screen size

## Files to Create/Modify

- `src/index.ts` - Add game browsing routes
- `src/views/` - Create view templates (if using template engine)
- `src/lib/games.ts` - Game query functions
- CSS updates for game grid layout

## Acceptance Criteria

- [x] Games display in responsive grid layout
- [x] Availability status updates automatically
- [x] Touch-friendly for iPad tablets
- [x] Loads quickly with good UX
- [x] Shows loading states appropriately
- [x] Works with sample data from Task 03

## Implementation Summary

**Completed:** All core game browsing functionality implemented with HTMX integration.

**Key Features Delivered:**

- HTMX partial route `/partials/games` for dynamic loading
- Database integration using Drizzle ORM with proper availability calculations
- Game services layer with utility functions for formatting
- Error handling for database connectivity
- Real-time availability display with copy counts
- Responsive game card layout optimized for tablet use

**Files Modified:**

- `src/index.ts` - Added HTMX routes and database integration
- `src/services/games.ts` - Game query functions and utilities
- Database integration working with wrangler-based workflow

## Next Steps After Completion

This will enable Task 05 (filtering) and provide the foundation for checkout functionality (Tasks 06-07).
