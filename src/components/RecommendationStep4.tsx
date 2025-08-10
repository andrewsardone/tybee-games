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
        hx-swap="innerHTML"
        hx-push-url="true"
        className="step-form"
      >
        <div className="strategy-slider">
          <div className="slider-labels">
            <span className="slider-label">🎲 More Luck</span>
            <span className="slider-label">🧠 More Strategy</span>
          </div>

          <div className="slider-container">
            <input
              type="range"
              name="strategy"
              min="1"
              max="5"
              value={strategyValue}
              className="strategy-range"
              id="strategy-slider"
            />
            <div className="slider-markers">
              <span className="marker">1</span>
              <span className="marker">2</span>
              <span className="marker">3</span>
              <span className="marker">4</span>
              <span className="marker">5</span>
            </div>
          </div>

          <div className="strategy-descriptions">
            <div className="strategy-desc" data-value="1">
              <strong>Pure Luck</strong> - Dice rolls and card draws decide
              everything
            </div>
            <div className="strategy-desc" data-value="2">
              <strong>Mostly Luck</strong> - Some choices, but chance is king
            </div>
            <div className="strategy-desc active" data-value="3">
              <strong>Balanced</strong> - Good mix of skill and chance
            </div>
            <div className="strategy-desc" data-value="4">
              <strong>Mostly Strategy</strong> - Planning matters, with some
              luck
            </div>
            <div className="strategy-desc" data-value="5">
              <strong>Pure Strategy</strong> - Every decision counts, minimal
              luck
            </div>
          </div>
        </div>

        <div className="step-actions">
          <button
            type="button"
            className="back-button"
            hx-get={`/recommend/step/3?players=${players}&learningTime=${learningTime}`}
            hx-target="body"
            hx-swap="innerHTML"
            hx-push-url="true"
          >
            ← Previous
          </button>
          <button type="submit" className="next-button">
            Final Step →
          </button>
        </div>
      </form>

      <script>
        {`
          document.addEventListener('DOMContentLoaded', function() {
            const slider = document.getElementById('strategy-slider');
            const descriptions = document.querySelectorAll('.strategy-desc');
            
            function updateDescription() {
              descriptions.forEach(desc => desc.classList.remove('active'));
              const activeDesc = document.querySelector('[data-value="' + slider.value + '"]');
              if (activeDesc) activeDesc.classList.add('active');
            }
            
            slider.addEventListener('input', updateDescription);
            updateDescription();
          });
        `}
      </script>
    </div>
  );
};

export default RecommendationStep4;
