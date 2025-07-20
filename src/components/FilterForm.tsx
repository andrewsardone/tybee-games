import { FC } from 'hono/jsx';

interface FilterFormProps {
  players: string;
  duration: string;
  complexity: string;
  search: string;
}

const FilterForm: FC<FilterFormProps> = ({
  players,
  duration,
  complexity,
  search,
}) => {
  return (
    <div className="filters">
      <form
        id="game-filters"
        hx-get="/"
        hx-target="#games-results"
        hx-trigger="change, input delay:300ms"
        hx-include="[name]"
        hx-push-url="true"
      >
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="players">Players</label>
            <select name="players" id="players">
              <option value="" selected={players === ''}>
                Any number
              </option>
              <option value="1" selected={players === '1'}>
                1 player
              </option>
              <option value="2" selected={players === '2'}>
                2 players
              </option>
              <option value="3" selected={players === '3'}>
                3 players
              </option>
              <option value="4" selected={players === '4'}>
                4 players
              </option>
              <option value="5" selected={players === '5'}>
                5+ players
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="duration">Duration</label>
            <select name="duration" id="duration">
              <option value="" selected={duration === ''}>
                Any duration
              </option>
              <option value="quick" selected={duration === 'quick'}>
                Quick (≤30 min)
              </option>
              <option value="medium" selected={duration === 'medium'}>
                Medium (30-60 min)
              </option>
              <option value="long" selected={duration === 'long'}>
                Long (60+ min)
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="complexity">Complexity</label>
            <select name="complexity" id="complexity">
              <option value="" selected={complexity === ''}>
                Any complexity
              </option>
              <option value="1" selected={complexity === '1'}>
                1 - Very Easy
              </option>
              <option value="2" selected={complexity === '2'}>
                2 - Easy
              </option>
              <option value="3" selected={complexity === '3'}>
                3 - Medium
              </option>
              <option value="4" selected={complexity === '4'}>
                4 - Hard
              </option>
              <option value="5" selected={complexity === '5'}>
                5 - Very Hard
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search">Search</label>
            <input
              type="search"
              name="search"
              id="search"
              placeholder="Game name..."
              value={search}
            />
          </div>

          <div className="filter-group">
            <button
              type="button"
              className="clear-filters"
              onclick="window.location.href = '/'; return false;"
            >
              Clear
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FilterForm;
