import { useMemo, useCallback } from "react";

import type { BuildingFeature } from "../types/geojson";
import { matchesBuildingName, matchesPlan } from "../utils/searchMatcher";

type Filters = {
  edificio: string,
  vivienda: string,
  plan: string,
};

// Building types that count as "Edificio" (Torre and Bloque)
const EDIFICIO_TYPES = ["Torre", "Bloque"];

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

      // Edificio filter: only match Torre and Bloque types
      const matchEdificio = !trimmedEdificio ||
        (EDIFICIO_TYPES.includes(item.properties.tipo) &&
          matchesBuildingName(item.properties.nombre, trimmedEdificio));

      // Vivienda/Departamento filter: only match Departamento type
      const matchVivienda = !trimmedVivienda ||
        (item.properties.tipo === "Departamento" &&
          matchesBuildingName(item.properties.nombre, trimmedVivienda));

      // Plan filter: exact match with leading zero normalization
      const matchPlan = !trimmedPlan ||
        matchesPlan(item.properties.plan, trimmedPlan);

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

