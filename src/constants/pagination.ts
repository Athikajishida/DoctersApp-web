// Pagination constants used across the application
export const PAGINATION = {
  // Default items per page for all tables
  DEFAULT_ITEMS_PER_PAGE: 10,
  
  // Available options for items per page selector
  ITEMS_PER_PAGE_OPTIONS: [10, 25, 50, 100] as const,
  
  // Maximum items to fetch in a single request
  MAX_ITEMS_PER_PAGE: 1000,
  
  // Pagination display settings
  MAX_VISIBLE_PAGES: 5,
} as const;

// Export individual constants for convenience
export const DEFAULT_ITEMS_PER_PAGE = PAGINATION.DEFAULT_ITEMS_PER_PAGE;
export const ITEMS_PER_PAGE_OPTIONS = PAGINATION.ITEMS_PER_PAGE_OPTIONS;
export const MAX_ITEMS_PER_PAGE = PAGINATION.MAX_ITEMS_PER_PAGE;
export const MAX_VISIBLE_PAGES = PAGINATION.MAX_VISIBLE_PAGES;

// Export types for TypeScript
export type ItemsPerPageOption = typeof ITEMS_PER_PAGE_OPTIONS[number]; 