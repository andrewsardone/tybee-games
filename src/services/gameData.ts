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
  mechanics?: string[];
  minRating?: number;
  yearRange?: string;
  category?: string;
  mechanic?: string;
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
   * Get enriched games from cache only (no revalidation)
   * Used for user-facing routes to ensure instant loading
   */
  async getCachedGames(): Promise<EnrichedGame[]> {
    const cacheResult = await this.cache.getWithMetadata<EnrichedGame[]>(
      this.catalogCacheKey
    );

    if (cacheResult.data) {
      // Return cached data regardless of freshness
      return cacheResult.data;
    }

    // If no cache exists, return empty array rather than blocking
    console.warn('No cached games found - returning empty array');
    return [];
  }

  /**
   * Get enriched games with stale-while-revalidate caching
   * Modified to support cache-only mode for user requests
   */
  async getEnrichedGames(
    forceRefresh: boolean = false
  ): Promise<EnrichedGame[]> {
    if (forceRefresh) {
      // Admin/manual refresh - use original stale-while-revalidate logic
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

    // Default behavior: cache-only (no revalidation)
    return await this.getCachedGames();
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
   * Manually refresh the catalog cache (stale-while-revalidate)
   */
  async refreshCatalog(): Promise<EnrichedGame[]> {
    // Get current cached data to return immediately if available
    const cacheResult = await this.cache.getWithMetadata<EnrichedGame[]>(
      this.catalogCacheKey
    );

    // Start background refresh
    this.refreshCatalogInBackground();

    // Return cached data if available, otherwise build fresh
    if (cacheResult.data) {
      console.log('Returning cached data while refreshing in background');
      return cacheResult.data;
    } else {
      console.log('No cached data available, building fresh catalog');
      return await this.buildEnrichedCatalog();
    }
  }

  /**
   * Progressive enrichment - enrich games that are missing BGG data
   */
  async enrichMissingGames(
    maxGames: number = 10
  ): Promise<{ enriched: number; total: number }> {
    console.log(
      `Starting progressive enrichment for up to ${maxGames} games...`
    );

    const allGames = await this.getEnrichedGames();
    const missingGames = allGames.filter((game) => !game.enriched);

    if (missingGames.length === 0) {
      console.log('No games need enrichment');
      return { enriched: 0, total: 0 };
    }

    console.log(`Found ${missingGames.length} games needing enrichment`);

    // Take only the requested number of games
    const gamesToEnrich = missingGames.slice(0, maxGames);
    let enrichedCount = 0;

    for (const game of gamesToEnrich) {
      try {
        console.log(`Attempting to enrich: ${game.name}`);

        // Try to get BGG data
        const bggId = await this.bggService.resolveBGGId(game.name);
        if (bggId) {
          const bggData = await this.bggService.getGameData(bggId);
          if (bggData) {
            // Update the game in our catalog
            game.bggId = bggId;
            game.bggData = bggData;
            game.enriched = true;

            // Update computed fields
            game.displayImage =
              bggData.image || '/static/img/game-placeholder.png';
            game.displayThumbnail =
              bggData.thumbnail || '/static/img/game-placeholder-thumb.png';
            game.playerRange = this.formatPlayerRange(
              bggData.minPlayers,
              bggData.maxPlayers
            );
            game.durationRange = this.formatDurationRange(
              bggData.minPlayTime,
              bggData.maxPlayTime
            );
            game.complexityLevel = bggData.complexity || 0;
            game.description = bggData.description || '';
            game.yearPublished = bggData.yearPublished || null;
            game.publisher = bggData.publisher || [];
            game.categories = bggData.categories || [];
            game.rating = bggData.rating || 0;

            enrichedCount++;
            console.log(`Successfully enriched: ${game.name}`);
          }
        }

        // Add delay between enrichments
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn(`Failed to enrich ${game.name}:`, error);
      }
    }

    if (enrichedCount > 0) {
      // Update the cache with newly enriched games
      await this.cache.putWithMetadata(
        this.catalogCacheKey,
        allGames,
        this.catalogTTL,
        `v1-${Date.now()}`
      );
      console.log(
        `Progressive enrichment complete: ${enrichedCount}/${gamesToEnrich.length} games enriched`
      );
    }

    return { enriched: enrichedCount, total: gamesToEnrich.length };
  }

  /**
   * Force clear cache and rebuild (only use when absolutely necessary)
   */
  async forceClearAndRebuild(): Promise<EnrichedGame[]> {
    console.log('Force clearing cache and rebuilding catalog...');

    // Clear all relevant caches
    await this.cache.delete(this.catalogCacheKey);
    await this.sheetsService.invalidateCache();

    // Rebuild catalog
    return await this.buildEnrichedCatalog();
  }

  /**
   * Clear all caches and rebuild from Google Sheets (stale-while-revalidate)
   */
  async fullResync(): Promise<EnrichedGame[]> {
    console.log('Starting full resync from Google Sheets...');

    // Get current cached data to return immediately if available
    const cacheResult = await this.cache.getWithMetadata<EnrichedGame[]>(
      this.catalogCacheKey
    );

    // Invalidate sheets cache and start background refresh
    await this.sheetsService.invalidateCache();
    this.refreshCatalogInBackground();

    // Return cached data if available, otherwise build fresh
    if (cacheResult.data) {
      console.log(
        'Returning cached data while performing full resync in background'
      );
      return cacheResult.data;
    } else {
      console.log(
        'No cached data available, performing full resync synchronously'
      );
      return await this.buildEnrichedCatalog();
    }
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

      // Enrich games in smaller batches to avoid overwhelming BGG API
      const enrichedGames = await this.enrichGamesInBatches(activeGames, 5); // 5 games at a time

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
   * Enrich games in batches to avoid overwhelming BGG API
   */
  private async enrichGamesInBatches(
    games: GameWithCopyCount[],
    batchSize: number = 5
  ): Promise<EnrichedGame[]> {
    const enrichedGames: EnrichedGame[] = [];

    console.log(
      `Enriching ${games.length} games in batches of ${batchSize}...`
    );

    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(games.length / batchSize)} (${batch.length} games)`
      );

      // Process batch with individual error handling
      const batchPromises = batch.map(async (game) => {
        try {
          return await this.enrichSingleGame(game);
        } catch (error) {
          console.warn(`Failed to enrich game ${game.name}:`, error);
          return this.createFallbackEnrichedGame(game);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      enrichedGames.push(...batchResults);

      // Add delay between batches to be respectful to BGG API
      if (i + batchSize < games.length) {
        console.log('Waiting 3 seconds before next batch...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    const enrichedCount = enrichedGames.filter((g) => g.enriched).length;
    console.log(
      `Batch enrichment complete: ${enrichedCount}/${games.length} games successfully enriched`
    );

    return enrichedGames;
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

    // Search filter (enhanced)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (game) =>
          game.name.toLowerCase().includes(searchTerm) ||
          game.description.toLowerCase().includes(searchTerm) ||
          game.categories.some((cat) =>
            cat.toLowerCase().includes(searchTerm)
          ) ||
          game.publisher.some((pub) =>
            pub.toLowerCase().includes(searchTerm)
          ) ||
          (game.bggData?.mechanics || []).some((mech) =>
            mech.toLowerCase().includes(searchTerm)
          )
      );
    }

    // Category filter (single category)
    if (filters.category) {
      const categoryTerm = filters.category.toLowerCase();
      filtered = filtered.filter((game) =>
        game.categories.some((cat) => cat.toLowerCase().includes(categoryTerm))
      );
    }

    // Categories filter (multiple categories)
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter((game) =>
        filters.categories!.some((filterCat) =>
          game.categories.some((gameCat) =>
            gameCat.toLowerCase().includes(filterCat.toLowerCase())
          )
        )
      );
    }

    // Mechanic filter
    if (filters.mechanic) {
      const mechanicTerm = filters.mechanic.toLowerCase();
      filtered = filtered.filter((game) =>
        (game.bggData?.mechanics || []).some((mech) =>
          mech.toLowerCase().includes(mechanicTerm)
        )
      );
    }

    // Mechanics filter (multiple mechanics)
    if (filters.mechanics && filters.mechanics.length > 0) {
      filtered = filtered.filter((game) =>
        filters.mechanics!.some((filterMech) =>
          (game.bggData?.mechanics || []).some((gameMech) =>
            gameMech.toLowerCase().includes(filterMech.toLowerCase())
          )
        )
      );
    }

    // Rating filter
    if (filters.minRating) {
      filtered = filtered.filter((game) => game.rating >= filters.minRating!);
    }

    // Year range filter
    if (filters.yearRange) {
      filtered = filtered.filter((game) => {
        const year = game.yearPublished;
        if (!year) return false;

        switch (filters.yearRange) {
          case '2020s':
            return year >= 2020;
          case '2010s':
            return year >= 2010 && year < 2020;
          case '2000s':
            return year >= 2000 && year < 2010;
          case 'classic':
            return year < 2000;
          default:
            return true;
        }
      });
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
