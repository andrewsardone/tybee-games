import { FC } from 'hono/jsx';

interface RecommendationStep4Props {
  players: string;
  learningTime: string;
  duration: string;
  currentStrategy?: string;
}

const RecommendationStep4: FC<RecommendationStep4Props> = ({
  players,
  learningTime,
  duration,
  currentStrategy,
}) => {
  const strategyValue = currentStrategy || '3';

  return (
    <div className="recommendation-step">
      <div className="step-header">
        <div className="step-progress">
          <div className="progress-bar">
            <div className="progress-fill" style="width: 80%"></div>
          </div>
          <span className="step-counter">Step 4 of 5</span>
        </div>
        <h2>Strategy vs Luck?</h2>
        <p>How much do you want skill vs chance to matter?</p>
      </div>

      <form
        hx-get={`/recommend/step/5?players=${players}&learningTime=${learningTime}&duration=${duration}`}
        hx-target="body"
        hx-swap="innerHTML scroll:top"
        hx-push-url="true"
        hx-trigger="change"
        className="step-form"
      >
        <div className="duration-options">
          <label className="duration-option">
            <input
              type="radio"
              name="strategy"
              value="1"
              checked={strategyValue === '1'}
              required
            />
            <div className="option-card">
              <div className="option-icon">🎲</div>
              <div className="option-content">
                <h3>Pure Luck</h3>
                <p>Dice rolls and card draws decide everything</p>
              </div>
            </div>
          </label>

          <label className="duration-option">
            <input
              type="radio"
              name="strategy"
              value="2"
              checked={strategyValue === '2'}
              required
            />
            <div className="option-card">
              <div className="option-icon">🎲🎯</div>
              <div className="option-content">
                <h3>Mostly Luck</h3>
                <p>Some choices, but chance is king</p>
              </div>
            </div>
          </label>

          <label className="duration-option">
            <input
              type="radio"
              name="strategy"
              value="3"
              checked={strategyValue === '3'}
              required
            />
            <div className="option-card">
              <div className="option-icon">⚖️</div>
              <div className="option-content">
                <h3>Balanced</h3>
                <p>Good mix of skill and chance</p>
              </div>
            </div>
          </label>

          <label className="duration-option">
            <input
              type="radio"
              name="strategy"
              value="4"
              checked={strategyValue === '4'}
              required
            />
            <div className="option-card">
              <div className="option-icon">🧠🎲</div>
              <div className="option-content">
                <h3>Mostly Strategy</h3>
                <p>Planning matters, with some luck</p>
              </div>
            </div>
          </label>

          <label className="duration-option">
            <input
              type="radio"
              name="strategy"
              value="5"
              checked={strategyValue === '5'}
              required
            />
            <div className="option-card">
              <div className="option-icon">🧠</div>
              <div className="option-content">
                <h3>Pure Strategy</h3>
                <p>Every decision counts, minimal luck</p>
              </div>
            </div>
          </label>
        </div>

        <div className="step-actions">
          <button
            type="button"
            className="back-button"
            hx-get={`/recommend/step/3?players=${players}&learningTime=${learningTime}`}
            hx-target="body"
            hx-swap="innerHTML scroll:top"
            hx-push-url="true"
          >
            ← Previous
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecommendationStep4;
