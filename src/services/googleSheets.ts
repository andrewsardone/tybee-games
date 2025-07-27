import type { Game } from '../database/schema';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  apiKey: string;
}

interface GoogleSheetsResponse {
  values?: string[][];
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;

    if (!config.apiKey) {
      throw new Error('API key is required for Google Sheets access');
    }
  }

  async getGames(): Promise<Game[]> {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.range}?key=${this.config.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Google Sheets API error: ${response.status} ${response.statusText}`
        );
      }

      const data: GoogleSheetsResponse = await response.json();
      const rows = data.values;

      if (!rows || rows.length === 0) {
        return [];
      }

      // Assume first row is headers
      const headers = rows[0];
      const dataRows = rows.slice(1);

      return dataRows.map((row, index) => {
        const game: Partial<Game> = {};

        headers.forEach((header: string, colIndex: number) => {
          const value = row[colIndex] || '';

          switch (header.toLowerCase().trim()) {
            case 'id':
              game.id = value;
              break;
            case 'name':
              game.name = value;
              break;
            case 'description':
              game.description = value || null;
              break;
            case 'publisher':
              game.publisher = value || null;
              break;
            case 'year':
              game.year = value ? parseInt(value, 10) : null;
              break;
            case 'image_url':
            case 'imageurl':
              game.imageUrl = value || null;
              break;
            case 'min_players':
            case 'minplayers':
              game.minPlayers = parseInt(value, 10) || 1;
              break;
            case 'max_players':
            case 'maxplayers':
              game.maxPlayers = parseInt(value, 10) || 1;
              break;
            case 'min_duration':
            case 'minduration':
              game.minDuration = parseInt(value, 10) || 0;
              break;
            case 'max_duration':
            case 'maxduration':
              game.maxDuration = parseInt(value, 10) || 0;
              break;
            case 'complexity_level':
            case 'complexitylevel':
            case 'complexity':
              game.complexityLevel = parseInt(value, 10) || 1;
              break;
            case 'strategy_luck_rating':
            case 'strategyluckrating':
            case 'strategy_luck':
              game.strategyLuckRating = parseInt(value, 10) || 1;
              break;
            case 'themes':
              game.themes = value || null;
              break;
            case 'is_active':
            case 'isactive':
            case 'active':
              game.isActive = value.toLowerCase() === 'true' || value === '1';
              break;
          }
        });

        // Ensure required fields have defaults
        return {
          id: game.id || `game-${index + 1}`,
          name: game.name || 'Unnamed Game',
          description: game.description,
          publisher: game.publisher,
          year: game.year,
          imageUrl: game.imageUrl,
          minPlayers: game.minPlayers || 1,
          maxPlayers: game.maxPlayers || game.minPlayers || 1,
          minDuration: game.minDuration || 0,
          maxDuration: game.maxDuration || game.minDuration || 0,
          complexityLevel: game.complexityLevel || 1,
          strategyLuckRating: game.strategyLuckRating || 1,
          themes: game.themes,
          isActive: game.isActive !== false,
          dateAdded: new Date().toISOString(),
          dateUpdated: new Date().toISOString(),
        } as Game;
      });
    } catch (error) {
      console.error('Error fetching games from Google Sheets:', error);
      throw new Error('Failed to fetch games from Google Sheets');
    }
  }
}
