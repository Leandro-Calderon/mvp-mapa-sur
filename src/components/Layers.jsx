import { useState, useEffect } from "react";
import { FilterForm } from "./FilterForm";
import { MarkersList } from "./MarkersList";
import { StreetsList } from "./StreetsList";
import { useFilteredData } from "../hooks/useFilteredData";
import { useFilteredStreets } from "../hooks/useFilteredStreets";

export const Layers = () => {
  const [filters, setFilters] = useState({
    edificio: "",
    vivienda: "",
    plan: "",
  });

  const [streetFilters, setStreetFilters] = useState({
    streetName: "",
    showStreets: false,
  });

  const [geojsonData, setGeojsonData] = useState(null);
  const [streetsData, setStreetsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllChecked, setShowAllChecked] = useState(false);

  // Cargar el GeoJSON desde public
  useEffect(() => {
    // Use Vite's base URL to handle both dev and production environments
    const baseUrl = import.meta.env.BASE_URL;
    const geojsonUrl = `${baseUrl}assets/fonavi.geojson`;
    const streetsUrl = `${baseUrl}assets/calles.geojson`;

    // Load building data
    fetch(geojsonUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('GeoJSON cargado exitosamente:', data.features?.length, 'features');
        setGeojsonData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error cargando GeoJSON:', error);
        console.error('URL intentada:', geojsonUrl);
        setLoading(false);
      });

    // Load streets data
    fetch(streetsUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Calles GeoJSON cargado exitosamente:', data.features?.length, 'calles');
        setStreetsData(data);
      })
      .catch(error => {
        console.error('Error cargando calles GeoJSON:', error);
        console.error('URL intentada:', streetsUrl);
      });
  }, []);

  const filteredData = useFilteredData(geojsonData?.features || [], filters);
  const filteredStreets = useFilteredStreets(streetsData?.features || [], streetFilters);

  // Check if any filter is active
  const hasActiveFilters = filters.edificio || filters.vivienda || filters.plan;

  if (loading) {
    return <div>Cargando datos...</div>;
  }

  return (
    <>
      {/* Show markers when "Mostrar Todos" is checked OR when filters are active */}
      {(showAllChecked || hasActiveFilters) && (
        <MarkersList features={filteredData} />
      )}
      {(streetFilters.showStreets || streetFilters.streetName) && filteredStreets.length > 0 && (
        <StreetsList features={filteredStreets} />
      )}
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