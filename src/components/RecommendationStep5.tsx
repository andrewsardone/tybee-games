import { FC } from 'hono/jsx';
import { RecommendationService } from '../services/recommendations';

interface RecommendationStep5Props {
  players: string;
  learningTime: string;
  duration: string;
  strategy: string;
  currentThemes?: string[];
}

const RecommendationStep5: FC<RecommendationStep5Props> = ({
  players,
  learningTime,
  duration,
  strategy,
  currentThemes = [],
}) => {
  const themeOptions = RecommendationService.getThemeOptions();

  return (
    <div className="recommendation-step">
      <div className="step-header">
        <div className="step-progress">
          <div className="progress-bar">
            <div className="progress-fill" style="width: 100%"></div>
          </div>
          <span className="step-counter">Step 5 of 5</span>
        </div>
        <h2>What themes interest you?</h2>
        <p>Select any themes you enjoy (optional)</p>
      </div>

      <form
        hx-get={`/recommend/results?players=${players}&learningTime=${learningTime}&duration=${duration}&strategy=${strategy}`}
        hx-target="body"
        hx-swap="innerHTML scroll:top"
        hx-push-url="true"
        className="step-form"
      >
        <div className="theme-options">
          {themeOptions.map((theme) => (
            <label key={theme.value} className="theme-option">
              <input
                type="checkbox"
                name="themes"
                value={theme.value}
                checked={currentThemes.includes(theme.value)}
              />
              <div className="option-card">
                <span className="option-label">{theme.label}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="theme-note">
          <p>
            💡 <strong>Tip:</strong> Leave all unchecked if you're open to any
            theme
          </p>
        </div>

        <div className="step-actions">
          <button
            type="button"
            className="back-button"
            hx-get={`/recommend/step/4?players=${players}&learningTime=${learningTime}&duration=${duration}`}
            hx-target="body"
            hx-swap="innerHTML scroll:top"
            hx-push-url="true"
          >
            ← Previous
          </button>
          <button type="submit" className="next-button primary">
            Get My Recommendations! 🎯
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecommendationStep5;
