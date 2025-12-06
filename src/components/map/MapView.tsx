import { MapContainer } from "./MapContainer";
import { MapNotifications } from "./MapNotifications";
import { MapControls } from "./MapControls";
import { ConnectionStatus } from "../ConnectionStatus";
import { DataStatusNotification } from "../DataStatusNotification";
import { FonaviLegend } from "../FonaviLegend";
import { useSearchLogic } from "../../hooks/useSearchLogic";
import { useDataService } from "../../hooks/useDataService";
import { createDataService, type OfflineDataService } from "../../services/OfflineDataService";
import { useState, useEffect } from "react";
import { logger } from "../../utils/logger";
import styles from "./MapView.module.css";

export const MapView = () => {
    // Initialize offline data service for cache info
    const [offlineService] = useState<OfflineDataService>(() => createDataService() as OfflineDataService);
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
        panelCollapsed,
        showAllLayers,
        locationActive,
        userPosition,
        locationAccuracy,
        locationError,
        isLocationTracking,

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

    return (
        <div className={styles.mapContainer} style={{ minHeight: '100vh' }}>
            <MapContainer
                filteredBuildings={filteredBuildings}
                filteredStreets={filteredStreets}
                showAllLayers={showAllLayers}
                userPosition={userPosition}
                locationAccuracy={locationAccuracy}
                locationError={locationError}
                isLocationTracking={isLocationTracking}
            />

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
                isLocationTracking={isLocationTracking}
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
