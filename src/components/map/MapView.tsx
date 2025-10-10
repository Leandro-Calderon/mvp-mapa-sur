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
        showBuildings,
        showStreets,
        locationActive,

        // Data
        filteredBuildings,
        filteredStreets,
        buildingResults,
        streetResults,
        totalResults,
        shouldShowBuildings,
        shouldShowStreets,

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
        handleLayerToggle,
        handleLocationToggle,
        handlePanelToggle
    } = useSearchLogic();

    const dataError = buildingsError || streetsError;
    const isLoading = buildingsLoading || streetsLoading;

    return (
        <div className={styles.mapContainer} style={{ minHeight: '100vh' }}>
            <MapContainer
                filteredBuildings={filteredBuildings}
                filteredStreets={filteredStreets}
                shouldShowBuildings={shouldShowBuildings}
                shouldShowStreets={shouldShowStreets}
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
                onLayerToggle={handleLayerToggle}
                showBuildings={showBuildings}
                showStreets={showStreets}
                buildingResults={buildingResults}
                streetResults={streetResults}
                searchResults={totalResults}
                panelCollapsed={panelCollapsed}
                onToggleCollapse={handlePanelToggle}
                locationActive={locationActive}
                onLocationToggle={handleLocationToggle}
            />
        </div>
    );
};
