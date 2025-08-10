import { FC } from 'hono/jsx';

const HomePage: FC = () => {
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

      <div className="home-paths">
        <div className="path-card recommend-path">
          <div className="path-icon">🎯</div>
          <h2>Get a Recommendation</h2>
          <p>Find the perfect game for your group in 5 quick steps</p>
          <button
            className="path-button primary"
            hx-get="/recommend"
            hx-target="body"
            hx-swap="innerHTML scroll:top"
            hx-push-url="true"
          >
            Start Quiz
          </button>
        </div>

        <div className="path-card browse-path">
          <div className="path-icon">📚</div>
          <h2>Browse Our Library</h2>
          <p>Explore all available games with filters and search</p>
          <button
            className="path-button secondary"
            hx-get="/browse"
            hx-target="body"
            hx-swap="innerHTML scroll:top"
            hx-push-url="true"
          >
            Browse Games
          </button>
        </div>
      </div>

      <div className="home-stats">
        <div hx-get="/api/stats" hx-trigger="load" hx-swap="innerHTML">
          Loading game statistics...
        </div>
      </div>
    </>
  );
};

export default HomePage;
