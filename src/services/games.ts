import { eq, count, sql } from 'drizzle-orm';
import type { Database } from '../database/connection';
import { gameCopies, type Game } from '../database/schema';
import { GoogleSheetsService, type GoogleSheetsConfig } from './googleSheets';

// Extend the base Game type with availability info
export interface GameWithAvailability extends Game {
  totalCopies: number;
  availableCopies: number;
}

// Duration filter values - single source of truth
export const DURATION_FILTERS = ['quick', 'medium', 'long'] as const;

// Duration filter type derived from the values
export type DurationFilter = (typeof DURATION_FILTERS)[number];

// Filtering options interface
export interface GameFilters {
  players?: number;
  duration?: DurationFilter;
  complexity?: number;
  search?: string;
  availableOnly?: boolean;
}

export async function getAllGamesWithAvailability(
  db: Database,
  sheetsConfig: GoogleSheetsConfig
): Promise<GameWithAvailability[]> {
  return getGamesWithFilters(db, {}, sheetsConfig);
}

export async function getGamesWithFilters(
  db: Database,
  filters: GameFilters,
  sheetsConfig: GoogleSheetsConfig
): Promise<GameWithAvailability[]> {
  // Get games from Google Sheets
  const sheetsService = new GoogleSheetsService(sheetsConfig);
  const allGames = await sheetsService.getGames();

  // Apply filters to games data
  let filteredGames = allGames.filter((game) => game.isActive);

  // Player count filter
  if (filters.players) {
    filteredGames = filteredGames.filter(
      (game) =>
        game.minPlayers <= filters.players! &&
        game.maxPlayers >= filters.players!
    );
  }

  // Duration filter
  if (filters.duration) {
    switch (filters.duration) {
      case 'quick':
        filteredGames = filteredGames.filter((game) => game.maxDuration <= 30);
        break;
      case 'medium':
        filteredGames = filteredGames.filter(
          (game) => game.minDuration >= 30 && game.maxDuration <= 60
        );
        break;
      case 'long':
        filteredGames = filteredGames.filter((game) => game.minDuration >= 60);
        break;
    }
  }

  // Complexity filter
  if (filters.complexity) {
    filteredGames = filteredGames.filter(
      (game) => game.complexityLevel === filters.complexity
    );
  }

  // Search filter (case-insensitive)
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredGames = filteredGames.filter(
      (game) =>
        game.name.toLowerCase().includes(searchTerm) ||
        (game.description &&
          game.description.toLowerCase().includes(searchTerm))
    );
  }

  // Get availability info from SQLite for each game
  const gamesWithAvailability: GameWithAvailability[] = [];

  for (const game of filteredGames) {
    const copiesResult = await db
      .select({
        totalCopies: count(gameCopies.id),
        availableCopies: sql<number>`COUNT(CASE WHEN ${gameCopies.status} = 'available' THEN 1 END)`,
      })
      .from(gameCopies)
      .where(eq(gameCopies.gameId, game.id));

    const availability = copiesResult[0] || {
      totalCopies: 0,
      availableCopies: 0,
    };

    gamesWithAvailability.push({
      ...game,
      totalCopies: availability.totalCopies,
      availableCopies: availability.availableCopies,
    });
  }

  // Filter for available only if requested
  if (filters.availableOnly) {
    return gamesWithAvailability.filter((game) => game.availableCopies > 0);
  }

  // Sort by availability then name
  return gamesWithAvailability.sort((a, b) => {
    if (a.availableCopies !== b.availableCopies) {
      return b.availableCopies - a.availableCopies;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function getGameById(
  db: Database,
  id: string,
  sheetsConfig: GoogleSheetsConfig
): Promise<GameWithAvailability | null> {
  // Get game from Google Sheets
  const sheetsService = new GoogleSheetsService(sheetsConfig);
  const allGames = await sheetsService.getGames();
  const game = allGames.find((g) => g.id === id);

  if (!game) {
    return null;
  }

  // Get availability info from SQLite
  const copiesResult = await db
    .select({
      totalCopies: count(gameCopies.id),
      availableCopies: sql<number>`COUNT(CASE WHEN ${gameCopies.status} = 'available' THEN 1 END)`,
    })
    .from(gameCopies)
    .where(eq(gameCopies.gameId, id));

  const availability = copiesResult[0] || {
    totalCopies: 0,
    availableCopies: 0,
  };

  return {
    ...game,
    totalCopies: availability.totalCopies,
    availableCopies: availability.availableCopies,
  };
}

// Business logic function to check availability
export function isGameAvailable(game: GameWithAvailability): boolean {
  return game.availableCopies > 0;
}

// Utility functions for formatting
export function formatPlayerCount(min: number, max: number): string {
  if (min === max) return `${min} player${min === 1 ? '' : 's'}`;
  return `${min}-${max} players`;
}

export function formatDuration(min: number, max: number): string {
  if (min === max) return `${min} min`;
  return `${min}-${max} min`;
}

export function parseThemes(themesJson: string | null): string[] {
  if (!themesJson) return [];
  try {
    return JSON.parse(themesJson);
  } catch {
    return [];
  }
}
