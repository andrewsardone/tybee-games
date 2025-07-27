import { eq, count, and, inArray } from 'drizzle-orm';
import type { Database } from '../database/connection';
import { gameCopies } from '../database/schema';
import { GoogleSheetsService, type GoogleSheetsConfig } from './googleSheets';

export interface SyncResult {
  gameId: string;
  gameName: string;
  previousCount: number;
  newCount: number;
  action: 'added' | 'removed' | 'unchanged';
  copiesChanged: number;
}

export async function syncGameCopies(
  db: Database,
  sheetsConfig: GoogleSheetsConfig
): Promise<SyncResult[]> {
  const sheetsService = new GoogleSheetsService(sheetsConfig);
  const games = await sheetsService.getGames();
  const results: SyncResult[] = [];

  for (const game of games) {
    const targetCopies = game.totalCopies || 0;

    // Get current copy count from database
    const currentCopiesResult = await db
      .select({ count: count() })
      .from(gameCopies)
      .where(eq(gameCopies.gameId, game.id));

    const currentCount = currentCopiesResult[0]?.count || 0;
    const difference = targetCopies - currentCount;

    if (difference > 0) {
      // Add copies
      await addCopies(db, game.id, difference);
      results.push({
        gameId: game.id,
        gameName: game.name,
        previousCount: currentCount,
        newCount: targetCopies,
        action: 'added',
        copiesChanged: difference,
      });
    } else if (difference < 0) {
      // Remove copies (only available ones)
      const removed = await removeAvailableCopies(
        db,
        game.id,
        Math.abs(difference)
      );
      results.push({
        gameId: game.id,
        gameName: game.name,
        previousCount: currentCount,
        newCount: currentCount - removed,
        action: 'removed',
        copiesChanged: removed,
      });
    } else {
      results.push({
        gameId: game.id,
        gameName: game.name,
        previousCount: currentCount,
        newCount: targetCopies,
        action: 'unchanged',
        copiesChanged: 0,
      });
    }
  }

  return results;
}

async function addCopies(
  db: Database,
  gameId: string,
  count: number
): Promise<void> {
  // Get the highest copy number for this game
  const existingCopies = await db
    .select({ copyNumber: gameCopies.copyNumber })
    .from(gameCopies)
    .where(eq(gameCopies.gameId, gameId))
    .orderBy(gameCopies.copyNumber);

  const maxCopyNumber =
    existingCopies.length > 0
      ? Math.max(...existingCopies.map((c) => c.copyNumber))
      : 0;

  // Create new copies
  const newCopies = Array.from({ length: count }, (_, i) => ({
    id: globalThis.crypto.randomUUID(), // Use Web API instead of nanoid
    gameId,
    copyNumber: maxCopyNumber + i + 1,
    status: 'available' as const,
    condition: 'excellent' as const,
    location: null,
    currentCheckoutId: null,
    lastCheckedOut: null,
    totalCheckouts: 0,
    dateAdded: new Date().toISOString(),
    dateUpdated: new Date().toISOString(),
    notes: null,
  }));

  await db.insert(gameCopies).values(newCopies);
}

async function removeAvailableCopies(
  db: Database,
  gameId: string,
  maxToRemove: number
): Promise<number> {
  // Get available copies to remove
  const availableCopies = await db
    .select({ id: gameCopies.id })
    .from(gameCopies)
    .where(
      and(eq(gameCopies.gameId, gameId), eq(gameCopies.status, 'available'))
    )
    .limit(maxToRemove);

  if (availableCopies.length === 0) {
    return 0;
  }

  // Remove the copies
  const idsToRemove = availableCopies.map((copy) => copy.id);
  await db.delete(gameCopies).where(inArray(gameCopies.id, idsToRemove));

  return availableCopies.length;
}

export async function getOutOfSyncGames(
  db: Database,
  sheetsConfig: GoogleSheetsConfig
): Promise<
  Array<{
    gameId: string;
    gameName: string;
    sheetsCount: number;
    dbCount: number;
    difference: number;
  }>
> {
  const sheetsService = new GoogleSheetsService(sheetsConfig);
  const games = await sheetsService.getGames();
  const outOfSync = [];

  for (const game of games) {
    const targetCopies = game.totalCopies || 0;

    const currentCopiesResult = await db
      .select({ count: count() })
      .from(gameCopies)
      .where(eq(gameCopies.gameId, game.id));

    const currentCount = currentCopiesResult[0]?.count || 0;
    const difference = targetCopies - currentCount;

    if (difference !== 0) {
      outOfSync.push({
        gameId: game.id,
        gameName: game.name,
        sheetsCount: targetCopies,
        dbCount: currentCount,
        difference,
      });
    }
  }

  return outOfSync;
}
