import { FC } from 'hono/jsx';

interface RecommendationStep1Props {
  currentPlayers?: string;
}

const RecommendationStep1: FC<RecommendationStep1Props> = ({
  currentPlayers,
}) => {
  return (
    <div className="recommendation-step">
      <div className="step-header">
        <div className="step-progress">
          <div className="progress-bar">
            <div className="progress-fill" style="width: 20%"></div>
          </div>
          <span className="step-counter">Step 1 of 5</span>
        </div>
        <h2>How many players?</h2>
        <p>Tell us how many people will be playing</p>
      </div>

      <form
        hx-get="/recommend/step/2"
        hx-target="body"
        hx-swap="innerHTML scroll:top"
        hx-push-url="true"
        className="step-form"
      >
        <div className="player-options">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <label key={num} className="player-option">
              <input
                type="radio"
                name="players"
                value={num.toString()}
                checked={currentPlayers === num.toString()}
                required
              />
              <div className="option-card">
                <div className="option-icon">
                  {num === 1
                    ? '👤'
                    : num === 2
                      ? '👥'
                      : '👥'.repeat(Math.min(num, 3))}
                </div>
                <span className="option-label">
                  {num === 1 ? 'Solo' : `${num} Players`}
                </span>
              </div>
            </label>
          ))}

          <label className="player-option">
            <input
              type="radio"
              name="players"
              value="7+"
              checked={currentPlayers === '7+'}
              required
            />
            <div className="option-card">
              <div className="option-icon">👥👥</div>
              <span className="option-label">7+ Players</span>
            </div>
          </label>
        </div>

        <div className="step-actions">
          <button
            type="button"
            className="back-button"
            hx-get="/"
            hx-target="body"
            hx-swap="innerHTML scroll:top"
            hx-push-url="true"
          >
            ← Back to Home
          </button>
          <button type="submit" className="next-button">
            Next Step →
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecommendationStep1;
