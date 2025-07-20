# Task 10: Build Admin CRUD for Games and Copies Management

**Status:** ⏳ PENDING  
**Priority:** Medium  
**Dependencies:** Task 09 (Google OAuth)  

## Description
Create the administrative interface for staff to manage the games catalog and inventory copies, with image upload capabilities using Cloudflare Images.

## Requirements from SPEC.md
- Add new games with detailed information
- Update game details, availability, and condition  
- Remove games from inventory
- Manage multiple copies per game
- Image upload for game photos
- Role-based access (staff/admin/manager)

## User Stories
- **As staff**, I want to add new games to the catalog
- **As staff**, I want to update game information and copy status
- **As admin**, I want to remove games and manage inventory
- **As manager**, I want to see inventory reports and analytics

## Technical Implementation
### Protected Admin Routes
```
GET  /admin                    # Dashboard with overview
GET  /admin/games              # Games catalog management
GET  /admin/games/new          # Add new game form
POST /admin/games              # Create new game
GET  /admin/games/:id/edit     # Edit game form
PUT  /admin/games/:id          # Update game
DELETE /admin/games/:id        # Remove game

GET  /admin/copies             # Game copies management  
POST /admin/copies             # Add new copy
PUT  /admin/copies/:id         # Update copy status/condition
DELETE /admin/copies/:id       # Remove copy

GET  /admin/checkouts          # Active checkouts view
GET  /admin/analytics          # Usage analytics
```

### HTMX Admin Interface
```html
<!-- Games Management -->
<div class="admin-section">
  <h2>Games Catalog</h2>
  <button hx-get="/admin/games/new" hx-target="#modal">Add New Game</button>
  
  <div hx-get="/admin/partials/games-table" hx-trigger="load">
    <table class="games-table">
      <tr>
        <td>{game.name}</td>
        <td>{game.publisher}</td>
        <td>{availableCopies}/{totalCopies}</td>
        <td>
          <button hx-get="/admin/games/{id}/edit" hx-target="#modal">Edit</button>
          <button hx-delete="/admin/games/{id}" hx-confirm="Delete this game?">Delete</button>
        </td>
      </tr>
    </table>
  </div>
</div>

<!-- Copy Status Management -->
<div class="copy-management">
  <h3>Copy Status</h3>
  <select hx-put="/admin/copies/{copyId}" hx-include="this">
    <option value="available">Available</option>
    <option value="checked_out">Checked Out</option>
    <option value="maintenance">Maintenance</option>
    <option value="missing">Missing</option>
  </select>
</div>
```

## Game Form Implementation
```html
<form hx-post="/admin/games" hx-encoding="multipart/form-data">
  <!-- Basic Info -->
  <label>Game Name:</label>
  <input type="text" name="name" required>
  
  <label>Description:</label>
  <textarea name="description" rows="3"></textarea>
  
  <label>Publisher:</label>
  <input type="text" name="publisher">
  
  <label>Year:</label>
  <input type="number" name="year" min="1900" max="2030">
  
  <!-- Game Characteristics -->
  <label>Player Count:</label>
  <input type="number" name="minPlayers" min="1" required> to 
  <input type="number" name="maxPlayers" min="1" required>
  
  <label>Duration (minutes):</label>
  <input type="number" name="minDuration" required> to 
  <input type="number" name="maxDuration" required>
  
  <label>Complexity (1-5):</label>
  <input type="range" name="complexityLevel" min="1" max="5" required>
  
  <label>Strategy vs Luck (1-5):</label>
  <input type="range" name="strategyLuckRating" min="1" max="5" required>
  
  <!-- Themes -->
  <fieldset>
    <legend>Themes:</legend>
    <label><input type="checkbox" name="themes" value="strategy"> Strategy</label>
    <label><input type="checkbox" name="themes" value="party"> Party</label>
    <label><input type="checkbox" name="themes" value="cooperative"> Cooperative</label>
    <!-- Add more theme options -->
  </fieldset>
  
  <!-- Image Upload -->
  <label>Game Image:</label>
  <input type="file" name="image" accept="image/*">
  
  <button type="submit">Save Game</button>
</form>
```

## Cloudflare Images Integration
```typescript
// Upload image to Cloudflare Images
async function uploadGameImage(file: File, env: Env): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`
      },
      body: formData
    }
  )
  
  const result = await response.json()
  return result.result.variants[0] // Return optimized image URL
}
```

## Database Operations
```typescript
// Create game with image
async function createGame(gameData: NewGame, imageUrl?: string) {
  const gameId = generateId()
  
  await db.insert(games).values({
    id: gameId,
    ...gameData,
    imageUrl: imageUrl,
    themes: JSON.stringify(gameData.themes)
  })
  
  return gameId
}

// Add game copies
async function addGameCopies(gameId: string, count: number, location: string) {
  const copies = []
  for (let i = 1; i <= count; i++) {
    copies.push({
      id: generateId(),
      gameId: gameId,
      copyNumber: i,
      location: location
    })
  }
  
  await db.insert(gameCopies).values(copies)
}
```

## Role-Based Access Control
```typescript
// Middleware for different admin levels
function requireRole(minRole: 'staff' | 'admin' | 'manager') {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    const roleHierarchy = { staff: 1, admin: 2, manager: 3 }
    
    if (roleHierarchy[user.role] < roleHierarchy[minRole]) {
      return c.html('Insufficient permissions', 403)
    }
    
    await next()
  }
}

// Usage
app.delete('/admin/games/:id', requireAuth, requireRole('admin'), deleteGame)
```

## Analytics Dashboard
```html
<div class="analytics-dashboard">
  <div class="stat-card">
    <h3>Total Games</h3>
    <span class="stat-number">{totalGames}</span>
  </div>
  
  <div class="stat-card">
    <h3>Active Checkouts</h3>
    <span class="stat-number">{activeCheckouts}</span>
  </div>
  
  <div class="chart-container">
    <h3>Popular Games (Last 30 Days)</h3>
    <div hx-get="/admin/partials/popular-games-chart" hx-trigger="load">
      <!-- Chart will be inserted here -->
    </div>
  </div>
</div>
```

## Files to Create/Modify
- `src/index.ts` - Add admin routes
- `src/lib/admin.ts` - Admin business logic
- `src/middleware/auth.ts` - Role-based access control
- `src/views/admin/` - Admin interface templates
- `src/lib/images.ts` - Cloudflare Images integration

## UI/UX Requirements
- Clean, professional admin interface
- Form validation and error handling
- Bulk operations for efficiency
- Search/filter admin tables
- Mobile-responsive for staff devices

## Acceptance Criteria
- [ ] Staff can add new games with all required fields
- [ ] Image upload works with Cloudflare Images
- [ ] Game copies can be added and managed
- [ ] Copy status updates work (available/maintenance/missing)
- [ ] Role-based access control enforced
- [ ] Analytics dashboard shows key metrics
- [ ] HTMX provides smooth admin experience
- [ ] Form validation prevents invalid data
- [ ] Bulk operations for common tasks

## Security Considerations
- Validate all form inputs
- Sanitize uploaded images
- Rate limit admin operations
- Audit log for admin actions
- Secure file upload handling

## Future Enhancements
- Bulk import/export functionality
- Game duplicate detection
- Advanced analytics and reporting
- Inventory alerts and notifications
- Integration with external game databases