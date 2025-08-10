import { FC } from 'hono/jsx';
import { type EnrichedGame } from '../services/gameData';

interface EnrichedGameCardProps {
  game: EnrichedGame;
}

const EnrichedGameCard: FC<EnrichedGameCardProps> = ({ game }) => {
  const available = game.availableCopies > 0;

  return (
    <div className="game-card" id={`game-${game.id}`}>
      <button
        className="game-image-link"
        hx-get={`/games/${game.id}`}
        hx-target="body"
        hx-swap="transition:true"
        hx-push-url="true"
      >
        <div className="game-image">
          {game.bggData?.thumbnail ? (
            <img src={game.displayThumbnail} alt={game.name} loading="lazy" />
          ) : (
            <div className="game-placeholder">
              <span>🎲</span>
              <small>Loading image...</small>
            </div>
          )}
        </div>
      </button>
      <div className="game-content">
        <div className="game-title">{game.name}</div>
        {game.yearPublished && (
          <div className="game-year">({game.yearPublished})</div>
        )}
        <div className="game-meta">
          {game.playerRange} • {game.durationRange}
          {game.complexityLevel > 0 && (
            <> • Complexity: {Math.round(game.complexityLevel)}/5</>
          )}
        </div>
        {game.description && (
          <div className="game-description">
            {game.description.length > 100
              ? `${game.description.substring(0, 100)}...`
              : game.description}
          </div>
        )}
        {game.categories.length > 0 && (
          <div className="game-categories">
            {game.categories.slice(0, 3).map((category) => (
              <span key={category} className="category-tag">
                {category}
              </span>
            ))}
          </div>
        )}
        <div className="game-footer">
          <span className={`status ${available ? 'available' : 'borrowed'}`}>
            {available
              ? `Available (${game.availableCopies} copies)`
              : 'Currently Borrowed'}
          </span>
          {game.rating > 0 && (
            <span className="game-rating">⭐ {game.rating.toFixed(1)}</span>
          )}
        </div>
        <button
          className="view-details-button"
          hx-get={`/games/${game.id}`}
          hx-target="body"
          hx-swap="transition:true"
          hx-push-url="true"
        >
          View Details →
        </button>
        {!game.enriched && (
          <div className="enrichment-status">
            <small>Loading details...</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrichedGameCard;
