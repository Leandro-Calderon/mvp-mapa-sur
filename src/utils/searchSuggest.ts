import type { BuildingFeature, StreetFeature } from '../types/geojson';
import type { SearchType } from '../components/SearchPanel';

export interface SearchSuggestion {
  value: string;
}

/** Maximum number of suggestions shown in the combobox list. */
const MAX_SUGGESTIONS = 7;

/**
 * Ascending comparison that is numeric-aware ("Pasaje 9" sorts before
 * "Pasaje 10") and case-insensitive. Array#sort is stable, so candidates
 * comparing equal keep their dataset order.
 */
const compareAscending = (a: string, b: string): number =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/** Collect the distinct candidate values for the given search type. */
const collectCandidates = (
  type: SearchType,
  buildings: BuildingFeature[],
  streets: StreetFeature[]
): string[] => {
  if (type === 'calle') {
    return streets
      .map((street) => street.properties.nombre)
      .filter(isNonEmptyString);
  }

  if (type === 'plan') {
    return buildings
      .map((building) => building.properties.plan)
      .filter(isNonEmptyString);
  }

  const matchesType = (building: BuildingFeature): boolean =>
    type === 'edificio'
      ? building.properties.tipo === 'Torre' || building.properties.tipo === 'Bloque'
      : building.properties.tipo === 'Departamento';

  return buildings
    .filter(matchesType)
    .map((building) => building.properties.nombre)
    .filter((nombre): nombre is number => nombre !== null && nombre !== undefined)
    .map((nombre) => String(nombre));
};

/**
 * Compute autocomplete suggestions for the typed query over the loaded
 * GeoJSON datasets, client-side.
 *
 * Matching is a case-insensitive substring test on the trimmed query.
 * Prefix matches are listed first; within each group values are sorted
 * ascending (numeric-aware). The result is capped at MAX_SUGGESTIONS.
 */
export function getSuggestions(
  query: string,
  type: SearchType,
  buildings: BuildingFeature[],
  streets: StreetFeature[]
): SearchSuggestion[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const normalizedQuery = trimmedQuery.toLowerCase();
  const distinctCandidates = new Set(collectCandidates(type, buildings, streets));

  const prefixMatches: string[] = [];
  const substringMatches: string[] = [];

  for (const candidate of distinctCandidates) {
    const normalizedCandidate = candidate.toLowerCase();
    if (!normalizedCandidate.includes(normalizedQuery)) {
      continue;
    }
    if (normalizedCandidate.startsWith(normalizedQuery)) {
      prefixMatches.push(candidate);
    } else {
      substringMatches.push(candidate);
    }
  }

  prefixMatches.sort(compareAscending);
  substringMatches.sort(compareAscending);

  return [...prefixMatches, ...substringMatches]
    .slice(0, MAX_SUGGESTIONS)
    .map((value) => ({ value }));
}
