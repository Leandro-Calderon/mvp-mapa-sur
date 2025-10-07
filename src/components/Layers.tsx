import { useMemo, useState } from "react";
import { FilterForm } from "./FilterForm";
import { useBuildingsData } from "../hooks/useBuildingsData";
import { useStreetsData } from "../hooks/useStreetsData";
import { useFilteredData } from "../hooks/useFilteredData";
import { useFilteredStreets } from "../hooks/useFilteredStreets";
import { BuildingLayer } from "./layers/BuildingLayer";
import { StreetLayer } from "./layers/StreetLayer";
import type { BuildingFilters, StreetFilters } from "../types/filters";

export const Layers = () => {
    const [filters, setFilters] = useState<BuildingFilters>({
        edificio: "",
        vivienda: "",
        plan: "",
    });

    const [streetFilters, setStreetFilters] = useState<StreetFilters>({
        streetName: "",
        showStreets: false,
    });

    const [showAllChecked, setShowAllChecked] = useState(false);

    const {
        data: buildingFeatures,
        loading: buildingsLoading,
        error: buildingsError,
    } = useBuildingsData();

    const {
        data: streetFeatures,
        loading: streetsLoading,
        error: streetsError,
    } = useStreetsData();

    const filteredBuildings = useFilteredData(buildingFeatures, filters);
    const filteredStreets = useFilteredStreets(streetFeatures, streetFilters);

    const hasActiveFilters = useMemo(() => (
        Boolean(filters.edificio) || Boolean(filters.vivienda) || Boolean(filters.plan)
    ), [filters]);

    const shouldShowBuildings = showAllChecked || hasActiveFilters;
    const shouldShowStreets = useMemo(() => (
        (streetFilters.showStreets || streetFilters.streetName !== "") && filteredStreets.length > 0
    ), [filteredStreets.length, streetFilters]);

    if (buildingsLoading || streetsLoading) {
        return <div>Cargando datos...</div>;
    }

    return (
        <>
            {(buildingsError || streetsError) && (
                <div style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                    zIndex: 1000,
                }}>
                    Error al cargar datos geoespaciales. Intenta recargar la página.
                </div>
            )}

            <BuildingLayer
                features={filteredBuildings}
                isVisible={shouldShowBuildings}
            />

            <StreetLayer
                features={filteredStreets}
                isVisible={shouldShowStreets}
            />

            <FilterForm
                filters={filters}
                onFilterChange={setFilters}
                streetFilters={streetFilters}
                onStreetFilterChange={setStreetFilters}
                showAll={showAllChecked}
                onShowAllChange={setShowAllChecked}
            />
        </>
    );
};
