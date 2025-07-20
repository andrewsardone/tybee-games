import { Hono } from 'hono';
import { createDatabase } from './database/connection';
import {
  getAllGamesWithAvailability,
  isGameAvailable,
  formatPlayerCount,
  formatDuration,
} from './services/games';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
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
        <div hx-get="/partials/games" hx-trigger="load" hx-target="#games-container">
          <div id="games-container">
            Loading games...
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// HTMX partial route for dynamic game loading
app.get('/partials/games', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const games = await getAllGamesWithAvailability(db);

    const gamesHtml = games
      .map(
        (game) => `
      <div class="game-card" id="game-${game.id}">
        <div class="game-title">${game.name}</div>
        <div class="game-description">${game.description || ''}</div>
        <div style="margin-top: 12px; font-size: 12px; color: #86868b;">
          ${formatPlayerCount(game.minPlayers, game.maxPlayers)} • ${formatDuration(game.minDuration, game.maxDuration)}
        </div>
        <span class="status ${isGameAvailable(game) ? 'available' : 'borrowed'}">
          ${isGameAvailable(game) ? `Available (${game.availableCopies} copies)` : 'Currently Borrowed'}
        </span>
      </div>
    `
      )
      .join('');

    return c.html(`<div class="games-grid">${gamesHtml}</div>`);
  } catch (error) {
    console.error('Error loading games:', error);
    return c.html(
      `<div class="error">Failed to load games. Please try again.</div>`
    );
  }
});

// Keep the original /games route for direct access
app.get('/games', async (c) => {
  // Redirect to home page for now, or could return the full page
  return c.redirect('/');
});

export default app;
