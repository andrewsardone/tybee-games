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
        </div>{' '}
      </div>

      <div className="path-card stats-card">
        <div className="stats-content">
          <div className="stats-section">
            <div hx-get="/api/stats" hx-trigger="load" hx-swap="innerHTML">
              Loading game statistics...
            </div>
          </div>

          <div className="quick-filters-section">
            <h3>Quick Browse</h3>
            <p>Jump to popular categories</p>
            <div className="filter-links">
              <button
                className="filter-link"
                hx-get="/browse?category=Strategy"
                hx-target="body"
                hx-swap="innerHTML scroll:top"
                hx-push-url="true"
              >
                🧠 Strategy
              </button>
              <button
                className="filter-link"
                hx-get="/browse?category=Family"
                hx-target="body"
                hx-swap="innerHTML scroll:top"
                hx-push-url="true"
              >
                👨‍👩‍👧‍👦 Family
              </button>
              <button
                className="filter-link"
                hx-get="/browse?category=Party"
                hx-target="body"
                hx-swap="innerHTML scroll:top"
                hx-push-url="true"
              >
                🎉 Party
              </button>
              <button
                className="filter-link"
                hx-get="/browse?players=2"
                hx-target="body"
                hx-swap="innerHTML scroll:top"
                hx-push-url="true"
              >
                👥 2 Players
              </button>
              <button
                className="filter-link"
                hx-get="/browse?duration=short"
                hx-target="body"
                hx-swap="innerHTML scroll:top"
                hx-push-url="true"
              >
                ⏱️ Quick Games
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
