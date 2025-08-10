import { eq, count, sql } from 'drizzle-orm';
import type { Database } from '../database/connection';
import { gameCopies } from '../database/schema';
import {
  GoogleSheetsService,
  type GoogleSheetsConfig,
  type GameWithCopyCount,
} from './googleSheets';
import { BGGService, type BGGGameData } from './bgg';
import type { Cache } from './cache';

// Enhanced game data combining Sheets + BGG
export interface EnrichedGame {
  // From Google Sheets (always available)
  id: string;
  name: string;
  totalCopies: number;
  availableCopies: number;
  isActive: boolean;

  // From BGG API (may be null during loading/failure)
  bggId: number | null;
  bggData: BGGGameData | null;
  enriched: boolean; // Flag to show if we have full BGG data

  // Computed display fields with fallbacks
  displayImage: string;
  displayThumbnail: string;
  playerRange: string;
  durationRange: string;
  complexityLevel: number;
  description: string;
  yearPublished: number | null;
  publisher: string[];
  categories: string[];
  rating: number;
}

// Filtering options for enriched games
export interface EnrichedGameFilters {
  players?: number;
  minDuration?: number;
  maxDuration?: number;
  complexity?: number;
  search?: string;
  availableOnly?: boolean;
  categories?: string[];
}

export class GameDataService {
  private cache: Cache;
  private sheetsService: GoogleSheetsService;
  private bggService: BGGService;
  private readonly catalogCacheKey = 'enriched-games-catalog';
  private readonly catalogTTL = 30 * 60; // 30 minutes

  constructor(
    private db: Database,
    sheetsConfig: GoogleSheetsConfig,
    cache: Cache
  ) {
    this.cache = cache;
    this.sheetsService = new GoogleSheetsService(sheetsConfig, cache);
    this.bggService = new BGGService(cache);
  }

  /**
   * Get enriched games with stale-while-revalidate caching
   */
  async getEnrichedGames(): Promise<EnrichedGame[]> {
    const cacheResult = await this.cache.getWithMetadata<EnrichedGame[]>(
      this.catalogCacheKey
    );

    if (cacheResult.fresh && cacheResult.data) {
      // Fresh cache - return immediately
      return cacheResult.data;
    }

    if (cacheResult.stale && cacheResult.data) {
      // Stale cache - return stale data and refresh in background
      this.refreshCatalogInBackground();
      return cacheResult.data;
    }

    // No cache or very old - fetch fresh data synchronously
    return await this.buildEnrichedCatalog();
  }

  /**
   * Get a single enriched game by ID
   */
  async getEnrichedGameById(id: string): Promise<EnrichedGame | null> {
    const games = await this.getEnrichedGames();
    return games.find((game) => game.id === id) || null;
  }

  /**
   * Get filtered enriched games
   */
  async getFilteredGames(
    filters: EnrichedGameFilters
  ): Promise<EnrichedGame[]> {
    const allGames = await this.getEnrichedGames();
    return this.applyFilters(allGames, filters);
  }

  /**
   * Manually refresh the catalog cache
   */
  async refreshCatalog(): Promise<EnrichedGame[]> {
    await this.cache.delete(this.catalogCacheKey);
    return await this.buildEnrichedCatalog();
  }

  /**
   * Build enriched catalog by combining Sheets + BGG data
   */
  private async buildEnrichedCatalog(): Promise<EnrichedGame[]> {
    console.log('Building enriched games catalog...');

    try {
      // Get inventory from Google Sheets
      const inventory = await this.sheetsService.getGames();
      const activeGames = inventory.filter((game) => game.isActive);

      // Enrich each game with BGG data in parallel
      const enrichmentPromises = activeGames.map(async (game) => {
        try {
          return await this.enrichSingleGame(game);
        } catch (error) {
          console.warn(`Failed to enrich game ${game.name}:`, error);
          return this.createFallbackEnrichedGame(game);
        }
      });

      const enrichedGames = await Promise.all(enrichmentPromises);

      // Cache the results
      await this.cache.putWithMetadata(
        this.catalogCacheKey,
        enrichedGames,
        this.catalogTTL,
        `v1-${Date.now()}`
      );

      console.log(`Enriched catalog built with ${enrichedGames.length} games`);
      return enrichedGames;
    } catch (error) {
      console.error('Failed to build enriched catalog:', error);
      throw error;
    }
  }

  /**
   * Enrich a single game with BGG data and availability info
   */
  private async enrichSingleGame(
    game: GameWithCopyCount
  ): Promise<EnrichedGame> {
    // Get BGG data
    const bggId = await this.bggService.resolveBGGId(game.name);
    const bggData = bggId ? await this.bggService.getGameData(bggId) : null;

    // Get availability from database
    const availability = await this.getGameAvailability(game.id);

    return {
      // Basic info from Sheets
      id: game.id,
      name: game.name,
      totalCopies: availability.totalCopies,
      availableCopies: availability.availableCopies,
      isActive: game.isActive,

      // BGG enrichment
      bggId,
      bggData,
      enriched: !!bggData,

      // Computed display fields
      displayImage: bggData?.image || '/static/img/game-placeholder.png',
      displayThumbnail:
        bggData?.thumbnail || '/static/img/game-placeholder-thumb.png',
      playerRange: this.formatPlayerRange(
        bggData?.minPlayers || game.minPlayers,
        bggData?.maxPlayers || game.maxPlayers
      ),
      durationRange: this.formatDurationRange(
        bggData?.minPlayTime || game.minDuration,
        bggData?.maxPlayTime || game.maxDuration
      ),
      complexityLevel: bggData?.complexity || game.complexityLevel || 0,
      description: bggData?.description || game.description || '',
      yearPublished: bggData?.yearPublished || game.year || null,
      publisher: bggData?.publisher || (game.publisher ? [game.publisher] : []),
      categories: bggData?.categories || [],
      rating: bggData?.rating || 0,
    };
  }

