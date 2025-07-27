import type { GoogleSheetsConfig } from './googleSheets';

export function getGoogleSheetsConfig(env: any): GoogleSheetsConfig {
  return {
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
    range: env.GOOGLE_SHEETS_RANGE || 'Sheet1!A:Z',
    apiKey: env.GOOGLE_SHEETS_API_KEY,
  };
}
