import { FC } from 'hono/jsx';
import FilterForm from './FilterForm';

interface BrowsePageProps {
  players: string;
  duration: string;
  complexity: string;
  search: string;
  queryString: string;
}

const BrowsePage: FC<BrowsePageProps> = ({
  players,
  duration,
  complexity,
  search,
  queryString,
}) => {
  return (
    <>
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
        <h1>Browse Games</h1>
        <p>Explore our complete collection of board games</p>
      </div>

      <FilterForm
        players={players}
        duration={duration}
        complexity={complexity}
        search={search}
      />

      <div
        hx-get={`/browse/games${queryString}`}
        hx-trigger="load"
        hx-target="#games-results"
        hx-indicator="#loading-indicator"
        id="games-loader"
      >
        <div
          id="loading-indicator"
          className="loading-indicator htmx-indicator"
        >
          <div className="loading-spinner"></div>
          <span>Loading games...</span>
        </div>

        <div id="games-results">
          <div className="loading-skeleton">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrowsePage;
