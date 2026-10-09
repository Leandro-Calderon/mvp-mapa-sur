import { SearchPanel } from "../SearchPanel";
import { LocationButton } from "../LocationButton";
import type { SearchType } from "../SearchPanel";
import type { SearchSuggestion } from "../../utils/searchSuggest";
import type { GeolocationErrorKind } from "../../hooks/useGeolocation";

interface MapControlsProps {
  searchQuery: string;
  searchType: SearchType;
  appliedQuery: string;
  appliedType: SearchType | null;
  onQueryChange: (query: string) => void;
  onTypeChange: (type: SearchType) => void;
  onSubmit: () => void;
  onClear: () => void;
  onShowAllToggle: () => void;
  showAllLayers: boolean;
  buildingResults: number;
  streetResults: number;
  searchResults: number;
  panelCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  locationActive: boolean;
  onLocationToggle: (active: boolean) => void;
  isLocationTracking: boolean;
  locationError: string | null;
  locationErrorKind?: GeolocationErrorKind;
  suggestions: SearchSuggestion[];
  onSuggestionSelect: (value: string) => void;
}

export const MapControls = ({
  searchQuery: _query,
  searchType: _type,
  appliedQuery,
  appliedType,
  onQueryChange,
  onTypeChange,
  onSubmit,
  onClear,
  onShowAllToggle,
  showAllLayers,
  buildingResults,
  streetResults,
  searchResults,
  panelCollapsed: _collapsed,
  onToggleCollapse,
  locationActive: _active,
  onLocationToggle,
  isLocationTracking,
  locationError,
  locationErrorKind,
  suggestions,
  onSuggestionSelect
}: MapControlsProps) => {
  return (
    <>
      <SearchPanel
        searchQuery={_query}
        searchType={_type}
        appliedQuery={appliedQuery}
        appliedType={appliedType}
        onQueryChange={onQueryChange}
        onTypeChange={onTypeChange}
        onSubmit={onSubmit}
        onClear={onClear}
        onShowAllToggle={onShowAllToggle}
        showAllLayers={showAllLayers}
        buildingResults={buildingResults}
        streetResults={streetResults}
        searchResults={searchResults}
        collapsed={_collapsed}
        onToggleCollapse={onToggleCollapse}
        suggestions={suggestions}
        onSuggestionSelect={onSuggestionSelect}
      />
      <LocationButton
        onToggle={onLocationToggle}
        isActive={_active}
        isTracking={isLocationTracking}
        hasError={!!locationError}
        errorMessage={locationError}
        errorKind={locationErrorKind}
      />
    </>
  );
};