  /**
   * Create fallback enriched game when BGG lookup fails
   */
  private createFallbackEnrichedGame(game: GameWithCopyCount): EnrichedGame {
    return {
      id: game.id,
      name: game.name,
      totalCopies: game.totalCopies || 0,
      availableCopies: 0, // Will be updated by availability lookup
      isActive: game.isActive,

      bggId: null,
      bggData: null,
      enriched: false,

      displayImage: '/static/img/game-placeholder.png',
      displayThumbnail: '/static/img/game-placeholder-thumb.png',
      playerRange: this.formatPlayerRange(game.minPlayers, game.maxPlayers),
      durationRange: this.formatDurationRange(
        game.minDuration,
        game.maxDuration
      ),
      complexityLevel: game.complexityLevel || 0,
      description: game.description || '',
      yearPublished: game.year || null,
      publisher: game.publisher ? [game.publisher] : [],
      categories: [],
      rating: 0,
    };
  }

  /**
   * Get game availability from database
   */
  private async getGameAvailability(
    gameId: string
  ): Promise<{ totalCopies: number; availableCopies: number }> {
    try {
      const result = await this.db
        .select({
          totalCopies: count(gameCopies.id),
          availableCopies: sql<number>`COUNT(CASE WHEN ${gameCopies.status} = 'available' THEN 1 END)`,
        })
        .from(gameCopies)
        .where(eq(gameCopies.gameId, gameId));

      return result[0] || { totalCopies: 0, availableCopies: 0 };
    } catch (error) {
      console.warn(`Failed to get availability for game ${gameId}:`, error);
      return { totalCopies: 0, availableCopies: 0 };
    }
  }

  /**
   * Apply filters to enriched games
   */
  private applyFilters(
    games: EnrichedGame[],
    filters: EnrichedGameFilters
  ): EnrichedGame[] {
    let filtered = games;

    // Player count filter
    if (filters.players) {
      filtered = filtered.filter((game) => {
        const minPlayers = game.bggData?.minPlayers || 1;
        const maxPlayers = game.bggData?.maxPlayers || 1;
        return minPlayers <= filters.players! && maxPlayers >= filters.players!;
      });
    }

    // Duration filters
    if (filters.minDuration) {
      filtered = filtered.filter((game) => {
        const maxDuration = game.bggData?.maxPlayTime || 0;
        return maxDuration >= filters.minDuration!;
      });
    }

    if (filters.maxDuration) {
      filtered = filtered.filter((game) => {
        const minDuration = game.bggData?.minPlayTime || 0;
        return minDuration <= filters.maxDuration!;
      });
    }

    // Complexity filter
    if (filters.complexity) {
      filtered = filtered.filter((game) => {
        const complexity = Math.round(game.complexityLevel);
        return complexity === filters.complexity;
      });
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (game) =>
          game.name.toLowerCase().includes(searchTerm) ||
          game.description.toLowerCase().includes(searchTerm) ||
          game.categories.some((cat) => cat.toLowerCase().includes(searchTerm))
      );
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter((game) =>
        filters.categories!.some((filterCat) =>
          game.categories.some((gameCat) =>
            gameCat.toLowerCase().includes(filterCat.toLowerCase())
          )
        )
      );
    }

    // Available only filter
    if (filters.availableOnly) {
      filtered = filtered.filter((game) => game.availableCopies > 0);
    }

    // Sort by availability then rating
    return filtered.sort((a, b) => {
      if (a.availableCopies !== b.availableCopies) {
        return b.availableCopies - a.availableCopies;
      }
      if (a.rating !== b.rating) {
        return b.rating - a.rating;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Refresh catalog in background (fire and forget)
   */
  private refreshCatalogInBackground(): void {
    // Use setTimeout to avoid blocking the current request
    setTimeout(async () => {
      try {
        await this.buildEnrichedCatalog();
        console.log('Background catalog refresh completed');
      } catch (error) {
        console.error('Background catalog refresh failed:', error);
      }
    }, 0);
  }

  /**
   * Format player range for display
   */
  private formatPlayerRange(min: number, max: number): string {
    if (!min && !max) return 'Unknown';
    if (min === max) return `${min} player${min === 1 ? '' : 's'}`;
    return `${min}-${max} players`;
  }

  /**
   * Format duration range for display
   */
  private formatDurationRange(min: number, max: number): string {
    if (!min && !max) return 'Unknown';
    if (min === max) return `${min} min`;
    if (!min) return `~${max} min`;
    if (!max) return `${min}+ min`;
    return `${min}-${max} min`;
  }
}
