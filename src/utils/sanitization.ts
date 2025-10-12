/**
 * Input sanitization utilities for security
 */

/**
 * Sanitizes user input by removing potentially dangerous characters
 * and limiting length
 */
export const sanitizeInput = (input: string, maxLength: number = 100): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .slice(0, maxLength); // Limit length
};

/**
 * Sanitizes search query specifically for map searches
 */
export const sanitizeSearchQuery = (query: string): string => {
  return sanitizeInput(query, 50);
};

/**
 * Validates and sanitizes numeric input
 */
export const sanitizeNumericInput = (input: string, min: number = 0, max: number = 999999): number | null => {
  const sanitized = input.trim().replace(/[^0-9.-]/g, '');
  const num = Number(sanitized);
  
  if (!Number.isFinite(num) || num < min || num > max) {
    return null;
  }
  
  return num;
};
