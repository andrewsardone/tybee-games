import { FC } from 'hono/jsx';
import { type GameFilters } from '../services/games';

interface ResultsInfoProps {
  gameCount: number;
  filters: GameFilters;
}

const ResultsInfo: FC<ResultsInfoProps> = ({ gameCount, filters }) => {
  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="results-count">
      Found {gameCount} game{gameCount === 1 ? '' : 's'}
      {hasFilters ? ' matching your filters' : ''}
    </div>
  );
};

export default ResultsInfo;
