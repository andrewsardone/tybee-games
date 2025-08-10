import { Hono } from 'hono';
import { createDatabase } from './database/connection';
import { getGoogleSheetsConfig } from './services/config';
import { syncGameCopies, getOutOfSyncGames } from './services/copySync';
import { GoogleSheetsService } from './services/googleSheets';
import { KVCacheService } from './services/cache';
import { GameDataService } from './services/gameData';
import { getQueryParams, buildQueryString } from './services/search';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import BrowsePage from './components/BrowsePage';
import EnrichedResultsInfo from './components/EnrichedResultsInfo';
import GamesGrid from './components/GamesGrid';
import ErrorMessage from './components/ErrorMessage';

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  GOOGLE_SHEETS_API_KEY: string;
  GOOGLE_SHEETS_SPREADSHEET_ID: string;
  GOOGLE_SHEETS_RANGE: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Home page - two clear paths
app.get('/', async (c) => {
  return c.render(
    <Layout>
      <HomePage />
    </Layout>
  );
});

// Browse page - game library with filters
app.get('/browse', async (c) => {
  const queryParams = getQueryParams(c);
  const { players, duration, complexity, search } = queryParams;
  const queryString = buildQueryString(queryParams);

  return c.render(
    <Layout>
      <BrowsePage
        players={players}
        duration={duration}
        complexity={complexity}
        search={search}
        queryString={queryString}
      />
    </Layout>
  );
});

// Browse games API - returns game cards for HTMX
app.get('/browse/games', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);
    const gameDataService = new GameDataService(db, sheetsConfig, cache);

    const queryParams = getQueryParams(c);

    // Convert query params to enriched game filters
    const filters = {
      players: queryParams.players ? parseInt(queryParams.players) : undefined,
      search: queryParams.search || undefined,
      availableOnly: true, // Only show available games by default
    };

    const games = await gameDataService.getFilteredGames(filters);

    // Return JSX components for HTMX response
    return c.render(
      <>
        <EnrichedResultsInfo gameCount={games.length} filters={filters} />
        <GamesGrid games={games} />
      </>
    );
  } catch (error) {
    console.error('Error loading games:', error);
    return c.render(<ErrorMessage />);
  }
});

// API endpoint for home page stats
app.get('/api/stats', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);
    const gameDataService = new GameDataService(db, sheetsConfig, cache);

    const games = await gameDataService.getEnrichedGames();
    const availableGames = games.filter((g) => g.availableCopies > 0);
    const enrichedGames = games.filter((g) => g.enriched);

    return c.render(
      <div className="stats-grid">
        <div className="stat-item">
          <strong>{games.length}</strong>
          <span>Total Games</span>
        </div>
        <div className="stat-item">
          <strong>{availableGames.length}</strong>
          <span>Available Now</span>
        </div>
        <div className="stat-item">
          <strong>{enrichedGames.length}</strong>
          <span>With Details</span>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading stats:', error);
    return c.render(<span>Stats unavailable</span>);
  }
});

// Recommendation flow (placeholder for Phase 3)
app.get('/recommend', async (c) => {
  return c.render(
    <Layout>
      <div className="page-header">
        <button
          className="back-button"
          hx-get="/"
          hx-target="body"
          hx-swap="transition:true"
          hx-push-url="true"
        >
          ← Back to Home
        </button>
        <h1>Game Recommendation</h1>
        <p>Coming in Phase 3 - 5-step recommendation wizard</p>
      </div>
      <div className="placeholder-content">
        <p>This will be the 5-step recommendation wizard:</p>
        <ol>
          <li>How many players?</li>
          <li>Learning time preference?</li>
          <li>Play duration available?</li>
          <li>Strategy vs luck preference?</li>
          <li>Theme preferences?</li>
        </ol>
      </div>
    </Layout>
  );
});

// Keep the original /games route for direct access
app.get('/games', async (c) => {
  // Redirect to browse page
  return c.redirect('/browse');
});

