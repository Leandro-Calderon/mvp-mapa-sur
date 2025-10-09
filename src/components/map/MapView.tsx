import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import PWABadge from "../../PWABadge";
import { SearchPanel } from "../SearchPanel";
import { LocationButton } from "../LocationButton";
import { MapHashSync } from "./MapHashSync";
import { useMapContext } from "../../context/MapContext";
import type { SearchType } from "../SearchPanel";
import { useBuildingsData } from "../../hooks/useBuildingsData";
import { useStreetsData } from "../../hooks/useStreetsData";
import { useFilteredData } from "../../hooks/useFilteredData";
import { useFilteredStreets } from "../../hooks/useFilteredStreets";
import { BuildingLayer } from "../layers/BuildingLayer";
import { StreetLayer } from "../layers/StreetLayer";

const TILE_LAYER_CONFIG = {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
    maxZoom: 19,
    maxNativeZoom: 19,
} as const;

export const MapView = () => {
    const { mapState } = useMapContext();
    const { data: buildingFeatures, loading: buildingsLoading, error: buildingsError } = useBuildingsData();
    const { data: streetFeatures, loading: streetsLoading, error: streetsError } = useStreetsData();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState<SearchType>("edificio");
    const [appliedQuery, setAppliedQuery] = useState("");
    const [appliedType, setAppliedType] = useState<SearchType | null>(null);
    const [panelCollapsed, setPanelCollapsed] = useState(true);
    const [showBuildings, setShowBuildings] = useState(false);
    const [showStreets, setShowStreets] = useState(false);
    const [appliedRevision, setAppliedRevision] = useState(0);
    const [locationActive, setLocationActive] = useState(false);

    const normalizedSearchQuery = searchQuery.trim();
    const normalizedAppliedQuery = appliedQuery.trim();

    const buildingFilters = useMemo(() => ({
        edificio: appliedType === "edificio" ? normalizedAppliedQuery : "",
        vivienda: appliedType === "departamento" ? normalizedAppliedQuery : "",
        plan: appliedType === "plan" ? normalizedAppliedQuery : "",
    }), [normalizedAppliedQuery, appliedType]);

    const streetFilters = useMemo(() => ({
        streetName: appliedType === "calle" ? normalizedAppliedQuery : "",
    }), [normalizedAppliedQuery, appliedType]);

    const filteredBuildingsRaw = useFilteredData(buildingFeatures, buildingFilters);
    const filteredStreetsRaw = useFilteredStreets(streetFeatures, streetFilters);

    const filteredBuildings = normalizedAppliedQuery && appliedType !== "calle"
        ? filteredBuildingsRaw
        : [];

    const filteredStreets = normalizedAppliedQuery && appliedType === "calle"
        ? filteredStreetsRaw
        : [];

    const buildingResults = filteredBuildings.length;
    const streetResults = filteredStreets.length;
    const totalResults = buildingResults + streetResults;

    const shouldShowBuildings = showBuildings && buildingResults > 0;
    const shouldShowStreets = showStreets && streetResults > 0;

    const handleQueryChange = (query: string) => {
        setSearchQuery(query);
    };

    const handleTypeChange = (type: SearchType) => {
        setSearchType(type);
    };

    const handleSubmit = () => {
        const trimmed = normalizedSearchQuery;

        if (!trimmed) {
            setAppliedQuery("");
            setAppliedType(null);
            return;
        }

        setAppliedQuery(trimmed);
        setAppliedType(searchType);
        setAppliedRevision((prev) => prev + 1);
    };

    const handleClear = () => {
        setSearchQuery("");
        setAppliedQuery("");
        setAppliedType(null);
        setShowBuildings(false);
        setShowStreets(false);
        setAppliedRevision((prev) => prev + 1);
    };

    const handleLayerToggle = (layer: "calles" | "todo") => {
        if (layer === "calles") {
            if (streetResults === 0) {
                return;
            }
            setShowStreets((prev) => !prev);
            return;
        }

        if (buildingResults === 0) {
            return;
        }

        setShowBuildings((prev) => !prev);
    };

    useEffect(() => {
        if (!normalizedAppliedQuery || !appliedType) {
            setShowBuildings(false);
            setShowStreets(false);
            return;
        }

        if (appliedType === "calle") {
            setShowBuildings(false);
            setShowStreets(streetResults > 0);
            return;
        }

        setShowStreets(false);
        setShowBuildings(buildingResults > 0);
    }, [appliedRevision, normalizedAppliedQuery, appliedType, buildingResults, streetResults]);

    const handleLocationToggle = (active: boolean) => {
        setLocationActive(active);
    };

    const handlePanelToggle = (collapsed: boolean) => {
        setPanelCollapsed(collapsed);
    };

    const dataError = buildingsError || streetsError;
    const isLoading = buildingsLoading || streetsLoading;

    return (
        <div
            style={{
                position: "relative",
                width: "100vw",
                height: "100dvh",
                minHeight: "100vh",
            }}
        >
            <MapContainer
                center={mapState.center}
                zoom={mapState.zoom}
                zoomControl={false}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url={TILE_LAYER_CONFIG.url}
                    attribution={TILE_LAYER_CONFIG.attribution}
                    maxZoom={TILE_LAYER_CONFIG.maxZoom}
                    maxNativeZoom={TILE_LAYER_CONFIG.maxNativeZoom}
                />
                <MapHashSync />
                <PWABadge />
                <BuildingLayer
                    features={filteredBuildings}
                    isVisible={shouldShowBuildings}
                />
                <StreetLayer
                    features={filteredStreets}
                    isVisible={shouldShowStreets}
                />
            </MapContainer>

            {isLoading && (
                <div
                    style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        backgroundColor: "rgba(255, 255, 255, 0.85)",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                        fontSize: "13px",
                        color: "#1f2933",
                        zIndex: 1200,
                    }}
                >
                    Cargando capas…
                </div>
            )}

            {dataError && (
                <div
                    style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        backgroundColor: "rgba(254, 226, 226, 0.95)",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                        fontSize: "13px",
                        color: "#991b1b",
                        zIndex: 1300,
                        maxWidth: "220px",
                    }}
                >
                    Error al cargar datos geoespaciales. Intenta recargar la página.
                </div>
            )}

            <SearchPanel
                searchQuery={searchQuery}
                searchType={searchType}
                appliedQuery={appliedQuery}
                appliedType={appliedType}
                onQueryChange={handleQueryChange}
                onTypeChange={handleTypeChange}
                onSubmit={handleSubmit}
                onClear={handleClear}
                onLayerToggle={handleLayerToggle}
                showBuildings={showBuildings}
                showStreets={showStreets}
                buildingResults={buildingResults}
                streetResults={streetResults}
                searchResults={totalResults}
                collapsed={panelCollapsed}
                onToggleCollapse={handlePanelToggle}
            />
            <LocationButton
                onToggle={handleLocationToggle}
                isActive={locationActive}
            />
        </div>
    );
};
