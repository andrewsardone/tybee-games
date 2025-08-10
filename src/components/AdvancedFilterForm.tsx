import { FC } from 'hono/jsx';

interface AdvancedFilterFormProps {
  players: string;
  duration: string;
  complexity: string;
  search: string;
  category: string;
  mechanic: string;
  rating: string;
  year: string;
  availableOnly: string;
}

const AdvancedFilterForm: FC<AdvancedFilterFormProps> = ({
  players,
  duration,
  complexity,
  search,
  category,
  mechanic,
  rating,
  year,
  availableOnly,
}) => {
  return (
    <div className="advanced-filters">
      <form
        id="advanced-game-filters"
        hx-get="/browse/games"
        hx-target="#games-results"
        hx-trigger="change, input delay:300ms"
        hx-include="[name]"
        hx-push-url="true"
        hx-indicator="#loading-indicator"
      >
        {/* Primary filters row */}
        <div className="filter-row primary-filters">
          <div className="filter-group">
            <label htmlFor="search">Search Games</label>
            <input
              type="search"
              name="search"
              id="search"
              placeholder="Game name, publisher, or theme..."
              value={search}
              className="search-input"
            />
          </div>

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
                5 players
              </option>
              <option value="6" selected={players === '6'}>
                6 players
              </option>
              <option value="7+" selected={players === '7+'}>
                7+ players
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="availableOnly">Availability</label>
            <select name="availableOnly" id="availableOnly">
              <option value="true" selected={availableOnly !== 'false'}>
                Available now
              </option>
              <option value="false" selected={availableOnly === 'false'}>
                All games
              </option>
            </select>
          </div>
        </div>

        {/* Advanced filters toggle */}
        <div className="advanced-toggle">
          <button
            type="button"
            className="toggle-advanced"
            onclick="document.querySelector('.secondary-filters').classList.toggle('expanded'); this.textContent = this.textContent.includes('Show') ? '▲ Hide Advanced Filters' : '▼ Show Advanced Filters';"
          >
            ▼ Show Advanced Filters
          </button>
        </div>

        {/* Secondary filters row (collapsible) */}
        <div className="filter-row secondary-filters">
          <div className="filter-group">
            <label htmlFor="duration">Play Time</label>
            <select name="duration" id="duration">
              <option value="" selected={duration === ''}>
                Any duration
              </option>
              <option value="quick" selected={duration === 'quick'}>
                Quick (≤45 min)
              </option>
              <option value="medium" selected={duration === 'medium'}>
                Medium (45-90 min)
              </option>
              <option value="long" selected={duration === 'long'}>
                Long (90+ min)
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
                Light (1-2)
              </option>
              <option value="2" selected={complexity === '2'}>
                Medium-Light (2-3)
              </option>
              <option value="3" selected={complexity === '3'}>
                Medium (3-4)
              </option>
              <option value="4" selected={complexity === '4'}>
                Heavy (4+)
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select name="category" id="category">
              <option value="" selected={category === ''}>
                Any category
              </option>
              <option value="Strategy" selected={category === 'Strategy'}>
                Strategy Games
              </option>
              <option value="Family" selected={category === 'Family'}>
                Family Games
              </option>
              <option value="Thematic" selected={category === 'Thematic'}>
                Thematic Games
              </option>
              <option value="War" selected={category === 'War'}>
                War Games
              </option>
              <option value="Economic" selected={category === 'Economic'}>
                Economic Games
              </option>
              <option value="Fantasy" selected={category === 'Fantasy'}>
                Fantasy
              </option>
              <option value="Sci-fi" selected={category === 'Sci-fi'}>
                Science Fiction
              </option>
              <option value="Adventure" selected={category === 'Adventure'}>
                Adventure
              </option>
              <option value="Card" selected={category === 'Card'}>
                Card Games
              </option>
              <option value="Party" selected={category === 'Party'}>
                Party Games
              </option>
              <option value="Cooperative" selected={category === 'Cooperative'}>
                Cooperative
              </option>
              <option value="Abstract" selected={category === 'Abstract'}>
                Abstract Strategy
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="mechanic">Mechanic</label>
            <select name="mechanic" id="mechanic">
              <option value="" selected={mechanic === ''}>
                Any mechanic
              </option>
              <option
                value="Area Control"
                selected={mechanic === 'Area Control'}
              >
                Area Control
              </option>
              <option
                value="Deck Building"
                selected={mechanic === 'Deck Building'}
              >
                Deck Building
              </option>
              <option
                value="Worker Placement"
                selected={mechanic === 'Worker Placement'}
              >
                Worker Placement
              </option>
              <option
                value="Tile Placement"
                selected={mechanic === 'Tile Placement'}
              >
                Tile Placement
              </option>
              <option
                value="Set Collection"
                selected={mechanic === 'Set Collection'}
              >
                Set Collection
              </option>
              <option
                value="Engine Building"
                selected={mechanic === 'Engine Building'}
              >
                Engine Building
              </option>
              <option value="Drafting" selected={mechanic === 'Drafting'}>
                Drafting
              </option>
              <option
                value="Roll and Write"
                selected={mechanic === 'Roll and Write'}
              >
                Roll and Write
              </option>
              <option value="Cooperative" selected={mechanic === 'Cooperative'}>
                Cooperative Play
              </option>
              <option
                value="Hidden Roles"
                selected={mechanic === 'Hidden Roles'}
              >
                Hidden Roles
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="rating">Min Rating</label>
            <select name="rating" id="rating">
              <option value="" selected={rating === ''}>
                Any rating
              </option>
              <option value="6" selected={rating === '6'}>
                6.0+ (Good)
              </option>
              <option value="7" selected={rating === '7'}>
                7.0+ (Very Good)
              </option>
              <option value="8" selected={rating === '8'}>
                8.0+ (Excellent)
              </option>
              <option value="9" selected={rating === '9'}>
                9.0+ (Outstanding)
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="year">Published</label>
            <select name="year" id="year">
              <option value="" selected={year === ''}>
                Any year
              </option>
              <option value="2020s" selected={year === '2020s'}>
                2020s
              </option>
              <option value="2010s" selected={year === '2010s'}>
                2010s
              </option>
              <option value="2000s" selected={year === '2000s'}>
                2000s
              </option>
              <option value="classic" selected={year === 'classic'}>
                Before 2000
              </option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="filter-actions">
          <button
            type="button"
            className="clear-filters"
            onclick="window.location.href = '/browse'; return false;"
          >
            Clear All Filters
          </button>
          <div className="filter-info">
            <span id="results-count">Loading...</span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdvancedFilterForm;
