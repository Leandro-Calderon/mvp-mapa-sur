import { SearchPanel } from "../SearchPanel";
import { LocationButton } from "../LocationButton";
import type { SearchType } from "../SearchPanel";

interface MapControlsProps {
  searchQuery: string;
  searchType: SearchType;
  appliedQuery: string;
  appliedType: SearchType | null;
  onQueryChange: (query: string) => void;
  onTypeChange: (type: SearchType) => void;
  onSubmit: () => void;
  onClear: () => void;
  onLayerToggle: (layer: "calles" | "todo") => void;
  showBuildings: boolean;
  showStreets: boolean;
  buildingResults: number;
  streetResults: number;
  searchResults: number;
  panelCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  locationActive: boolean;
  onLocationToggle: (active: boolean) => void;
  isLocationTracking: boolean;
  locationError: string | null;
}

export const MapControls = ({
  searchQuery,
  searchType,
  appliedQuery,
  appliedType,
  onQueryChange,
  onTypeChange,
  onSubmit,
  onClear,
  onLayerToggle,
  showBuildings,
  showStreets,
  buildingResults,
  streetResults,
  searchResults,
  panelCollapsed,
  onToggleCollapse,
  locationActive,
  onLocationToggle,
  isLocationTracking,
  locationError
}: MapControlsProps) => {
  return (
    <>
      <SearchPanel
        searchQuery={searchQuery}
        searchType={searchType}
        appliedQuery={appliedQuery}
        appliedType={appliedType}
        onQueryChange={onQueryChange}
        onTypeChange={onTypeChange}
        onSubmit={onSubmit}
        onClear={onClear}
        onLayerToggle={onLayerToggle}
        showBuildings={showBuildings}
        showStreets={showStreets}
        buildingResults={buildingResults}
        streetResults={streetResults}
        searchResults={searchResults}
        collapsed={panelCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
      <LocationButton
        onToggle={onLocationToggle}
        isActive={locationActive}
        isTracking={isLocationTracking}
        hasError={!!locationError}
      />
    </>
  );
};
