import {
  eq,
  count,
  sql,
  getTableColumns,
  and,
  or,
  gte,
  lte,
  like,
} from 'drizzle-orm';
import type { Database } from '../database/connection';
import { games, gameCopies, type Game } from '../database/schema';

// Extend the base Game type with availability info
export interface GameWithAvailability extends Game {
  totalCopies: number;
  availableCopies: number;
}

// Filtering options interface
export interface GameFilters {
  players?: number;
  duration?: 'quick' | 'medium' | 'long';
  complexity?: number;
  search?: string;
  availableOnly?: boolean;
}

export async function getAllGamesWithAvailability(
  db: Database
): Promise<GameWithAvailability[]> {
  return getGamesWithFilters(db, {});
}

export async function getGamesWithFilters(
  db: Database,
  filters: GameFilters
): Promise<GameWithAvailability[]> {
  // Build where conditions dynamically
  const conditions = [eq(games.isActive, true)];

  // Player count filter
  if (filters.players) {
    conditions.push(
      and(
        lte(games.minPlayers, filters.players),
        gte(games.maxPlayers, filters.players)
      )!
    );
  }

  // Duration filter
  if (filters.duration) {
    switch (filters.duration) {
      case 'quick':
        conditions.push(lte(games.maxDuration, 30));
        break;
      case 'medium':
        conditions.push(
          and(gte(games.minDuration, 30), lte(games.maxDuration, 60))!
        );
        break;
      case 'long':
        conditions.push(gte(games.minDuration, 60));
        break;
    }
  }

  // Complexity filter
  if (filters.complexity) {
    conditions.push(eq(games.complexityLevel, filters.complexity));
  }

  // Search filter (case-insensitive using LOWER for SQLite)
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    conditions.push(
      or(
        like(sql`LOWER(${games.name})`, `%${searchTerm}%`),
        like(sql`LOWER(${games.description})`, `%${searchTerm}%`)
      )!
    );
  }

  const result = await db
    .select({
      ...getTableColumns(games),
      totalCopies: count(gameCopies.id),
      availableCopies: sql<number>`COUNT(CASE WHEN ${gameCopies.status} = 'available' THEN 1 END)`,
    })
    .from(games)
    .leftJoin(gameCopies, eq(games.id, gameCopies.gameId))
    .where(and(...conditions))
    .groupBy(games.id)
    .orderBy(
      sql`COUNT(CASE WHEN ${gameCopies.status} = 'available' THEN 1 END) DESC`,
      games.name
    );

  // Filter for available only if requested
  if (filters.availableOnly) {
    return result.filter((game) => game.availableCopies > 0);
  }

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
