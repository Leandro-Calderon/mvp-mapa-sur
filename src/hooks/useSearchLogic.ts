import { useState, useMemo, useCallback, useEffect } from 'react';
import { useBuildingsData } from './useBuildingsData';
import { useStreetsData } from './useStreetsData';
import { useFilteredData } from './useFilteredData';
import { useFilteredStreets } from './useFilteredStreets';
import { useGeolocation } from './useGeolocation';
import { sanitizeSearchQuery } from '../utils/sanitization';
import type { SearchType } from '../components/SearchPanel';

export const useSearchLogic = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("edificio");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedType, setAppliedType] = useState<SearchType | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [showBuildings, setShowBuildings] = useState(false);
  const [showStreets, setShowStreets] = useState(false);
  const [showAllLayers, setShowAllLayers] = useState(false);
  const [appliedRevision, setAppliedRevision] = useState(0);
  const [locationActive, setLocationActive] = useState(false);

  const {
    position: userPosition,
    accuracy: locationAccuracy,
    error: locationError,
    isActive: isLocationTracking,
    startTracking,
    stopTracking
  } = useGeolocation();

  const { data: buildingFeatures, loading: buildingsLoading, error: buildingsError } = useBuildingsData();
  const { data: streetFeatures, loading: streetsLoading, error: streetsError } = useStreetsData();

  const normalizedSearchQuery = sanitizeSearchQuery(searchQuery);
  const normalizedAppliedQuery = sanitizeSearchQuery(appliedQuery);

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

  // When showAllLayers is true, show all data regardless of filters
  // Otherwise, only show filtered data based on applied query
  const filteredBuildings = showAllLayers
    ? buildingFeatures
    : (normalizedAppliedQuery && appliedType !== "calle"
      ? filteredBuildingsRaw
      : []);

  const filteredStreets = showAllLayers
    ? streetFeatures
    : (normalizedAppliedQuery && appliedType === "calle"
      ? filteredStreetsRaw
      : []);

  const buildingResults = filteredBuildings.length;
  const streetResults = filteredStreets.length;
  const totalResults = buildingResults + streetResults;

  const shouldShowBuildings = showBuildings && buildingResults > 0;
  const shouldShowStreets = showStreets && streetResults > 0;

  const handleQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleTypeChange = useCallback((type: SearchType) => {
    console.log('useSearchLogic: Type changed from', searchType, 'to', type);
    console.log('useSearchLogic: Current appliedQuery:', appliedQuery, 'appliedType:', appliedType);

    // If there's an applied query and the type is changing, clear the results
    if (appliedQuery && type !== searchType) {
      console.log('useSearchLogic: Clearing applied query due to type change');
      setAppliedQuery("");
      setAppliedType(null);
      setAppliedRevision((prev) => prev + 1);
    }

    // Also clear the input text when switching types
    if (type !== searchType) {
      console.log('useSearchLogic: Clearing search query input due to type change');
      setSearchQuery("");
    }

    setSearchType(type);
  }, [searchType, appliedQuery, appliedType]);

  const handleSubmit = useCallback(() => {
    const trimmed = normalizedSearchQuery;
    console.log('useSearchLogic: handleSubmit called with query:', trimmed, 'type:', searchType);

    if (!trimmed) {
      console.log('useSearchLogic: Empty query, clearing filters');
      setAppliedQuery("");
      setAppliedType(null);
      return;
    }

    console.log('useSearchLogic: Applying filters - query:', trimmed, 'type:', searchType);
    setAppliedQuery(trimmed);
    setAppliedType(searchType);
    setAppliedRevision((prev) => prev + 1);
  }, [normalizedSearchQuery, searchType]);

  const handleClear = useCallback(() => {
    setSearchQuery("");
    setAppliedQuery("");
    setAppliedType(null);
    setShowBuildings(false);
    setShowStreets(false);
    setAppliedRevision((prev) => prev + 1);
  }, []);

  const handleLayerToggle = useCallback((layer: "calles" | "todo") => {
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
  }, [buildingResults, streetResults]);

  const handleShowAllToggle = useCallback(() => {
    console.log('useSearchLogic: handleShowAllToggle called, current value:', showAllLayers);
    setShowAllLayers((prev) => !prev);
  }, [showAllLayers]);

  const handleLocationToggle = useCallback((active: boolean) => {
    console.log('useSearchLogic: handleLocationToggle called with active:', active);
    setLocationActive(active);

    if (active) {
      console.log('Starting location tracking');
      startTracking();
    } else {
      console.log('Stopping location tracking');
      stopTracking();
    }
  }, [startTracking, stopTracking]);

  const handlePanelToggle = useCallback((collapsed: boolean) => {
    setPanelCollapsed(collapsed);
  }, []);

  // Auto-show layers based on search results
  useEffect(() => {
    console.log('useSearchLogic: Auto-show layers effect triggered', {
      normalizedAppliedQuery,
      appliedType,
      buildingResults,
      streetResults
    });

    if (!normalizedAppliedQuery || !appliedType) {
      console.log('useSearchLogic: No applied query or type, hiding layers');
      setShowBuildings(false);
      setShowStreets(false);
      return;
    }

    if (appliedType === "calle") {
      console.log('useSearchLogic: Street search, showing streets if results > 0:', streetResults > 0);
      setShowBuildings(false);
      setShowStreets(streetResults > 0);
      return;
    }

    console.log('useSearchLogic: Building search, showing buildings if results > 0:', buildingResults > 0);
    setShowStreets(false);
    setShowBuildings(buildingResults > 0);
  }, [appliedRevision, normalizedAppliedQuery, appliedType, buildingResults, streetResults]);

  return {
    // State
    searchQuery,
    searchType,
    appliedQuery,
    appliedType,
    panelCollapsed,
    showBuildings,
    showStreets,
    showAllLayers,
    locationActive,
    userPosition,
    locationAccuracy,
    locationError,
    isLocationTracking,

    // Data
    buildingFeatures,
    streetFeatures,
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
    handleShowAllToggle,
    handleLocationToggle,
    handlePanelToggle,
  };
};
