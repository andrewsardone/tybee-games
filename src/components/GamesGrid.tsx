import { FC } from 'hono/jsx';
import GameCard from './GameCard';
import EnrichedGameCard from './EnrichedGameCard';
import { type GameWithAvailability } from '../services/games';
import { type EnrichedGame } from '../services/gameData';

interface GamesGridProps {
  games: GameWithAvailability[] | EnrichedGame[];
}

// Type guard to check if game is enriched
function isEnrichedGame(
  game: GameWithAvailability | EnrichedGame
): game is EnrichedGame {
  return 'enriched' in game;
}

const GamesGrid: FC<GamesGridProps> = ({ games }) => {
  return (
    <div className="games-grid">
      {games.map((game) =>
        isEnrichedGame(game) ? (
          <EnrichedGameCard key={game.id} game={game} />
        ) : (
          <GameCard key={game.id} game={game} />
        )
      )}
    </div>
  );
};

export default GamesGrid;
