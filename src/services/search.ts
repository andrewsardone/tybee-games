import type { Context } from 'hono';
import type { GameFilters, DurationFilter } from './games';
import { DURATION_FILTERS } from './games';
import type { EnrichedGameFilters } from './gameData';

export interface QueryParams {
  players: string;
  duration: string;
  complexity: string;
  search: string;
  category: string;
  mechanic: string;
  rating: string;
  year: string;
  availableOnly: string;
}

// Helper function to extract query parameters from Hono context
export const getQueryParams = (c: Context): QueryParams => {
  return {
    players: c.req.query('players') || '',
    duration: c.req.query('duration') || '',
    complexity: c.req.query('complexity') || '',
    search: c.req.query('search') || '',
    category: c.req.query('category') || '',
    mechanic: c.req.query('mechanic') || '',
    rating: c.req.query('rating') || '',
    year: c.req.query('year') || '',
    availableOnly: c.req.query('availableOnly') || 'true',
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

// Type predicate to check if a string is a valid DurationFilter
const isDurationFilter = (value: string): value is DurationFilter => {
  return DURATION_FILTERS.includes(value as DurationFilter);
};

// Convert query parameters to GameFilters for database queries
export const queryParamsToGameFilters = (params: QueryParams): GameFilters => {
  const filters: GameFilters = {};

  if (params.players) {
    filters.players = parseInt(params.players, 10);
  }

  if (params.duration && isDurationFilter(params.duration)) {
    filters.duration = params.duration;
  }

  if (params.complexity) {
    filters.complexity = parseInt(params.complexity, 10);
  }

  if (params.search && params.search.trim()) {
    filters.search = params.search.trim();
  }

  return filters;
};

// Convert query parameters to EnrichedGameFilters for advanced filtering
export const queryParamsToEnrichedFilters = (
  params: QueryParams
): EnrichedGameFilters => {
  const filters: EnrichedGameFilters = {};

  if (params.players) {
    const playerCount =
      params.players === '7+' ? 7 : parseInt(params.players, 10);
    if (!isNaN(playerCount)) {
      filters.players = playerCount;
    }
  }

  if (params.duration) {
    switch (params.duration) {
      case 'quick':
        filters.maxDuration = 45;
        break;
      case 'medium':
        filters.minDuration = 45;
        filters.maxDuration = 90;
        break;
      case 'long':
        filters.minDuration = 90;
        break;
    }
  }

  if (params.complexity) {
    const complexityNum = parseInt(params.complexity, 10);
    if (!isNaN(complexityNum)) {
      filters.complexity = complexityNum;
    }
  }

  if (params.search && params.search.trim()) {
    filters.search = params.search.trim();
  }

  if (params.category) {
    filters.category = params.category;
  }

  if (params.mechanic) {
    filters.mechanic = params.mechanic;
  }

  if (params.rating) {
    const ratingNum = parseInt(params.rating, 10);
    if (!isNaN(ratingNum)) {
      filters.minRating = ratingNum;
    }
  }

  if (params.year) {
    filters.yearRange = params.year;
  }

  filters.availableOnly = params.availableOnly !== 'false';

  return filters;
};
