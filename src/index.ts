import { Hono } from 'hono';
import { createDatabase } from './database/connection';
import {
  getGamesWithFilters,
  isGameAvailable,
  formatPlayerCount,
  formatDuration,
  type GameFilters,
} from './services/games';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  // Get URL parameters to pre-populate form
  const players = c.req.query('players') || '';
  const duration = c.req.query('duration') || '';
  const complexity = c.req.query('complexity') || '';
  const search = c.req.query('search') || '';

  // Check if this is an HTMX request
  const isHtmxRequest = c.req.header('HX-Request') === 'true';

  // If it's an HTMX request, return just the games partial
  if (isHtmxRequest) {
    try {
      const db = createDatabase(c.env.DB);

      // Parse filters
      const filters: GameFilters = {};

      if (players) {
        filters.players = parseInt(players, 10);
      }

      if (duration && ['quick', 'medium', 'long'].includes(duration)) {
        filters.duration = duration as 'quick' | 'medium' | 'long';
      }

      if (complexity) {
        filters.complexity = parseInt(complexity, 10);
      }

      if (search && search.trim()) {
        filters.search = search.trim();
      }

      const games = await getGamesWithFilters(db, filters);

      // Generate results info
      const resultsInfo = `
        <div class="results-count">
          Found ${games.length} game${games.length === 1 ? '' : 's'}
          ${Object.keys(filters).length > 0 ? ' matching your filters' : ''}
        </div>
      `;

      const gamesHtml = games
        .map(
          (game) => `
        <div class="game-card" id="game-${game.id}">
          <div class="game-title">${game.name}</div>
          <div class="game-description">${game.description || ''}</div>
          <div style="margin-top: 12px; font-size: 12px; color: #86868b;">
            ${formatPlayerCount(game.minPlayers, game.maxPlayers)} • ${formatDuration(game.minDuration, game.maxDuration)} • Complexity: ${game.complexityLevel}/5
          </div>
          <span class="status ${isGameAvailable(game) ? 'available' : 'borrowed'}">
            ${isGameAvailable(game) ? `Available (${game.availableCopies} copies)` : 'Currently Borrowed'}
          </span>
        </div>
      `
        )
        .join('');

      // Return both results info and games grid
      return c.html(`
        ${resultsInfo}
        <div class="games-grid">${gamesHtml}</div>
      `);
    } catch (error) {
      console.error('Error loading games:', error);
      return c.html(
        `<div class="error">Failed to load games. Please try again.</div>`
      );
    }
  }

  // Helper function to build query string
  const buildQueryString = (
    players: string,
    duration: string,
    complexity: string,
    search: string
  ) => {
    const params: string[] = [];
    if (players) params.push(`players=${encodeURIComponent(players)}`);
    if (duration) params.push(`duration=${encodeURIComponent(duration)}`);
    if (complexity) params.push(`complexity=${encodeURIComponent(complexity)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    return params.length > 0 ? `?${params.join('&')}` : '';
  };
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tybee Games</title>
      <script src="https://unpkg.com/htmx.org@1.9.12"></script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f7;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          text-align: center;
          color: #1d1d1f;
          margin-bottom: 30px;
        }
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        .game-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        }
        .game-card:hover {
          transform: translateY(-2px);
        }
        .game-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1d1d1f;
        }
        .game-description {
          color: #86868b;
          font-size: 14px;
          line-height: 1.4;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          margin-top: 12px;
        }
        .available {
          background-color: #d1f2eb;
          color: #00845a;
        }
        .borrowed {
          background-color: #ffe6e6;
          color: #d73502;
        }
        
        /* Filter form styling */
        .filters {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .filter-row {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          align-items: end;
        }
        .filter-group {
          flex: 1;
          min-width: 150px;
        }
        .filter-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 5px;
          color: #1d1d1f;
        }
        .filter-group select,
        .filter-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d2d2d7;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }
        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #007aff;
        }
        .clear-filters {
          background: #f2f2f7;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          color: #007aff;
        }
        .results-count {
          font-size: 14px;
          color: #86868b;
          margin-bottom: 15px;
        }
        
        /* iPad optimizations */
        @media (min-width: 768px) {
          body {
            padding: 40px;
          }
          .container {
            max-width: 1000px;
          }
          .games-grid {
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Tybee Games Collection</h1>
        
        <!-- Game Filters -->
        <div class="filters">
          <form 
            id="game-filters"
            hx-get="/"
            hx-target="#games-results"
            hx-trigger="change, input delay:300ms"
            hx-include="[name]"
            hx-push-url="true"
          >
            <div class="filter-row">
              <div class="filter-group">
                <label for="players">Players</label>
                <select name="players" id="players">
                  <option value="" ${players === '' ? 'selected' : ''}>Any number</option>
                  <option value="1" ${players === '1' ? 'selected' : ''}>1 player</option>
                  <option value="2" ${players === '2' ? 'selected' : ''}>2 players</option>
                  <option value="3" ${players === '3' ? 'selected' : ''}>3 players</option>
                  <option value="4" ${players === '4' ? 'selected' : ''}>4 players</option>
                  <option value="5" ${players === '5' ? 'selected' : ''}>5+ players</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label for="duration">Duration</label>
                <select name="duration" id="duration">
                  <option value="" ${duration === '' ? 'selected' : ''}>Any duration</option>
                  <option value="quick" ${duration === 'quick' ? 'selected' : ''}>Quick (≤30 min)</option>
                  <option value="medium" ${duration === 'medium' ? 'selected' : ''}>Medium (30-60 min)</option>
                  <option value="long" ${duration === 'long' ? 'selected' : ''}>Long (60+ min)</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label for="complexity">Complexity</label>
                <select name="complexity" id="complexity">
                  <option value="" ${complexity === '' ? 'selected' : ''}>Any complexity</option>
                  <option value="1" ${complexity === '1' ? 'selected' : ''}>1 - Very Easy</option>
                  <option value="2" ${complexity === '2' ? 'selected' : ''}>2 - Easy</option>
                  <option value="3" ${complexity === '3' ? 'selected' : ''}>3 - Medium</option>
                  <option value="4" ${complexity === '4' ? 'selected' : ''}>4 - Hard</option>
                  <option value="5" ${complexity === '5' ? 'selected' : ''}>5 - Very Hard</option>
                </select>
              </div>
              
              <div class="filter-group">
                <label for="search">Search</label>
                <input 
                  type="search" 
                  name="search" 
                  id="search" 
                  placeholder="Game name..."
                  value="${search}"
                />
              </div>
              
              <div class="filter-group">
                <button 
                  type="button" 
                  class="clear-filters"
                  onclick="window.location.href = '/'; return false;"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <!-- Results -->
        <div 
          hx-get="/${buildQueryString(players, duration, complexity, search)}" 
          hx-trigger="load" 
          hx-target="#games-results"
          id="games-loader"
        >
          <div id="games-results">
            Loading games...
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Keep the original /games route for direct access
app.get('/games', async (c) => {
  // Redirect to home page for now, or could return the full page
  return c.redirect('/');
});

export default app;
