import type { Context } from 'hono';
import type { GameFilters } from './games';

export interface QueryParams {
  players: string;
  duration: string;
  complexity: string;
  search: string;
}

// Helper function to extract query parameters from Hono context
export const getQueryParams = (c: Context): QueryParams => {
  return {
    players: c.req.query('players') || '',
    duration: c.req.query('duration') || '',
    complexity: c.req.query('complexity') || '',
    search: c.req.query('search') || '',
  };
};

// Helper function to build query string from parameters
export const buildQueryString = (params: QueryParams): string => {
  // Filter out empty values and create URLSearchParams
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== '')
  );

  const searchParams = new URLSearchParams(filteredParams);
  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
};

// Convert query parameters to GameFilters for database queries
export const queryParamsToGameFilters = (params: QueryParams): GameFilters => {
  const filters: GameFilters = {};

  if (params.players) {
    filters.players = parseInt(params.players, 10);
  }

  if (
    params.duration &&
    ['quick', 'medium', 'long'].includes(params.duration)
  ) {
    filters.duration = params.duration as 'quick' | 'medium' | 'long';
  }

  if (params.complexity) {
    filters.complexity = parseInt(params.complexity, 10);
  }

  if (params.search && params.search.trim()) {
    filters.search = params.search.trim();
  }

  return filters;
};
