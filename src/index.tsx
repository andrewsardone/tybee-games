import { Hono } from 'hono';
import { createDatabase } from './database/connection';
import { getGamesWithFilters } from './services/games';
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
