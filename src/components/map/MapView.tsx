import React from "react";
import { MapContainer } from "./MapContainer";
import { MapNotifications } from "./MapNotifications";
import { MapControls } from "./MapControls";
import { useSearchLogic } from "../../hooks/useSearchLogic";
import styles from "./MapView.module.css";

export const MapView = () => {
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
        </div>
    );
};
