import { Hono } from 'hono';
import { createDatabase } from './database/connection';
import { getGoogleSheetsConfig } from './services/config';
import { syncGameCopies, getOutOfSyncGames } from './services/copySync';
import { GoogleSheetsService } from './services/googleSheets';
import { KVCacheService } from './services/cache';
import { GameDataService } from './services/gameData';
import {
  getQueryParams,
  buildQueryString,
  queryParamsToEnrichedFilters,
} from './services/search';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import BrowsePage from './components/BrowsePage';
import EnrichedResultsInfo from './components/EnrichedResultsInfo';
import GamesGrid from './components/GamesGrid';
import ErrorMessage from './components/ErrorMessage';
import RecommendationStep1 from './components/RecommendationStep1';
import RecommendationStep2 from './components/RecommendationStep2';
import RecommendationStep3 from './components/RecommendationStep3';
import RecommendationStep4 from './components/RecommendationStep4';
import RecommendationStep5 from './components/RecommendationStep5';
import RecommendationResults from './components/RecommendationResults';
import GameDetailPage from './components/GameDetailPage';
import {
  RecommendationService,
  type RecommendationPreferences,
} from './services/recommendations';

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
  const {
    players,
    duration,
    complexity,
    search,
    category,
    mechanic,
    rating,
    year,
    availableOnly,
  } = queryParams;
  const queryString = buildQueryString(queryParams);

  return c.render(
    <Layout>
      <BrowsePage
        players={players}
        duration={duration}
        complexity={complexity}
        search={search}
        category={category}
        mechanic={mechanic}
        rating={rating}
        year={year}
        availableOnly={availableOnly}
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
    const filters = queryParamsToEnrichedFilters(queryParams);

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

    const games = await gameDataService.getCachedGames();

    if (games.length === 0) {
      return c.render(<span>Loading stats...</span>);
    }

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

// Recommendation flow - redirect to step 1
app.get('/recommend', async (c) => {
  return c.redirect('/recommend/step/1');
});

// Recommendation Step 1: Player Count
app.get('/recommend/step/1', async (c) => {
  const players = c.req.query('players');

  return c.render(
    <Layout>
      <RecommendationStep1 currentPlayers={players} />
    </Layout>
  );
});

// Recommendation Step 2: Learning Time
app.get('/recommend/step/2', async (c) => {
  const players = c.req.query('players') || '';
  const learningTime = c.req.query('learningTime');

  if (!players) {
    return c.redirect('/recommend/step/1');
  }

  return c.render(
    <Layout>
      <RecommendationStep2
        players={players}
        currentLearningTime={learningTime}
      />
    </Layout>
  );
});

// Recommendation Step 3: Play Duration
app.get('/recommend/step/3', async (c) => {
  const players = c.req.query('players') || '';
  const learningTime = c.req.query('learningTime') || '';
  const duration = c.req.query('duration');

  if (!players || !learningTime) {
    return c.redirect('/recommend/step/1');
  }

  return c.render(
    <Layout>
      <RecommendationStep3
        players={players}
        learningTime={learningTime}
        currentDuration={duration}
      />
    </Layout>
  );
});

// Recommendation Step 4: Strategy vs Luck
app.get('/recommend/step/4', async (c) => {
  const players = c.req.query('players') || '';
  const learningTime = c.req.query('learningTime') || '';
  const duration = c.req.query('duration') || '';
  const strategy = c.req.query('strategy');

  if (!players || !learningTime || !duration) {
    return c.redirect('/recommend/step/1');
  }

  return c.render(
    <Layout>
      <RecommendationStep4
        players={players}
        learningTime={learningTime}
        duration={duration}
        currentStrategy={strategy}
      />
    </Layout>
  );
});

// Recommendation Step 5: Theme Preferences
app.get('/recommend/step/5', async (c) => {
  const players = c.req.query('players') || '';
  const learningTime = c.req.query('learningTime') || '';
  const duration = c.req.query('duration') || '';
  const strategy = c.req.query('strategy') || '';
  const themes = c.req.query('themes');

  if (!players || !learningTime || !duration || !strategy) {
    return c.redirect('/recommend/step/1');
  }

  const currentThemes = themes ? themes.split(',') : [];

  return c.render(
    <Layout>
      <RecommendationStep5
        players={players}
        learningTime={learningTime}
        duration={duration}
        strategy={strategy}
        currentThemes={currentThemes}
      />
    </Layout>
  );
});

// Recommendation Results
app.get('/recommend/results', async (c) => {
  try {
    const players = c.req.query('players') || '';
    const learningTime = c.req.query('learningTime') || '';
    const duration = c.req.query('duration') || '';
    const strategy = c.req.query('strategy') || '';
    const themesParam = c.req.query('themes') || '';

    if (!players || !learningTime || !duration || !strategy) {
      return c.redirect('/recommend/step/1');
    }

    // Parse preferences
    const preferences: RecommendationPreferences = {
      players: players === '7+' ? 7 : parseInt(players),
      learningTime: learningTime as 'quick' | 'moderate' | 'complex',
      playDuration: duration as 'short' | 'medium' | 'long' | 'any',
      strategyPreference: parseInt(strategy),
      themes: themesParam ? themesParam.split(',').filter((t) => t.trim()) : [],
    };

    // Get games and generate recommendations
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);
    const gameDataService = new GameDataService(db, sheetsConfig, cache);

    const games = await gameDataService.getCachedGames();

    if (games.length === 0) {
      return c.render(
        <Layout>
          <div className="empty-cache-message">
            <h2>Games Loading...</h2>
            <p>
              Our game library is being updated. Please try again in a moment.
            </p>
            <p>
              <a href="/browse">Browse games</a> or <a href="/">return home</a>
            </p>
          </div>
        </Layout>
      );
    }

    const recommendations = RecommendationService.generateRecommendations(
      games,
      preferences
    );

    return c.render(
      <Layout>
        <RecommendationResults
          recommendations={recommendations}
          preferences={{
            players,
            learningTime,
            duration,
            strategy,
            themes: preferences.themes,
          }}
        />
      </Layout>
    );
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return c.render(
      <Layout>
        <ErrorMessage message="Failed to generate recommendations. Please try again." />
      </Layout>
    );
  }
});

