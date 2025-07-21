import { FC } from 'hono/jsx';
import FilterForm from './FilterForm';

interface MainPageProps {
  players: string;
  duration: string;
  complexity: string;
  search: string;
  queryString: string;
}

const MainPage: FC<MainPageProps> = ({
  players,
  duration,
  complexity,
  search,
  queryString,
}) => {
  return (
    <>
      <header className="site-header">
        <div className="header-content">
          <img
            src="/static/img/pool-turtle-logo.png"
            alt="Pool Turtle Logo"
            className="logo"
          />
          <div className="header-text">
            <h1>Tybee Games Collection</h1>
            <p className="tagline">Your favorite board games await</p>
          </div>
        </div>
      </header>

      <FilterForm
        players={players}
        duration={duration}
        complexity={complexity}
        search={search}
      />

      <div
        hx-get={`/${queryString}`}
        hx-trigger="load"
        hx-target="#games-results"
        id="games-loader"
      >
        <div id="games-results">Loading games...</div>
      </div>
    </>
  );
};

export default MainPage;
