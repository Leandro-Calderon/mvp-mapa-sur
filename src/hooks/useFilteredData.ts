import { useMemo, useCallback } from "react";

import type { BuildingFeature } from "../types/geojson";
import { matchesBuildingName } from "../utils/searchMatcher";

type Filters = {
  edificio: string,
  vivienda: string,
  plan: string,
};

export const useFilteredData = (data: BuildingFeature[], filters: Filters) => {
  // Memoize the filter function to prevent unnecessary recreations
  const filterItem = useCallback(
    (item: BuildingFeature) => {
      const trimmedEdificio = filters.edificio?.trim() || '';
      const trimmedVivienda = filters.vivienda?.trim() || '';
      const trimmedPlan = filters.plan?.trim() || '';

      // Early return if no filters are active
      if (!trimmedEdificio && !trimmedVivienda && !trimmedPlan) {
        return true;
      }

      // Check each filter using exact matching for building names
      const matchEdificio = !trimmedEdificio ||
        matchesBuildingName(item.properties.nombre, trimmedEdificio);

      const matchVivienda = !trimmedVivienda ||
        matchesBuildingName(item.properties.nombre, trimmedVivienda);

      const matchPlan = !trimmedPlan ||
        item.properties.plan?.includes(trimmedPlan);

      return matchEdificio && matchVivienda && matchPlan;
    },
    [filters.edificio, filters.vivienda, filters.plan]
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