// Individual game detail page
app.get('/games/:id', async (c) => {
  try {
    const gameId = c.req.param('id');
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);
    const gameDataService = new GameDataService(db, sheetsConfig, cache);

    const games = await gameDataService.getCachedGames();

    if (games.length === 0) {
      return c.render(
        <Layout>
          <div className="empty-cache-message">
            <h2>Games Loading...</h2>
            <p>
              Our game library is being updated. Please try again in a moment.
            </p>
            <p>
              <a href="/browse">Browse games</a> or <a href="/">return home</a>
            </p>
          </div>
        </Layout>
      );
    }

    const game = games.find((g) => g.id === gameId);

    if (!game) {
      return c.render(
        <Layout>
          <ErrorMessage message="Game not found. It may have been removed from our collection." />
        </Layout>
      );
    }

    return c.render(
      <Layout>
        <GameDetailPage game={game} />
      </Layout>
    );
  } catch (error) {
    console.error('Error loading game details:', error);
    return c.render(
      <Layout>
        <ErrorMessage message="Failed to load game details. Please try again." />
      </Layout>
    );
  }
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
    const enrichedGames = await gameDataService.getEnrichedGames(true);
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

// Admin endpoint for full resync (clear all caches and rebuild from Google Sheets)
app.post('/admin/full-resync', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);
    const gameDataService = new GameDataService(db, sheetsConfig, cache);

    console.log('Starting full resync...');
    const enrichedGames = await gameDataService.fullResync();

    const enrichedCount = enrichedGames.filter((g) => g.enriched).length;

    return c.json({
      success: true,
      message: `Full resync initiated: ${enrichedGames.length} games returned from cache, refresh happening in background`,
      totalGames: enrichedGames.length,
      enrichedGames: enrichedCount,
      missingEnrichment: enrichedGames.length - enrichedCount,
      note: 'Data refreshing in background - subsequent requests will have updated data',
    });
  } catch (error) {
    console.error('Error during full resync:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to complete full resync',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Admin endpoint for progressive enrichment (enrich games missing BGG data)
app.post('/admin/enrich-missing', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);
    const gameDataService = new GameDataService(db, sheetsConfig, cache);

    // Get maxGames parameter (default 10)
    const maxGames = parseInt(c.req.query('maxGames') || '10');

    console.log(
      `Starting progressive enrichment for up to ${maxGames} games...`
    );
    const result = await gameDataService.enrichMissingGames(maxGames);

    return c.json({
      success: true,
      message: `Progressive enrichment complete: ${result.enriched}/${result.total} games enriched`,
      enrichedCount: result.enriched,
      attemptedCount: result.total,
    });
  } catch (error) {
    console.error('Error during progressive enrichment:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to complete progressive enrichment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Admin endpoint to check enrichment status
app.get('/admin/enrichment-status', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);
    const gameDataService = new GameDataService(db, sheetsConfig, cache);

    const games = await gameDataService.getEnrichedGames(true);
    const enrichedGames = games.filter((g) => g.enriched);
    const missingGames = games.filter((g) => !g.enriched);

    return c.json({
      success: true,
      totalGames: games.length,
      enrichedGames: enrichedGames.length,
      missingEnrichment: missingGames.length,
      enrichmentPercentage: Math.round(
        (enrichedGames.length / games.length) * 100
      ),
      missingGamesList: missingGames
        .slice(0, 20)
        .map((g) => ({ id: g.id, name: g.name })), // First 20 missing games
    });
  } catch (error) {
    console.error('Error checking enrichment status:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to check enrichment status',
      },
      500
    );
  }
});

// Admin endpoint for force clear cache (only use when absolutely necessary)
app.post('/admin/force-clear-cache', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);
    const cache = new KVCacheService(c.env.CACHE);
    const gameDataService = new GameDataService(db, sheetsConfig, cache);

    console.log('Force clearing cache and rebuilding...');
    const enrichedGames = await gameDataService.forceClearAndRebuild();

    const enrichedCount = enrichedGames.filter((g) => g.enriched).length;

    return c.json({
      success: true,
      message: `Cache force cleared and rebuilt: ${enrichedGames.length} games loaded, ${enrichedCount} enriched with BGG data`,
      totalGames: enrichedGames.length,
      enrichedGames: enrichedCount,
      missingEnrichment: enrichedGames.length - enrichedCount,
      warning: 'This operation cleared all cached data - use sparingly',
    });
  } catch (error) {
    console.error('Error during force clear:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to force clear cache',
        details: error instanceof Error ? error.message : 'Unknown error',
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
