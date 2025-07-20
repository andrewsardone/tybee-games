import { FC } from 'hono/jsx';
import {
  formatPlayerCount,
  formatDuration,
  isGameAvailable,
  type GameWithAvailability,
} from '../services/games';

interface GameCardProps {
  game: GameWithAvailability;
}

const GameCard: FC<GameCardProps> = ({ game }) => {
  const available = isGameAvailable(game);

  return (
    <div className="game-card" id={`game-${game.id}`}>
      <div className="game-title">{game.name}</div>
      <div className="game-description">{game.description || ''}</div>
      <div className="game-meta">
        {formatPlayerCount(game.minPlayers, game.maxPlayers)} •{' '}
        {formatDuration(game.minDuration, game.maxDuration)} • Complexity:{' '}
        {game.complexityLevel}/5
      </div>
      <span className={`status ${available ? 'available' : 'borrowed'}`}>
        {available
          ? `Available (${game.availableCopies} copies)`
          : 'Currently Borrowed'}
      </span>
    </div>
  );
};

export default GameCard;
