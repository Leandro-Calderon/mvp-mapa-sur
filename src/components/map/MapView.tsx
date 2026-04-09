import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { MapNotifications } from "./MapNotifications";
import { MapControls } from "./MapControls";
import { ConnectionStatus } from "../ConnectionStatus";
import { DataStatusNotification } from "../DataStatusNotification";
import { FonaviLegend } from "../FonaviLegend";
import { useSearchLogic } from "../../hooks/useSearchLogic";
import { useDataService } from "../../hooks/useDataService";
import { getDataService } from "../../services/OfflineDataService";
import { logger } from "../../utils/logger";
import styles from "./MapView.module.css";

// Lazy load the MapContainer for better initial load performance
const MapContainer = lazy(() =>
    import("./MapContainer").then(module => ({ default: module.MapContainer }))
);

// Loading fallback for the map
const MapLoadingFallback = () => (
    <div className={styles.loadingFallback!}>
        <div className={styles.spinner!} />
        <p className={styles.loadingText!}>Cargando mapa...</p>
    </div>
);

export const MapView = () => {
    // Use the shared singleton data service — same instance as useBuildingsData/useStreetsData
    const offlineService = getDataService();
    const [cacheInfo, setCacheInfo] = useState<{
        buildings: boolean;
        streets: boolean;
        lastSync?: number;
    }>({
        buildings: false,
        streets: false
    });

    // State for legend visibility
    const [showLegend, setShowLegend] = useState(true);

    // Update cache info when data loads
    const { buildings, streets, refresh } = useDataService(offlineService);

    useEffect(() => {
        const updateCacheInfo = async () => {
            try {
                const cacheData = await offlineService.getCacheInfo();
                setCacheInfo({
                    buildings: !!cacheData.buildings,
                    streets: !!cacheData.streets,
                    lastSync: Math.max(
                        cacheData.buildings?.timestamp || 0,
                        cacheData.streets?.timestamp || 0
                    )
                });
            } catch (error) {
                logger.error('Error getting cache info:', error);
            }
        };

        updateCacheInfo();
    }, [buildings.data, streets.data, offlineService]);

    const {
        // State
        searchQuery,
        searchType,
        appliedQuery,
        appliedType,
        appliedRevision,
        panelCollapsed,
        showAllLayers,
        locationActive,
        userPosition,
        locationAccuracy,
        locationError,
        isLocationTracking,
        isLocating,

        // Data
        filteredBuildings,
        filteredStreets,
        buildingResults,
        streetResults,
        totalResults,

        // Loading states
        buildingsLoading,
        streetsLoading,
        buildingsError,
        streetsError,

        // Handlers
        handleQueryChange,
        handleTypeChange,
        handleSubmit,
        handleClear,
        handleShowAllToggle,
        handleLocationToggle,
        handlePanelToggle,
    } = useSearchLogic();

    const dataError = buildingsError || streetsError;
    const isLoading = buildingsLoading || streetsLoading;

    // Handle map click to collapse search panel (only if search input is not focused)
    const handleMapClick = useCallback(() => {
        // Check if search input is currently focused
        const activeElement = document.activeElement;
        const isSearchInputFocused = activeElement?.classList.contains('search-input');

        if (!isSearchInputFocused && !panelCollapsed) {
            handlePanelToggle(true);
        }
    }, [panelCollapsed, handlePanelToggle]);

    return (
        <div className={styles.mapContainer!}>
            <Suspense fallback={<MapLoadingFallback />}>
                <MapContainer
                    filteredBuildings={filteredBuildings}
                    filteredStreets={filteredStreets}
                    showAllLayers={showAllLayers}
                    userPosition={userPosition}
                    locationAccuracy={locationAccuracy}
                    locationError={locationError}
                    isLocationTracking={isLocationTracking}
                    searchRevision={appliedRevision}
                    onMapClick={handleMapClick}
                />
            </Suspense>

            <MapNotifications
                isLoading={isLoading}
                hasError={!!dataError}
            />

            <MapControls
                searchQuery={searchQuery}
                searchType={searchType}
                appliedQuery={appliedQuery}
                appliedType={appliedType}
                onQueryChange={handleQueryChange}
                onTypeChange={handleTypeChange}
                onSubmit={handleSubmit}
                onClear={handleClear}
                onShowAllToggle={handleShowAllToggle}
                showAllLayers={showAllLayers}
                buildingResults={buildingResults}
                streetResults={streetResults}
                searchResults={totalResults}
                panelCollapsed={panelCollapsed}
                onToggleCollapse={handlePanelToggle}
                locationActive={locationActive}
                onLocationToggle={handleLocationToggle}
                isLocating={isLocating}
                locationError={locationError}
            />

            <DataStatusNotification
                buildings={buildings}
                streets={streets}
                onRefresh={refresh}
            />

            <ConnectionStatus
                showCacheInfo={true}
                cacheInfo={cacheInfo}
            />

            <FonaviLegend
                isVisible={showLegend && filteredBuildings.length > 0}
                onClose={() => setShowLegend(false)}
            />
        </div>
    );
};