// Admin endpoint to sync game copies from Google Sheets
app.post('/admin/sync-copies', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);

    const results = await syncGameCopies(db, sheetsConfig, cache);

    // Also refresh the enriched games catalog
    const gameDataService = new GameDataService(db, sheetsConfig, cache);
    await gameDataService.refreshCatalog();

    return c.json({
      success: true,
      message: `Synced ${results.length} games and refreshed catalog`,
      results,
    });
  } catch (error) {
    console.error('Error syncing copies:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to sync game copies',
      },
      500
    );
  }
});

// Admin endpoint to check which games are out of sync
app.get('/admin/sync-status', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);

    const outOfSync = await getOutOfSyncGames(db, sheetsConfig, cache);

    // Also check enriched catalog status
    const gameDataService = new GameDataService(db, sheetsConfig, cache);
    const enrichedGames = await gameDataService.getEnrichedGames();
    const enrichedCount = enrichedGames.filter((g) => g.enriched).length;

    return c.json({
      success: true,
      outOfSync,
      totalOutOfSync: outOfSync.length,
      enrichedGames: {
        total: enrichedGames.length,
        enriched: enrichedCount,
        pending: enrichedGames.length - enrichedCount,
      },
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to check sync status',
      },
      500
    );
  }
});

// Admin endpoint to invalidate cache
app.post('/admin/cache/invalidate', async (c) => {
  try {
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);
    const sheetsService = new GoogleSheetsService(sheetsConfig, cache);

    await sheetsService.invalidateCache();

    return c.json({
      success: true,
      message: 'Cache invalidated successfully',
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to invalidate cache',
      },
      500
    );
  }
});

// Admin endpoint to refresh cache
app.post('/admin/cache/refresh', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);

    // Refresh both sheets cache and enriched catalog
    const sheetsService = new GoogleSheetsService(sheetsConfig, cache);
    const games = await sheetsService.refreshCache();

    const gameDataService = new GameDataService(db, sheetsConfig, cache);
    const enrichedGames = await gameDataService.refreshCatalog();

    return c.json({
      success: true,
      message: `Cache refreshed with ${games.length} games, ${enrichedGames.length} enriched`,
      gameCount: games.length,
      enrichedCount: enrichedGames.length,
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to refresh cache',
      },
      500
    );
  }
});

// Scheduled handler for Cron Triggers
async function scheduled(
  controller: any, // ScheduledController from Cloudflare Workers
  env: any, // Bindings
  _ctx: any // ExecutionContext
) {
  console.log(
    `Cron trigger fired: ${controller.cron} at ${new Date(controller.scheduledTime)}`
  );

  try {
    const db = createDatabase(env.DB);
    const sheetsConfig = getGoogleSheetsConfig(env);
    const cache = new KVCacheService(env.CACHE);

    // Run the sync
    const results = await syncGameCopies(db, sheetsConfig, cache);

    // Also refresh the enriched games catalog in background
    const gameDataService = new GameDataService(db, sheetsConfig, cache);
    gameDataService.refreshCatalog().catch((error) => {
      console.error('Background catalog refresh failed:', error);
    });

    // Log results
    const summary = results.reduce(
      (acc, result) => {
        acc[result.action] = (acc[result.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log(`Sync completed: ${JSON.stringify(summary)}`);

    // Log any significant changes
    const significantChanges = results.filter(
      (r) => Math.abs(r.copiesChanged) > 0
    );
    if (significantChanges.length > 0) {
      console.log(
        'Significant changes:',
        significantChanges
          .map(
            (c) =>
              `${c.gameName}: ${c.action} ${Math.abs(c.copiesChanged)} copies`
          )
          .join(', ')
      );
    }
  } catch (error) {
    console.error('Scheduled sync failed:', error);
    // Don't throw - let the cron continue running
  }
}

// Export both the Hono app and scheduled handler
export default {
  fetch: app.fetch,
  scheduled,
};
