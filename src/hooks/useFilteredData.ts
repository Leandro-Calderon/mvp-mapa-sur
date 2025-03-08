import { useMemo, useCallback } from "react";

// Type definitions for better type safety and documentation
type Feature = {
  properties: {
    tipo: string,
    nombre: number,
    plan: string,
    id: number,
  },
  geometry: {
    coordinates: [number, number],
  },
};

type Filters = {
  edificio: string,
  vivienda: string,
  plan: string,
};

// Separate filter predicates for better maintainability and testing
const createFilterPredicates = (filters: Filters) => ({
  edificioFilter: (item: Feature) =>
    !filters.edificio ||
    item.properties.nombre.toString().includes(filters.edificio.trim()),

  viviendaFilter: (item: Feature) =>
    !filters.vivienda ||
    item.properties.nombre.toString().includes(filters.vivienda.trim()),

  planFilter: (item: Feature) =>
    !filters.plan || item.properties.plan.includes(filters.plan.trim()),
});

export const useFilteredData = (data: Feature[], filters: Filters) => {
  // Memoize the filter function to prevent unnecessary recreations
  const filterItem = useCallback(
    (item: Feature) => {
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
    try {
      // Input validation
      if (!Array.isArray(data)) {
        console.error("Invalid data format: expected array");
        return [];
      }

      return data.filter(filterItem);
    } catch (error) {
      console.error("Error filtering data:", error);
      return [];
    }
  }, [data, filterItem]);
};

// Optional: Export helper functions for testing
export const __test__ = {
  createFilterPredicates,
};
