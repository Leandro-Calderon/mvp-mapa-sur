import { useState, useMemo, useCallback, useEffect } from 'react';
import { useBuildingsData } from './useBuildingsData';
import { useStreetsData } from './useStreetsData';
import { useFilteredData } from './useFilteredData';
import { useFilteredStreets } from './useFilteredStreets';
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
  const [appliedRevision, setAppliedRevision] = useState(0);
  const [locationActive, setLocationActive] = useState(false);

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

  const handleQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleTypeChange = useCallback((type: SearchType) => {
    setSearchType(type);
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = normalizedSearchQuery;

    if (!trimmed) {
      setAppliedQuery("");
      setAppliedType(null);
      return;
    }

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

  const handleLocationToggle = useCallback((active: boolean) => {
    setLocationActive(active);
  }, []);

  const handlePanelToggle = useCallback((collapsed: boolean) => {
    setPanelCollapsed(collapsed);
  }, []);

  // Auto-show layers based on search results
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

  return {
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
    handleLocationToggle,
    handlePanelToggle
  };
};
