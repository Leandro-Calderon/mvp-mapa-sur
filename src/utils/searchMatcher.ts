/**
 * Search matching utilities for filtering buildings and streets
 * Provides exact matching for building names (numbers or letters)
 * and word boundary matching for street names
 */

/**
 * Matches building nombre (number or letter) against search query
 * - Exact match for numbers: "5" matches 5, not 35
 * - Case-insensitive for letters: "d" matches "D"
 * 
 * @param nombre - Building name (can be number, string, or null)
 * @param query - Search query string
 * @returns true if exact match (case-insensitive)
 */
export const matchesBuildingName = (
    nombre: number | string | null,
    query: string
): boolean => {
    if (nombre === null || !query.trim()) {
        return false;
    }

    const normalizedQuery = query.trim().toLowerCase();
    const normalizedNombre = nombre.toString().toLowerCase();

    // Exact match (case-insensitive)
    return normalizedNombre === normalizedQuery;
};

/**
 * Counts valid characters in a string (excluding spaces and dots)
 * @param str - Input string
 * @returns Number of valid characters
 */
const countValidChars = (str: string): number => {
    return str.replace(/[\s.]/g, '').length;
};

/**
 * Minimum number of valid characters required for street name matching
 */
const MIN_VALID_CHARS = 3;

/**
 * Matches street name with word boundary support for numbers
 * - Requires minimum 3 valid characters (excluding spaces and dots)
 * - "5" matches "Pasaje 5" but not "Pasaje 55"
 * - "Pasaje" matches "Pasaje 5" (case-insensitive prefix/contains)
 * - Case-insensitive text matching
 * 
 * @param nombre - Street name string
 * @param query - Search query string
 * @returns true if query matches with word boundaries for numbers
 */
export const matchesStreetName = (
    nombre: string,
    query: string
): boolean => {
    if (!nombre || !query.trim()) {
        return false;
    }

    const normalizedQuery = query.trim().toLowerCase();
    const normalizedNombre = nombre.toLowerCase();

    // Require minimum valid characters for matching (excluding spaces and dots)
    if (countValidChars(normalizedQuery) < MIN_VALID_CHARS) {
        return false;
    }

    // Check if query is purely numeric
    const isNumericQuery = /^\d+$/.test(normalizedQuery);

    if (isNumericQuery) {
        // For numeric queries, use word boundary matching
        // This ensures "5" matches "Pasaje 5" but not "Pasaje 55"
        const wordBoundaryRegex = new RegExp(`\\b${normalizedQuery}\\b`);
        return wordBoundaryRegex.test(normalizedNombre);
    }

    // For text queries, use case-insensitive contains
    return normalizedNombre.includes(normalizedQuery);
};
