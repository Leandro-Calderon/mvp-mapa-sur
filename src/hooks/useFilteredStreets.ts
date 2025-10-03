import { useMemo, useCallback } from "react";

type StreetFeature = {
  properties: {
    nombre: string,
    tipo: string,
  },
  geometry: {
    type: string,
    coordinates: number[][],
  },
};

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

      // Case-insensitive search in street name
      return street.properties.nombre
        .toLowerCase()
        .includes(filters.streetName.toLowerCase().trim());
    },
    [filters]
  );

  return useMemo(() => {
    try {
      if (!Array.isArray(data)) {
        console.error("Invalid street data format: expected array");
        return [];
      }

      return data.filter(filterStreet);
    } catch (error) {
      console.error("Error filtering streets:", error);
      return [];
    }
  }, [data, filterStreet]);
};
