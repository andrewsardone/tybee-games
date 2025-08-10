import { FC } from 'hono/jsx';

interface RecommendationStep3Props {
  players: string;
  learningTime: string;
  currentDuration?: string;
}

const RecommendationStep3: FC<RecommendationStep3Props> = ({
  players,
  learningTime,
  currentDuration,
}) => {
  return (
    <div className="recommendation-step">
      <div className="step-header">
        <div className="step-progress">
          <div className="progress-bar">
            <div className="progress-fill" style="width: 60%"></div>
          </div>
          <span className="step-counter">Step 3 of 5</span>
        </div>
        <h2>How long to play?</h2>
        <p>What's your ideal game session length?</p>
      </div>

      <form
        hx-get={`/recommend/step/4?players=${players}&learningTime=${learningTime}`}
        hx-target="body"
        hx-swap="innerHTML scroll:top"
        hx-push-url="true"
        className="step-form"
      >
        <div className="duration-options">
          <label className="duration-option">
            <input
              type="radio"
              name="duration"
              value="short"
              checked={currentDuration === 'short'}
              required
            />
            <div className="option-card">
              <div className="option-icon">⏱️</div>
              <div className="option-content">
                <h3>Quick Game</h3>
                <p>Perfect for a coffee break</p>
                <span className="option-detail">15-45 minutes</span>
              </div>
            </div>
          </label>

          <label className="duration-option">
            <input
              type="radio"
              name="duration"
              value="medium"
              checked={currentDuration === 'medium'}
              required
            />
            <div className="option-card">
              <div className="option-icon">🕐</div>
              <div className="option-content">
                <h3>Standard Session</h3>
                <p>Classic board game length</p>
                <span className="option-detail">45-90 minutes</span>
              </div>
            </div>
          </label>

          <label className="duration-option">
            <input
              type="radio"
              name="duration"
              value="long"
              checked={currentDuration === 'long'}
              required
            />
            <div className="option-card">
              <div className="option-icon">⏰</div>
              <div className="option-content">
                <h3>Epic Adventure</h3>
                <p>Settle in for the long haul</p>
                <span className="option-detail">90+ minutes</span>
              </div>
            </div>
          </label>

          <label className="duration-option">
            <input
              type="radio"
              name="duration"
              value="any"
              checked={currentDuration === 'any'}
              required
            />
            <div className="option-card">
              <div className="option-icon">🤷</div>
              <div className="option-content">
                <h3>No Preference</h3>
                <p>Time is flexible</p>
                <span className="option-detail">Any length works</span>
              </div>
            </div>
          </label>
        </div>

        <div className="step-actions">
          <button
            type="button"
            className="back-button"
            hx-get={`/recommend/step/2?players=${players}`}
            hx-target="body"
            hx-swap="innerHTML scroll:top"
            hx-push-url="true"
          >
            ← Previous
          </button>
          <button type="submit" className="next-button">
            Next Step →
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecommendationStep3;
