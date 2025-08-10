import { FC } from 'hono/jsx';
import { type EnrichedGameFilters } from '../services/gameData';

interface EnrichedResultsInfoProps {
  gameCount: number;
  filters: EnrichedGameFilters;
}

const EnrichedResultsInfo: FC<EnrichedResultsInfoProps> = ({
  gameCount,
  filters,
}) => {
  const hasFilters = Object.values(filters).some(
    (value) =>
      value !== undefined &&
      value !== null &&
      (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <div className="results-count">
      Found {gameCount} game{gameCount === 1 ? '' : 's'}
      {hasFilters ? ' matching your filters' : ''}
    </div>
  );
};

export default EnrichedResultsInfo;
