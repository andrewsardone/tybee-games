import { Hono, type Context } from 'hono';
import { createDatabase } from './database/connection';
import { getGamesWithFilters, type GameFilters } from './services/games';
import Layout from './components/Layout';
import MainPage from './components/MainPage';
import ResultsInfo from './components/ResultsInfo';
import GamesGrid from './components/GamesGrid';
import ErrorMessage from './components/ErrorMessage';

type Bindings = {
  DB: D1Database;
};

interface QueryParams {
  players: string;
  duration: string;
  complexity: string;
  search: string;
}

// Helper function to extract query parameters
const getQueryParams = (c: Context<{ Bindings: Bindings }>): QueryParams => {
  return {
    players: c.req.query('players') || '',
    duration: c.req.query('duration') || '',
    complexity: c.req.query('complexity') || '',
    search: c.req.query('search') || '',
  };
};

// Helper function to build query string from parameters
const buildQueryString = (params: QueryParams): string => {
  // Filter out empty values and create URLSearchParams
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== '')
  );

  const searchParams = new URLSearchParams(filteredParams);
  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  // Get URL parameters to pre-populate form
  const { players, duration, complexity, search } = getQueryParams(c);

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

  const queryParams = { players, duration, complexity, search };
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

export default app;
