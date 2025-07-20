# Task 07: Build Game Return Functionality

**Status:** ⏳ PENDING  
**Priority:** High  
**Dependencies:** Task 06 (Checkout Flow)  

## Description
Implement the game return process with automatic customer data purging and anonymized analytics creation, following the privacy-first approach from SPEC.md.

## Requirements from SPEC.md
- Mark game as returned
- **Automatically purge customer name** upon return (privacy requirement)
- Create anonymized analytics record for reporting
- Update game copy status back to 'available'
- Calculate rental duration for analytics

## User Stories
- **As a customer**, I want to easily return a game when finished
- **As staff**, I want to process returns quickly
- **As a manager**, I want analytics on game usage without customer data

## Technical Implementation
### Routes to Add
```
GET  /return/:checkoutId    # Show return confirmation
POST /return               # Process the return
GET  /partials/active-checkouts  # Show current rentals
```

### Privacy-First Return Process
```typescript
// 1. Get checkout details
const checkout = await db.select().from(checkouts)
  .where(eq(checkouts.id, checkoutId))

// 2. Create anonymized analytics record BEFORE purging name
const durationMinutes = calculateDuration(checkout.checkedOutAt)
await db.insert(checkoutAnalytics).values({
  id: generateId(),
  gameId: checkout.gameId,
  checkoutDate: new Date().toISOString().split('T')[0], // Date only
  durationMinutes: durationMinutes,
  returned: true
})

// 3. Update checkout - PURGE customer name
await db.update(checkouts).set({
  customerName: null, // Privacy: remove personal data
  returnedAt: new Date().toISOString(),
  status: 'returned'
}).where(eq(checkouts.id, checkoutId))

// 4. Update game copy status
await db.update(gameCopies).set({
  status: 'available',
  currentCheckoutId: null
}).where(eq(gameCopies.id, checkout.gameCopyId))
```

## Return Methods
### Self-Service Return (Customer)
```html
<!-- QR code or simple return page -->
<div class="return-form">
  <h2>Return: {gameName}</h2>
  <p>Checked out by: {customerName}</p>
  <button hx-post="/return" hx-vals='{"checkoutId": "{checkoutId}"}'>
    Return This Game
  </button>
</div>
```

### Staff-Assisted Return
```html
<!-- Staff can see all active checkouts -->
<div hx-get="/partials/active-checkouts" hx-trigger="load">
  <div class="checkout-item">
    <span>{gameName}</span>
    <span>{customerName}</span>
    <span>{duration}</span>
    <button hx-post="/return" hx-vals='{"checkoutId": "{id}"}'>Return</button>
  </div>
</div>
```

## Database Schema Usage
```sql
-- Find active checkouts
SELECT c.*, g.name as game_name, gc.copy_number
FROM checkouts c
JOIN game_copies gc ON c.game_copy_id = gc.id  
JOIN games g ON gc.game_id = g.id
WHERE c.status = 'active'
ORDER BY c.checked_out_at

-- Analytics query (no personal data)
SELECT g.name, AVG(ca.duration_minutes) as avg_duration, COUNT(*) as total_rentals
FROM checkout_analytics ca
JOIN games g ON ca.game_id = g.id
WHERE ca.checkout_date >= date('now', '-30 days')
GROUP BY g.id, g.name
```

## Real-time Updates
- Use HTMX to update game availability immediately
- Refresh active checkouts list
- Update game cards to show "Available" status

## Files to Create/Modify
- `src/index.ts` - Add return routes
- `src/lib/return.ts` - Return business logic  
- `src/lib/analytics.ts` - Analytics creation logic
- Return confirmation templates
- Active checkouts display

## Error Handling
- Invalid checkout ID
- Game already returned
- Database transaction failures
- Concurrent return attempts

## Analytics Privacy Design
The `checkout_analytics` table stores:
- ✅ Game ID (no personal data)
- ✅ Date only (no time for privacy)
- ✅ Duration in minutes
- ✅ Whether returned successfully
- ❌ NO customer names or identifiers

## UI/UX Requirements
- Clear return confirmation
- Show rental duration
- Success message after return
- Real-time availability updates
- Simple process for staff

## Acceptance Criteria
- [ ] Customer names automatically purged on return
- [ ] Game status updates to 'available' immediately
- [ ] Anonymized analytics record created
- [ ] Other customers see game as available
- [ ] Return duration calculated correctly
- [ ] Staff can see active checkouts
- [ ] Self-service return option works
- [ ] Real-time updates via HTMX

## Privacy Compliance
- ✅ Customer data purged immediately upon return
- ✅ Only anonymized analytics retained
- ✅ No long-term personal data storage
- ✅ Complies with SPEC.md privacy requirements

## Next Steps
This completes the core rental flow and enables analytics/reporting features.