import { FC } from 'hono/jsx';
import type { EnrichedGame } from '../services/gameData';

interface GameDetailPageProps {
  game: EnrichedGame;
}

const GameDetailPage: FC<GameDetailPageProps> = ({ game }) => {
  const bgg = game.bggData;

  // Format complexity level
  const getComplexityLabel = (complexity: number) => {
    if (complexity <= 1.5) return 'Light';
    if (complexity <= 2.5) return 'Medium-Light';
    if (complexity <= 3.5) return 'Medium';
    if (complexity <= 4.0) return 'Medium-Heavy';
    return 'Heavy';
  };

  // Format player range
  const formatPlayerRange = () => {
    if (!bgg) return 'Unknown';
    if (bgg.minPlayers === bgg.maxPlayers) {
      return `${bgg.minPlayers} player${bgg.minPlayers === 1 ? '' : 's'}`;
    }
    return `${bgg.minPlayers}-${bgg.maxPlayers} players`;
  };

  // Format play time
  const formatPlayTime = () => {
    if (!bgg) return 'Unknown';
    if (bgg.minPlayTime === bgg.maxPlayTime || !bgg.minPlayTime) {
      return `${bgg.playingTime || bgg.maxPlayTime} minutes`;
    }
    return `${bgg.minPlayTime}-${bgg.maxPlayTime} minutes`;
  };

  return (
    <div className="game-detail">
      <div className="detail-header">
        <button
          className="back-button"
          hx-get="/browse"
          hx-target="body"
          hx-swap="transition:true"
          hx-push-url="true"
        >
          ← Back to Browse
        </button>
      </div>

      <div className="game-hero">
        <div className="game-image-container">
          <img
            src={game.displayImage}
            alt={game.name}
            className="game-hero-image"
            loading="lazy"
          />
          <div className="availability-badge">
            {game.availableCopies > 0 ? (
              <span className="available">
                ✓ Available ({game.availableCopies} cop
                {game.availableCopies === 1 ? 'y' : 'ies'})
              </span>
            ) : (
              <span className="unavailable">
                ✗ Currently Rented ({game.totalCopies} cop
                {game.totalCopies === 1 ? 'y' : 'ies'})
              </span>
            )}
          </div>
        </div>

        <div className="game-info">
          <h1 className="game-title">{game.name}</h1>

          {bgg && (
            <div className="game-meta">
              <div className="meta-item">
                <span className="meta-label">Year:</span>
                <span className="meta-value">{bgg.yearPublished}</span>
              </div>
              {bgg.publisher.length > 0 && (
                <div className="meta-item">
                  <span className="meta-label">Publisher:</span>
                  <span className="meta-value">{bgg.publisher.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          <div className="game-stats">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-label">Players</div>
                <div className="stat-value">{formatPlayerRange()}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-label">Play Time</div>
                <div className="stat-value">{formatPlayTime()}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🧠</div>
              <div className="stat-content">
                <div className="stat-label">Complexity</div>
                <div className="stat-value">
                  {bgg ? getComplexityLabel(bgg.complexity) : 'Unknown'}
                  {bgg && (
                    <span className="complexity-score">
                      ({bgg.complexity.toFixed(1)}/5)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {bgg && bgg.rating > 0 && (
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <div className="stat-label">BGG Rating</div>
                  <div className="stat-value">
                    {bgg.rating.toFixed(1)}/10
                    {bgg.rank > 0 && (
                      <span className="rank-info">(#{bgg.rank})</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {game.availableCopies > 0 && (
            <div className="action-buttons">
              <button className="rent-button primary">
                🎯 Reserve This Game
              </button>
              <button className="wishlist-button secondary">
                ❤️ Add to Wishlist
              </button>
            </div>
          )}
        </div>
      </div>

      {bgg && bgg.description && (
        <div className="game-description">
          <h2>About This Game</h2>
          <div
            className="description-content"
            dangerouslySetInnerHTML={{ __html: bgg.description }}
          />
        </div>
      )}

      {bgg && (bgg.categories.length > 0 || bgg.mechanics.length > 0) && (
        <div className="game-details">
          <div className="details-grid">
            {bgg.categories.length > 0 && (
              <div className="detail-section">
                <h3>Categories</h3>
                <div className="tag-list">
                  {bgg.categories.map((category) => (
                    <span key={category} className="tag category-tag">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {bgg.mechanics.length > 0 && (
              <div className="detail-section">
                <h3>Game Mechanics</h3>
                <div className="tag-list">
                  {bgg.mechanics.map((mechanic) => (
                    <span key={mechanic} className="tag mechanic-tag">
                      {mechanic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="related-actions">
        <h2>What's Next?</h2>
        <div className="action-cards">
          <div className="action-card">
            <h3>Get Recommendations</h3>
            <p>Find more games you'll love based on your preferences</p>
            <button
              className="action-button"
              hx-get="/recommend"
              hx-target="body"
              hx-swap="transition:true"
              hx-push-url="true"
            >
              Get Recommendations
            </button>
          </div>

          <div className="action-card">
            <h3>Browse Similar Games</h3>
            <p>Explore games with similar themes and mechanics</p>
            <button
              className="action-button"
              hx-get={`/browse?search=${encodeURIComponent(bgg?.categories[0] || game.name.split(' ')[0])}`}
              hx-target="body"
              hx-swap="transition:true"
              hx-push-url="true"
            >
              Browse Similar
            </button>
          </div>

          <div className="action-card">
            <h3>View All Games</h3>
            <p>See our complete collection of board games</p>
            <button
              className="action-button"
              hx-get="/browse"
              hx-target="body"
              hx-swap="transition:true"
              hx-push-url="true"
            >
              Browse All Games
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetailPage;
