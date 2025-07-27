import { Hono } from 'hono';
import { createDatabase } from './database/connection';
import { getGamesWithFilters } from './services/games';
import { getGoogleSheetsConfig } from './services/config';
import { syncGameCopies, getOutOfSyncGames } from './services/copySync';
import {
  getQueryParams,
  buildQueryString,
  queryParamsToGameFilters,
} from './services/search';
import Layout from './components/Layout';
import MainPage from './components/MainPage';
import ResultsInfo from './components/ResultsInfo';
import GamesGrid from './components/GamesGrid';
import ErrorMessage from './components/ErrorMessage';

type Bindings = {
  DB: D1Database;
  GOOGLE_SHEETS_API_KEY: string;
  GOOGLE_SHEETS_SPREADSHEET_ID: string;
  GOOGLE_SHEETS_RANGE: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  // Get URL parameters to pre-populate form
  const queryParams = getQueryParams(c);
  const { players, duration, complexity, search } = queryParams;

  // Check if this is an HTMX request
  const isHtmxRequest = c.req.header('HX-Request') === 'true';

  // If it's an HTMX request, return just the games partial
  if (isHtmxRequest) {
    try {
      const db = createDatabase(c.env.DB);

      const filters = queryParamsToGameFilters(queryParams);

      const sheetsConfig = getGoogleSheetsConfig(c.env);
      const games = await getGamesWithFilters(db, filters, sheetsConfig);

      // Return JSX components for HTMX response
      return c.render(
        <>
          <ResultsInfo gameCount={games.length} filters={filters} />
          <GamesGrid games={games} />
        </>
      );
    } catch (error) {
      console.error('Error loading games:', error);
      return c.render(<ErrorMessage />);
    }
  }

  const queryString = buildQueryString(queryParams);

  return c.render(
    <Layout>
      <MainPage
        players={players}
        duration={duration}
        complexity={complexity}
        search={search}
        queryString={queryString}
      />
    </Layout>
  );
});

// Keep the original /games route for direct access
app.get('/games', async (c) => {
  // Redirect to home page for now, or could return the full page
  return c.redirect('/');
});

// Admin endpoint to sync game copies from Google Sheets
app.post('/admin/sync-copies', async (c) => {
  try {
    const db = createDatabase(c.env.DB);
    const sheetsConfig = getGoogleSheetsConfig(c.env);

    const results = await syncGameCopies(db, sheetsConfig);

    return c.json({
      success: true,
      message: `Synced ${results.length} games`,
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

    const outOfSync = await getOutOfSyncGames(db, sheetsConfig);

    return c.json({
      success: true,
      outOfSync,
      totalOutOfSync: outOfSync.length,
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

    // Run the sync
    const results = await syncGameCopies(db, sheetsConfig);

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
