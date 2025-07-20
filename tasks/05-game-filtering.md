# Task 05: Implement Game Filtering and Search

**Status:** ✅ COMPLETED  
**Priority:** Medium  
**Dependencies:** Task 04 (Game Browsing) - ✅ Complete

## Description

Add filtering and search capabilities to help customers find games that match their preferences using HTMX for dynamic updates.

## Requirements from SPEC.md

- Filter by player count (min/max range)
- Filter by duration (15min, 30min, 1hr, 2hr+)
- Filter by complexity level (1-5 scale)
- Filter by themes/genres
- Text search by game name
- Real-time filtering without page reloads

## User Stories

- **As a customer**, I want to filter games by how many people are playing
- **As a customer**, I want to find games that fit our available time
- **As a customer**, I want to filter by game complexity for our group
- **As a customer**, I want to search for specific games by name

## Technical Implementation

- Add filter form with HTMX `hx-get` on input changes
- Update `/partials/games` route to accept query parameters
- Implement database queries with WHERE clauses
- Use URL parameters to maintain filter state

## HTMX Patterns

```html
<form
  id="game-filters"
  hx-get="/partials/games"
  hx-target="#games-container"
  hx-trigger="change, input delay:300ms"
>
  <!-- Player count -->
  <label>Players:</label>
  <select name="players">
    <option value="">Any</option>
    <option value="2">2 players</option>
    <option value="3-4">3-4 players</option>
    <option value="5+">5+ players</option>
  </select>

  <!-- Duration -->
  <label>Duration:</label>
  <select name="duration">
    <option value="">Any</option>
    <option value="quick">Quick (< 30 min)</option>
    <option value="medium">Medium (30-60 min)</option>
    <option value="long">Long (60+ min)</option>
  </select>

  <!-- Search -->
  <input
    type="search"
    name="search"
    placeholder="Search games..."
    hx-get="/partials/games"
    hx-target="#games-container"
    hx-trigger="input changed delay:300ms"
  />
</form>
```

## Database Queries

```sql
-- Dynamic filtering based on parameters
SELECT g.*, COUNT(gc.id) as total_copies,
       COUNT(CASE WHEN gc.status = 'available' THEN 1 END) as available_copies
FROM games g
LEFT JOIN game_copies gc ON g.id = gc.game_id
WHERE g.is_active = true
  AND ($1::int IS NULL OR (g.min_players <= $1 AND g.max_players >= $1))
  AND ($2::int IS NULL OR g.max_duration <= $2)
  AND ($3::text IS NULL OR g.name ILIKE '%' || $3 || '%')
GROUP BY g.id
ORDER BY available_copies DESC, g.name
```

## UI/UX Considerations

- Filters should be prominently placed but not overwhelming
- Show active filter badges with clear buttons
- Display result count
- Smooth transitions when filtering
- Clear/reset all filters option

## Files to Create/Modify

- `src/index.ts` - Update `/partials/games` route with query handling
- `src/lib/games.ts` - Add filtering logic to game queries
- Filter form HTML and styling
- JavaScript for enhanced UX (optional, HTMX-first)

## Acceptance Criteria

- [x] Filter by player count works correctly
- [x] Duration filtering shows appropriate games
- [x] Text search finds games by name and description
- [x] Filters combine properly (AND logic)
- [x] Real-time updates without page reload
- [x] Filter state persists via URL parameters
- [x] Results show immediately as user types/selects

## Implementation Summary

**Completed:** All game filtering functionality with URL-driven state management.

**Key Features Delivered:**

- URL-based application state with shareable filtered views
- Real-time filtering with 300ms input delay for optimal UX
- Multiple filter types: player count, duration, complexity, text search
- Proper HTMX pattern using single route for full page and partials
- SQLite-compatible case-insensitive search using LOWER() and LIKE
- Form pre-population from URL parameters on page load
- Results count display with filter status indication

**Technical Implementation:**

- Single `/` route detects HTMX requests via HX-Request header
- Dynamic Drizzle ORM queries with conditional WHERE clauses
- URL parameters drive both form state and database filtering
- `hx-push-url="true"` maintains clean URLs on main route
- Clear filters functionality resets to base URL

**Files Modified:**

- `src/index.ts` - Added filtering UI, URL handling, and HTMX patterns
- `src/services/games.ts` - Added GameFilters interface and getGamesWithFilters function

## Enhancement Ideas for Later

- Save favorite filters
- Filter by themes/genres
- Sort options (alphabetical, complexity, duration)
- Advanced search with multiple criteria
