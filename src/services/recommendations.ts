import type { EnrichedGame } from './gameData';

// Recommendation preferences collected through the wizard
export interface RecommendationPreferences {
  players: number;
  learningTime: 'quick' | 'moderate' | 'complex';
  playDuration: 'short' | 'medium' | 'long' | 'any';
  strategyPreference: number; // 1-5 scale: 1=luck, 5=strategy
  themes: string[];
}

// Recommendation result with explanation
export interface GameRecommendation {
  game: EnrichedGame;
  score: number;
  reasons: string[];
  matchDetails: {
    playersMatch: boolean;
    durationMatch: boolean;
    complexityMatch: boolean;
    themeMatch: boolean;
  };
}

export class RecommendationService {
  /**
   * Generate game recommendations based on user preferences
   */
  static generateRecommendations(
    games: EnrichedGame[],
    preferences: RecommendationPreferences
  ): GameRecommendation[] {
    const recommendations: GameRecommendation[] = [];

    // Filter to available games with BGG data
    const availableGames = games.filter(
      (game) => game.availableCopies > 0 && game.enriched && game.bggData
    );

    for (const game of availableGames) {
      const recommendation = this.scoreGame(game, preferences);
      if (recommendation.score > 0) {
        recommendations.push(recommendation);
      }
    }

    // Sort by score (highest first) and return top 3
    return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  /**
   * Score a single game against user preferences
   */
  private static scoreGame(
    game: EnrichedGame,
    preferences: RecommendationPreferences
  ): GameRecommendation {
    let score = 0;
    const reasons: string[] = [];
    const matchDetails = {
      playersMatch: false,
      durationMatch: false,
      complexityMatch: false,
      themeMatch: false,
    };

    const bgg = game.bggData!;

    // 1. Player count match (critical - 40 points)
    if (
      preferences.players >= bgg.minPlayers &&
      preferences.players <= bgg.maxPlayers
    ) {
      score += 40;
      matchDetails.playersMatch = true;
      if (
        preferences.players === bgg.minPlayers ||
        preferences.players === bgg.maxPlayers
      ) {
        reasons.push(`Perfect for ${preferences.players} players`);
      } else {
        reasons.push(`Great with ${preferences.players} players`);
      }
    } else {
      // No points if player count doesn't match
      return {
        game,
        score: 0,
        reasons: [],
        matchDetails,
      };
    }

    // 2. Play duration match (25 points)
    const avgPlayTime =
      (bgg.minPlayTime + bgg.maxPlayTime) / 2 || bgg.playingTime;
    let durationMatch = false;

    switch (preferences.playDuration) {
      case 'short':
        if (avgPlayTime <= 45) {
          score += 25;
          durationMatch = true;
          reasons.push('Quick to play');
        } else if (avgPlayTime <= 60) {
          score += 15;
          durationMatch = true;
        }
        break;
      case 'medium':
        if (avgPlayTime >= 30 && avgPlayTime <= 90) {
          score += 25;
          durationMatch = true;
          reasons.push('Perfect game length');
        } else if (avgPlayTime <= 120) {
          score += 15;
          durationMatch = true;
        }
        break;
      case 'long':
        if (avgPlayTime >= 90) {
          score += 25;
          durationMatch = true;
          reasons.push('Epic gaming session');
        } else if (avgPlayTime >= 60) {
          score += 15;
          durationMatch = true;
        }
        break;
      case 'any':
        score += 20;
        durationMatch = true;
        break;
    }
    matchDetails.durationMatch = durationMatch;

    // 3. Complexity/Learning time match (20 points)
    const complexity = bgg.complexity;
    let complexityMatch = false;

    switch (preferences.learningTime) {
      case 'quick':
        if (complexity <= 2.0) {
          score += 20;
          complexityMatch = true;
          reasons.push('Easy to learn');
        } else if (complexity <= 2.5) {
          score += 10;
          complexityMatch = true;
        }
        break;
      case 'moderate':
        if (complexity >= 1.5 && complexity <= 3.0) {
          score += 20;
          complexityMatch = true;
          reasons.push('Moderate complexity');
        } else if (complexity <= 3.5) {
          score += 10;
          complexityMatch = true;
        }
        break;
      case 'complex':
        if (complexity >= 2.5) {
          score += 20;
          complexityMatch = true;
          reasons.push('Rich strategic depth');
        } else if (complexity >= 2.0) {
          score += 10;
          complexityMatch = true;
        }
        break;
    }
    matchDetails.complexityMatch = complexityMatch;

    // 4. Strategy vs Luck preference (10 points)
    // Map complexity to strategy level (higher complexity = more strategy)
    const strategyLevel = Math.min(5, Math.max(1, Math.round(complexity)));
    const strategyDiff = Math.abs(
      strategyLevel - preferences.strategyPreference
    );

    if (strategyDiff === 0) {
      score += 10;
      reasons.push('Perfect strategy level');
    } else if (strategyDiff === 1) {
      score += 7;
    } else if (strategyDiff === 2) {
      score += 4;
    }

    // 5. Theme/Category match (15 points)
    let themeMatch = false;
    if (preferences.themes.length > 0) {
      const gameCategories = bgg.categories.map((c) => c.toLowerCase());
      const matchingThemes = preferences.themes.filter((theme) =>
        gameCategories.some(
          (cat) =>
            cat.includes(theme.toLowerCase()) ||
            theme.toLowerCase().includes(cat)
        )
      );

      if (matchingThemes.length > 0) {
        score += 15;
        themeMatch = true;
        reasons.push(`Matches your ${matchingThemes[0]} preference`);
      }
    } else {
      // No theme preference, give small bonus
      score += 5;
      themeMatch = true;
    }
    matchDetails.themeMatch = themeMatch;

    // 6. BGG Rating bonus (5 points max)
    if (bgg.rating >= 7.5) {
      score += 5;
      reasons.push('Highly rated on BGG');
    } else if (bgg.rating >= 7.0) {
      score += 3;
    } else if (bgg.rating >= 6.5) {
      score += 1;
    }

    // 7. Popularity bonus (5 points max)
    if (bgg.rank > 0 && bgg.rank <= 100) {
      score += 5;
      reasons.push('Top 100 game on BGG');
    } else if (bgg.rank > 0 && bgg.rank <= 500) {
      score += 3;
    } else if (bgg.rank > 0 && bgg.rank <= 1000) {
      score += 1;
    }

    return {
      game,
      score,
      reasons,
      matchDetails,
    };
  }

  /**
   * Get theme options for the wizard
   */
  static getThemeOptions(): { value: string; label: string }[] {
    return [
      { value: 'strategy', label: 'Strategy & Tactics' },
      { value: 'adventure', label: 'Adventure & Exploration' },
      { value: 'fantasy', label: 'Fantasy & Magic' },
      { value: 'sci-fi', label: 'Science Fiction' },
      { value: 'economic', label: 'Economic & Trading' },
      { value: 'war', label: 'War & Military' },
      { value: 'city', label: 'City Building' },
      { value: 'card', label: 'Card Games' },
      { value: 'party', label: 'Party & Social' },
      { value: 'cooperative', label: 'Cooperative' },
      { value: 'abstract', label: 'Abstract Strategy' },
      { value: 'thematic', label: 'Story & Theme' },
    ];
  }
}
