# Task 08: Implement Recommendation Form and Basic Algorithm

**Status:** ⏳ PENDING  
**Priority:** Medium  
**Dependencies:** Task 04 (Game Browsing), Task 03 (Seeded Database)

## Description

Create the game recommendation system that helps customers find suitable games based on their preferences, as specified in SPEC.md.

## Requirements from SPEC.md

The recommendation form should collect:

1. **Number of players** in group
2. **Time willing to spend learning rules** (quick/moderate/deep)
3. **Total time available to play** (15min, 30min, 1hr, 2hr+)
4. **Strategy vs Luck preference** (1-5 scale: 1=luck, 5=strategy)
5. **General theme preferences** (strategy, party, cooperative, etc.)

## User Stories

- **As a customer**, I want to get game recommendations based on my group and preferences
- **As a customer**, I want to see why each game was recommended
- **As a customer**, I want the recommendations to show only available games

## Technical Implementation

### Routes to Add

```
GET  /recommend              # Show recommendation form page
POST /partials/recommend     # Return HTML recommendations (HTMX)
```

### HTMX Form Pattern

```html
<form
  hx-post="/partials/recommend"
  hx-target="#recommendations"
  hx-indicator="#loading"
>
  <!-- Players -->
  <label>How many players?</label>
  <select name="players" required>
    <option value="2">2 players</option>
    <option value="3">3 players</option>
    <option value="4">4 players</option>
    <option value="5">5+ players</option>
  </select>

  <!-- Learning time -->
  <label>Time to learn rules?</label>
  <select name="learningTime" required>
    <option value="quick">Quick (under 5 min)</option>
    <option value="moderate">Moderate (5-15 min)</option>
    <option value="deep">Deep (15+ min)</option>
  </select>

  <!-- Play duration -->
  <label>How long do you want to play?</label>
  <select name="duration" required>
    <option value="15">15 minutes</option>
    <option value="30">30 minutes</option>
    <option value="60">1 hour</option>
    <option value="120">2+ hours</option>
  </select>

  <!-- Strategy vs Luck slider -->
  <label>Strategy vs Luck preference:</label>
  <input type="range" name="strategyLuck" min="1" max="5" value="3" />
  <span>1=Luck 3=Balanced 5=Strategy</span>

  <!-- Themes -->
  <fieldset>
    <legend>Preferred themes (select any):</legend>
    <label
      ><input type="checkbox" name="themes" value="strategy" /> Strategy</label
    >
    <label><input type="checkbox" name="themes" value="party" /> Party</label>
    <label
      ><input type="checkbox" name="themes" value="cooperative" />
      Cooperative</label
    >
    <label
      ><input type="checkbox" name="themes" value="abstract" /> Abstract</label
    >
  </fieldset>

  <button type="submit">Get Recommendations</button>
</form>

<div id="loading" style="display:none">Finding perfect games...</div>
<div id="recommendations"></div>
```

## Recommendation Algorithm

```typescript
interface RecommendationCriteria {
  players: number;
  learningTime: 'quick' | 'moderate' | 'deep';
  duration: number; // minutes
  strategyLuck: number; // 1-5
  themes: string[];
}

function calculateGameScore(
  game: Game,
  criteria: RecommendationCriteria
): number {
  let score = 0;

  // Player count match (high weight)
  if (
    game.minPlayers <= criteria.players &&
    game.maxPlayers >= criteria.players
  ) {
    score += 100;
  } else {
    return 0; // Eliminate if player count doesn't work
  }

  // Duration match
  if (game.maxDuration <= criteria.duration) {
    score += 50;
  } else if (game.minDuration <= criteria.duration) {
    score += 25; // Partial match
  }

  // Complexity vs learning time
  const complexityMap = { quick: 1, moderate: 3, deep: 5 };
  const maxComplexity = complexityMap[criteria.learningTime];
  if (game.complexityLevel <= maxComplexity) {
    score += 30;
  }

  // Strategy/Luck preference (closer = better)
  const strategyDiff = Math.abs(
    game.strategyLuckRating - criteria.strategyLuck
  );
  score += Math.max(0, 20 - strategyDiff * 5);

  // Theme matching
  const gameThemes = JSON.parse(game.themes || '[]');
  const themeMatches = gameThemes.filter((theme) =>
    criteria.themes.includes(theme)
  ).length;
  score += themeMatches * 10;

  return score;
}
```

## Database Query

```sql
-- Get games with availability and recommendation scoring
SELECT g.*,
       COUNT(gc.id) as total_copies,
       COUNT(CASE WHEN gc.status = 'available' THEN 1 END) as available_copies
FROM games g
LEFT JOIN game_copies gc ON g.id = gc.game_id
WHERE g.is_active = true
  AND g.min_players <= $1
  AND g.max_players >= $1
  AND gc.status = 'available'
GROUP BY g.id
HAVING available_copies > 0
ORDER BY available_copies DESC
```

## Recommendation Response Format

```html
<div class="recommendations">
  <h3>Perfect matches for your group!</h3>

  <div class="recommendation-card highly-recommended">
    <img src="{game.imageUrl}" alt="{game.name}" />
    <div class="game-info">
      <h4>{game.name}</h4>
      <p>{game.description}</p>
      <div class="match-reasons">
        <span class="reason">✓ Perfect for {players} players</span>
        <span class="reason">✓ Plays in {duration} minutes</span>
        <span class="reason">✓ {complexity} complexity</span>
      </div>
      <button
        hx-get="/partials/checkout-form/{game.id}"
        hx-target="#checkout-modal"
      >
        Check Out This Game
      </button>
    </div>
  </div>
</div>
```

## Files to Create/Modify

- `src/index.ts` - Add recommendation routes
- `src/lib/recommendations.ts` - Algorithm implementation
- `src/views/recommend.html` - Recommendation form page
- Recommendation results styling

## UI/UX Requirements

- Single page form (no multi-step wizard)
- Instant results below form
- Clear explanation of why games were recommended
- Prioritize available games only
- Show "no matches" message if appropriate

## Acceptance Criteria

- [ ] Form collects all required criteria from SPEC.md
- [ ] Algorithm finds appropriate games
- [ ] Only shows available games
- [ ] Explains why each game was recommended
- [ ] Results appear instantly via HTMX
- [ ] Works well on iPad tablets
- [ ] Handles edge cases (no matches, etc.)

## Future Enhancements

- Machine learning based on checkout patterns
- "Similar games" recommendations
- Save/bookmark favorite criteria
- Social recommendations from other customers
