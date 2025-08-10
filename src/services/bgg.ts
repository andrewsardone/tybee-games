import type { Cache } from './cache';

// BGG API response types
export interface BGGSearchResult {
  id: number;
  name: string;
  yearPublished?: number;
  type: string;
}

export interface BGGGameData {
  id: number;
  name: string;
  image: string;
  thumbnail: string;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
  minPlayTime: number;
  maxPlayTime: number;
  complexity: number;
  yearPublished: number;
  description: string;
  publisher: string[];
  categories: string[];
  mechanics: string[];
  rating: number;
  rank: number;
}

// Note: BGG API responses are XML, so we parse them directly rather than using these interfaces
// These are kept for reference of the expected structure

export class BGGService {
  private cache: Cache;
  private readonly baseUrl = 'https://boardgamegeek.com/xmlapi2';
  private readonly searchCacheTTL = 7 * 24 * 60 * 60; // 7 days
  private readonly gameCacheTTL = 24 * 60 * 60; // 24 hours

  // Rate limiting configuration
  private readonly rateLimitDelay = 2000; // 2 seconds between requests
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds between retries
  private lastRequestTime = 0;

  constructor(cache: Cache) {
    this.cache = cache;
  }

  /**
   * Rate-limited fetch with retry logic
   */
  private async rateLimitedFetch(
    url: string,
    retryCount = 0
  ): Promise<globalThis.Response> {
    // Ensure we don't exceed rate limits
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`BGG rate limiting: waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TybeeGames/1.0 (Board Game Rental System)',
        },
      });

      if (response.status === 429) {
        // Rate limited - wait longer and retry
        if (retryCount < this.maxRetries) {
          const backoffDelay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
          console.log(
            `BGG rate limited (429), retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          return this.rateLimitedFetch(url, retryCount + 1);
        } else {
          throw new Error(
            `BGG API rate limited after ${this.maxRetries} retries`
          );
        }
      }

      if (response.status === 202) {
        // BGG returns 202 when data is being processed - wait and retry
        if (retryCount < this.maxRetries) {
          console.log(
            `BGG processing data (202), retrying in ${this.retryDelay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
          return this.rateLimitedFetch(url, retryCount + 1);
        } else {
          throw new Error(
            `BGG API still processing after ${this.maxRetries} retries`
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          `BGG API error: ${response.status} ${response.statusText}`
        );
      }

      return response;
    } catch (error) {
      if (
        retryCount < this.maxRetries &&
        (error as Error).message.includes('fetch')
      ) {
        // Network error - retry with backoff
        const backoffDelay = this.retryDelay * Math.pow(2, retryCount);
        console.log(
          `BGG network error, retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        return this.rateLimitedFetch(url, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Search for games by name on BGG
   */
  async searchGame(name: string): Promise<BGGSearchResult[]> {
    const cacheKey = `bgg:search:${name.toLowerCase().trim()}`;

    // Check cache first
    const cached = await this.cache.get<BGGSearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const encodedName = encodeURIComponent(name);
      const url = `${this.baseUrl}/search?query=${encodedName}&type=boardgame`;

      const response = await this.rateLimitedFetch(url);
      const xmlText = await response.text();
      const results = this.parseSearchXML(xmlText);

      // Cache the results
      await this.cache.put(cacheKey, results, {
        expirationTtl: this.searchCacheTTL,
      });

      return results;
    } catch (error) {
      console.error('BGG search error:', error);
      return [];
    }
  }

  /**
   * Get detailed game data from BGG by ID
   */
  async getGameData(bggId: number): Promise<BGGGameData | null> {
    const cacheKey = `bgg:game:${bggId}`;

    // Check cache first
    const cached = await this.cache.get<BGGGameData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/thing?id=${bggId}&stats=1`;

      const response = await this.rateLimitedFetch(url);
      const xmlText = await response.text();
      const gameData = this.parseGameXML(xmlText);

      if (gameData) {
        // Cache the result
        await this.cache.put(cacheKey, gameData, {
          expirationTtl: this.gameCacheTTL,
        });
      }

      return gameData;
    } catch (error) {
      console.error(`BGG game data error for ID ${bggId}:`, error);
      return null;
    }
  }

  /**
   * Resolve BGG ID by game name with fuzzy matching
   */
  async resolveBGGId(gameName: string): Promise<number | null> {
    const searchResults = await this.searchGame(gameName);

    if (searchResults.length === 0) {
      return null;
    }

    // Find best match
    const bestMatch = this.findBestMatch(searchResults, gameName);
    return bestMatch?.id || null;
  }

  /**
   * Find the best matching game from search results
   */
  private findBestMatch(
    results: BGGSearchResult[],
    originalName: string
  ): BGGSearchResult | null {
    if (results.length === 0) return null;

    const normalizedOriginal = this.normalizeGameName(originalName);

    // Exact match first
    const exactMatch = results.find(
      (r) => this.normalizeGameName(r.name) === normalizedOriginal
    );
    if (exactMatch) return exactMatch;

    // Score all results by similarity
    const scored = results.map((result) => ({
      ...result,
      similarity: this.calculateSimilarity(result.name, originalName),
    }));

    // Sort by similarity (descending) and prefer board games
    scored.sort((a, b) => {
      // Prefer boardgames over expansions
      if (a.type === 'boardgame' && b.type !== 'boardgame') return -1;
      if (b.type === 'boardgame' && a.type !== 'boardgame') return 1;

      // Then by similarity
      return b.similarity - a.similarity;
    });

    // Return best match if similarity is good enough
    const best = scored[0];
    return best.similarity > 0.6 ? best : null;
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeGameName(str1);
    const s2 = this.normalizeGameName(str2);

    if (s1 === s2) return 1;

    // Simple Levenshtein distance-based similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Normalize game name for comparison
   */
  private normalizeGameName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Parse BGG search XML response
   */
  private parseSearchXML(xmlText: string): BGGSearchResult[] {
    try {
      // Simple XML parsing for search results
      const itemMatches = xmlText.match(/<item[^>]*>/g);
      if (!itemMatches) return [];

      return itemMatches
        .map((itemTag) => {
          const idMatch = itemTag.match(/id="(\d+)"/);
          const typeMatch = itemTag.match(/type="([^"]+)"/);

          // Extract name from the following name tag
          const itemIndex = xmlText.indexOf(itemTag);
          const nameMatch = xmlText
            .slice(itemIndex)
            .match(/<name[^>]*value="([^"]+)"/);
          const yearMatch = xmlText
            .slice(itemIndex)
            .match(/<yearpublished[^>]*value="(\d+)"/);

          return {
            id: idMatch ? parseInt(idMatch[1]) : 0,
            name: nameMatch ? nameMatch[1] : '',
            type: typeMatch ? typeMatch[1] : 'boardgame',
            yearPublished: yearMatch ? parseInt(yearMatch[1]) : undefined,
          };
        })
        .filter((item) => item.id > 0 && item.name);
    } catch (error) {
      console.error('Error parsing BGG search XML:', error);
      return [];
    }
  }

  /**
   * Parse BGG game details XML response
   */
  private parseGameXML(xmlText: string): BGGGameData | null {
    try {
      // Extract basic info
      const idMatch = xmlText.match(/<item[^>]*id="(\d+)"/);
      const nameMatch = xmlText.match(
        /<name[^>]*type="primary"[^>]*value="([^"]+)"/
      );
      const imageMatch = xmlText.match(/<image>([^<]+)<\/image>/);
      const thumbnailMatch = xmlText.match(/<thumbnail>([^<]+)<\/thumbnail>/);
      const yearMatch = xmlText.match(/<yearpublished[^>]*value="(\d+)"/);
      const descMatch = xmlText.match(/<description>([^<]+)<\/description>/);

      // Extract player counts and times
      const minPlayersMatch = xmlText.match(/<minplayers[^>]*value="(\d+)"/);
      const maxPlayersMatch = xmlText.match(/<maxplayers[^>]*value="(\d+)"/);
      const playingTimeMatch = xmlText.match(/<playingtime[^>]*value="(\d+)"/);
      const minPlayTimeMatch = xmlText.match(/<minplaytime[^>]*value="(\d+)"/);
      const maxPlayTimeMatch = xmlText.match(/<maxplaytime[^>]*value="(\d+)"/);

      // Extract ratings
      const complexityMatch = xmlText.match(
        /<averageweight[^>]*value="([^"]+)"/
      );
      const ratingMatch = xmlText.match(/<average[^>]*value="([^"]+)"/);
      const rankMatch = xmlText.match(
        /<rank[^>]*name="boardgame"[^>]*value="(\d+)"/
      );

      // Extract publishers
      const publisherMatches = xmlText.match(
        /<link[^>]*type="boardgamepublisher"[^>]*value="([^"]+)"/g
      );
      const publishers = publisherMatches
        ? publisherMatches
            .map((match) => {
              const valueMatch = match.match(/value="([^"]+)"/);
              return valueMatch ? valueMatch[1] : '';
            })
            .filter(Boolean)
        : [];

      // Extract categories
      const categoryMatches = xmlText.match(
        /<link[^>]*type="boardgamecategory"[^>]*value="([^"]+)"/g
      );
      const categories = categoryMatches
        ? categoryMatches
            .map((match) => {
              const valueMatch = match.match(/value="([^"]+)"/);
              return valueMatch ? valueMatch[1] : '';
            })
            .filter(Boolean)
        : [];

      // Extract mechanics
      const mechanicMatches = xmlText.match(
        /<link[^>]*type="boardgamemechanic"[^>]*value="([^"]+)"/g
      );
      const mechanics = mechanicMatches
        ? mechanicMatches
            .map((match) => {
              const valueMatch = match.match(/value="([^"]+)"/);
              return valueMatch ? valueMatch[1] : '';
            })
            .filter(Boolean)
        : [];

      if (!idMatch || !nameMatch) {
        return null;
      }

      return {
        id: parseInt(idMatch[1]),
        name: nameMatch[1],
        image: imageMatch ? imageMatch[1] : '',
        thumbnail: thumbnailMatch ? thumbnailMatch[1] : '',
        minPlayers: minPlayersMatch ? parseInt(minPlayersMatch[1]) : 1,
        maxPlayers: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : 1,
        playingTime: playingTimeMatch ? parseInt(playingTimeMatch[1]) : 0,
        minPlayTime: minPlayTimeMatch ? parseInt(minPlayTimeMatch[1]) : 0,
        maxPlayTime: maxPlayTimeMatch ? parseInt(maxPlayTimeMatch[1]) : 0,
        complexity: complexityMatch ? parseFloat(complexityMatch[1]) : 0,
        yearPublished: yearMatch ? parseInt(yearMatch[1]) : 0,
        description: descMatch ? this.cleanDescription(descMatch[1]) : '',
        publisher: publishers,
        categories,
        mechanics,
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
        rank: rankMatch ? parseInt(rankMatch[1]) : 0,
      };
    } catch (error) {
      console.error('Error parsing BGG game XML:', error);
      return null;
    }
  }

  /**
   * Clean HTML from BGG description
   */
  private cleanDescription(description: string): string {
    return description
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')
      .trim();
  }
}
