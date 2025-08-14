import { FC } from 'hono/jsx';

interface RecommendationStep2Props {
  players: string;
  currentLearningTime?: string;
}

const RecommendationStep2: FC<RecommendationStep2Props> = ({
  players,
  currentLearningTime,
}) => {
  return (
    <div className="recommendation-step">
      <div className="step-header">
        <div className="step-progress">
          <div className="progress-bar">
            <div className="progress-fill" style="width: 40%"></div>
          </div>
          <span className="step-counter">Step 2 of 5</span>
        </div>
        <h2>How much time to learn?</h2>
        <p>How complex should the game be to learn and teach?</p>
      </div>

      <form
        hx-get={`/recommend/step/3?players=${players}`}
        hx-target="body"
        hx-swap="innerHTML scroll:top"
        hx-push-url="true"
        hx-trigger="change"
        className="step-form"
      >
        <div className="learning-options">
          <label className="learning-option">
            <input
              type="radio"
              name="learningTime"
              value="quick"
              checked={currentLearningTime === 'quick'}
              required
            />
            <div className="option-card">
              <div className="option-icon">⚡</div>
              <div className="option-content">
                <h3>Quick to Learn</h3>
                <p>Simple rules, jump right in</p>
                <span className="option-detail">5-10 minutes to explain</span>
              </div>
            </div>
          </label>

          <label className="learning-option">
            <input
              type="radio"
              name="learningTime"
              value="moderate"
              checked={currentLearningTime === 'moderate'}
              required
            />
            <div className="option-card">
              <div className="option-icon">🎯</div>
              <div className="option-content">
                <h3>Moderate Complexity</h3>
                <p>Some strategy, worth the learning</p>
                <span className="option-detail">15-20 minutes to explain</span>
              </div>
            </div>
          </label>

          <label className="learning-option">
            <input
              type="radio"
              name="learningTime"
              value="complex"
              checked={currentLearningTime === 'complex'}
              required
            />
            <div className="option-card">
              <div className="option-icon">🧠</div>
              <div className="option-content">
                <h3>Deep & Strategic</h3>
                <p>Rich gameplay, lots to master</p>
                <span className="option-detail">30+ minutes to explain</span>
              </div>
            </div>
          </label>
        </div>

        <div className="step-actions">
          <button
            type="button"
            className="back-button"
            hx-get="/recommend/step/1"
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

export default RecommendationStep2;
