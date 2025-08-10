import { FC } from 'hono/jsx';
import type { GameRecommendation } from '../services/recommendations';
import EnrichedGameCard from './EnrichedGameCard';

interface RecommendationResultsProps {
  recommendations: GameRecommendation[];
  preferences: {
    players: string;
    learningTime: string;
    duration: string;
    strategy: string;
    themes: string[];
  };
}

const RecommendationResults: FC<RecommendationResultsProps> = ({
  recommendations,
  preferences,
}) => {
  const formatPreferences = () => {
    const parts = [];
    parts.push(
      `${preferences.players} player${preferences.players !== '1' ? 's' : ''}`
    );

    const learningMap = {
      quick: 'quick to learn',
      moderate: 'moderate complexity',
      complex: 'deep strategy',
    };
    parts.push(
      learningMap[preferences.learningTime as keyof typeof learningMap]
    );

    const durationMap = {
      short: 'short games',
      medium: 'medium games',
      long: 'long games',
      any: 'any length',
    };
    parts.push(durationMap[preferences.duration as keyof typeof durationMap]);

    return parts.join(', ');
  };

  return (
    <div className="recommendation-results">
      <div className="results-header">
        <button
          className="back-button"
          hx-get="/recommend/step/5"
          hx-target="body"
          hx-swap="innerHTML scroll:top"
          hx-push-url="true"
        >
          ← Adjust Preferences
        </button>

        <h1>Your Game Recommendations</h1>
        <p className="preferences-summary">
          Based on your preferences: {formatPreferences()}
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="no-recommendations">
          <div className="no-results-icon">😔</div>
          <h2>No Perfect Matches Found</h2>
          <p>
            We couldn't find games that match all your preferences in our
            current available collection.
          </p>
          <div className="no-results-actions">
            <button
              className="try-again-button"
              hx-get="/recommend/step/1"
              hx-target="body"
              hx-swap="innerHTML scroll:top"
              hx-push-url="true"
            >
              Try Different Preferences
            </button>
            <button
              className="browse-all-button"
              hx-get="/browse"
              hx-target="body"
              hx-swap="innerHTML scroll:top"
              hx-push-url="true"
            >
              Browse All Games
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="recommendations-grid">
            {recommendations.map((rec, index) => (
              <div key={rec.game.id} className="recommendation-item">
                <div className="recommendation-rank">
                  <span className="rank-number">#{index + 1}</span>
                  <span className="match-score">
                    {Math.round(rec.score)}% match
                  </span>
                </div>

                <EnrichedGameCard game={rec.game} />

                <div className="recommendation-reasons">
                  <h4>Why this game?</h4>
                  <ul className="reasons-list">
                    {rec.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>

                  <div className="match-indicators">
                    <div
                      className={`match-indicator ${rec.matchDetails.playersMatch ? 'match' : 'no-match'}`}
                    >
                      {rec.matchDetails.playersMatch ? '✓' : '✗'} Player Count
                    </div>
                    <div
                      className={`match-indicator ${rec.matchDetails.durationMatch ? 'match' : 'no-match'}`}
                    >
                      {rec.matchDetails.durationMatch ? '✓' : '✗'} Duration
                    </div>
                    <div
                      className={`match-indicator ${rec.matchDetails.complexityMatch ? 'match' : 'no-match'}`}
                    >
                      {rec.matchDetails.complexityMatch ? '✓' : '✗'} Complexity
                    </div>
                    <div
                      className={`match-indicator ${rec.matchDetails.themeMatch ? 'match' : 'no-match'}`}
                    >
                      {rec.matchDetails.themeMatch ? '✓' : '✗'} Theme
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="results-actions">
            <button
              className="new-recommendation-button"
              hx-get="/recommend/step/1"
              hx-target="body"
              hx-swap="innerHTML scroll:top"
              hx-push-url="true"
            >
              Get New Recommendations
            </button>
            <button
              className="browse-all-button secondary"
              hx-get="/browse"
              hx-target="body"
              hx-swap="innerHTML scroll:top"
              hx-push-url="true"
            >
              Browse All Games
            </button>
            <button
              className="home-button secondary"
              hx-get="/"
              hx-target="body"
              hx-swap="innerHTML scroll:top"
              hx-push-url="true"
            >
              Back to Home
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RecommendationResults;
