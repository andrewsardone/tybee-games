import { FC } from 'hono/jsx';
import GameCard from './GameCard';
import { type GameWithAvailability } from '../services/games';

interface GamesGridProps {
  games: GameWithAvailability[];
}

const GamesGrid: FC<GamesGridProps> = ({ games }) => {
  return (
    <div className="games-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
};

export default GamesGrid;
