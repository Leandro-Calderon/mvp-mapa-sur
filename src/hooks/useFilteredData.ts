import { useMemo, useCallback } from "react";

import type { BuildingFeature } from "../types/geojson";

type Filters = {
  edificio: string,
  vivienda: string,
  plan: string,
};

// Separate filter predicates for better maintainability and testing
const createFilterPredicates = (filters: Filters) => ({
  edificioFilter: (item: BuildingFeature) =>
    !filters.edificio ||
    item.properties.nombre.toString().includes(filters.edificio.trim()),

  viviendaFilter: (item: BuildingFeature) =>
    !filters.vivienda ||
    item.properties.nombre.toString().includes(filters.vivienda.trim()),

  planFilter: (item: BuildingFeature) =>
    !filters.plan || item.properties.plan.includes(filters.plan.trim()),
});

export const useFilteredData = (data: BuildingFeature[], filters: Filters) => {
  // Memoize the filter function to prevent unnecessary recreations
  const filterItem = useCallback(
    (item: BuildingFeature) => {
      // Early return if no filters are active
      if (!filters.edificio && !filters.vivienda && !filters.plan) {
        return true;
      }

      const predicates = createFilterPredicates(filters);

      return (
        predicates.edificioFilter(item) &&
        predicates.viviendaFilter(item) &&
        predicates.planFilter(item)
      );
    },
    [filters]
  );

  // Memoize the filtered results
  return useMemo(() => {
    // Input validation
    if (!Array.isArray(data)) {
      return [];
    }

    return data.filter(filterItem);
  }, [data, filterItem]);
};

// Optional: Export helper functions for testing
export const __test__ = {
  createFilterPredicates,
};
