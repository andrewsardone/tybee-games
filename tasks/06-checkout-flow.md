# Task 06: Create Checkout Flow (Customer Name + Game Selection)

**Status:** ⏳ PENDING  
**Priority:** High  
**Dependencies:** Task 04 (Game Browsing)

## Description

Implement the game checkout process where customers can select an available game copy and provide their name for accountability, as specified in the privacy-first approach from SPEC.md.

## Requirements from SPEC.md

- Customer must provide name for checkout (accountability)
- Select specific available copy of a game
- Update game copy status to 'checked_out'
- Create checkout record in database
- Name will be automatically purged when game is returned (privacy-first)

## User Stories

- **As a customer**, I want to check out a game by providing my name
- **As a customer**, I want to see confirmation that my checkout was successful
- **As a customer**, I want the process to be quick and simple

## Technical Implementation

### Routes to Add

```
GET  /checkout/:gameId    # Show checkout form for specific game
POST /checkout           # Process the checkout
GET  /partials/checkout-form/:gameId  # HTMX partial for checkout form
```

### HTMX Flow

```html
<!-- From game card -->
<button
  hx-get="/partials/checkout-form/{gameId}"
  hx-target="#checkout-modal"
  hx-swap="innerHTML"
  class="checkout-btn"
>
  Check Out
</button>

<!-- Checkout form modal -->
<div id="checkout-modal">
  <form hx-post="/checkout" hx-target="#checkout-result">
    <input type="hidden" name="gameId" value="{gameId}" />
    <label>Your Name:</label>
    <input type="text" name="customerName" required />
    <button type="submit">Check Out Game</button>
  </form>
</div>
```

## Database Operations

```typescript
// 1. Find available copy
const availableCopy = await db
  .select()
  .from(gameCopies)
  .where(and(eq(gameCopies.gameId, gameId), eq(gameCopies.status, 'available')))
  .limit(1);

// 2. Create checkout record
const checkoutId = generateId();
await db.insert(checkouts).values({
  id: checkoutId,
  gameCopyId: availableCopy.id,
  customerName: customerName,
  status: 'active',
});

// 3. Update copy status
await db
  .update(gameCopies)
  .set({
    status: 'checked_out',
    currentCheckoutId: checkoutId,
    lastCheckedOut: new Date().toISOString(),
    totalCheckouts: sql`${gameCopies.totalCheckouts} + 1`,
  })
  .where(eq(gameCopies.id, availableCopy.id));
```

## Error Handling

- Game not available (someone else checked it out)
- Invalid game ID
- Missing customer name
- Database errors

## Success Flow

1. Customer clicks "Check Out" on available game
2. Modal appears with name input form
3. Customer enters name and submits
4. System finds available copy and creates checkout
5. Success message shows with return instructions
6. Game status updates to "Checked Out" in real-time

## Files to Create/Modify

- `src/index.ts` - Add checkout routes
- `src/lib/checkout.ts` - Checkout business logic
- `src/lib/utils.ts` - ID generation utilities
- Checkout form HTML and styling
- Success/error message templates

## UI/UX Requirements

- Clear game information in checkout form
- Simple name input (first name sufficient)
- Loading states during checkout process
- Clear success confirmation
- Error messages for edge cases
- Mobile-friendly modal design

## Acceptance Criteria

- [ ] Customer can check out available games
- [ ] Name is required and validated
- [ ] Game status updates immediately
- [ ] Other customers see updated availability
- [ ] Checkout record created in database
- [ ] Error handling for unavailable games
- [ ] Success confirmation shown
- [ ] Process works on iPad tablets

## Privacy Implementation

- Customer name stored in `checkouts.customer_name`
- Name will be purged when game is returned (Task 07)
- No long-term storage of personal information

## Next Steps

This enables Task 07 (Return Flow) and provides the core rental functionality.
