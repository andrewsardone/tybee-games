import { eq, count, sql, getTableColumns } from 'drizzle-orm';
import type { Database } from '../database/connection';
import { games, gameCopies, type Game } from '../database/schema';

// Extend the base Game type with availability info
export interface GameWithAvailability extends Game {
  totalCopies: number;
  availableCopies: number;
}

export async function getAllGamesWithAvailability(
  db: Database
): Promise<GameWithAvailability[]> {
  const result = await db
    .select({
      ...getTableColumns(games),
      totalCopies: count(gameCopies.id),
      availableCopies: sql<number>`COUNT(CASE WHEN ${gameCopies.status} = 'available' THEN 1 END)`,
    })
    .from(games)
    .leftJoin(gameCopies, eq(games.id, gameCopies.gameId))
    .where(eq(games.isActive, true))
    .groupBy(games.id);

  return result;
}

export async function getGameById(
  db: Database,
  id: string
): Promise<GameWithAvailability | null> {
  const result = await db
    .select({
      ...getTableColumns(games),
      totalCopies: count(gameCopies.id),
      availableCopies: sql<number>`COUNT(CASE WHEN ${gameCopies.status} = 'available' THEN 1 END)`,
    })
    .from(games)
    .leftJoin(gameCopies, eq(games.id, gameCopies.gameId))
    .where(eq(games.id, id))
    .groupBy(games.id);

  return result.length > 0 ? result[0] : null;
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
