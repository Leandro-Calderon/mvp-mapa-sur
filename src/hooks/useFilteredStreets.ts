import { useMemo, useCallback } from "react";
import type { StreetFeature } from "../types/geojson";
import { matchesStreetName } from "../utils/searchMatcher";

type StreetFilters = {
  streetName: string,
};

/**
 * Hook to filter streets by name
 * @param data - Array of street GeoJSON features
 * @param filters - Filter object with streetName property
 * @returns Filtered array of street features
 */
export const useFilteredStreets = (
  data: StreetFeature[],
  filters: StreetFilters
) => {
  const filterStreet = useCallback(
    (street: StreetFeature) => {
      // If no filter, show all streets
      if (!filters.streetName) {
        return true;
      }

      // Use word boundary matching for numbers in street names
      return matchesStreetName(street.properties.nombre, filters.streetName);
    },
    [filters]
  );

  return useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.filter(filterStreet);
  }, [data, filterStreet]);
};
