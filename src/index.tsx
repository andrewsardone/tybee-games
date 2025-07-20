import { Hono } from 'hono';
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
  const queryString = buildQueryString(players, duration, complexity, search);

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
