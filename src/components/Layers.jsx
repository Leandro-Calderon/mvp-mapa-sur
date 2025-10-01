import { useState, useEffect } from "react";
import { LayersControl, useMapEvents } from "react-leaflet";
import { FilterForm } from "./FilterForm";
import { MarkersList } from "./MarkersList";
import { useFilteredData } from "../hooks/useFilteredData";

export const Layers = () => {
  const [filters, setFilters] = useState({
    edificio: "",
    vivienda: "",
    plan: "",
  });
  
  const [geojsonData, setGeojsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllChecked, setShowAllChecked] = useState(false);

  // Cargar el GeoJSON desde public
  useEffect(() => {
    // Use Vite's base URL to handle both dev and production environments
    const baseUrl = import.meta.env.BASE_URL;
    const geojsonUrl = `${baseUrl}assets/fonavi.geojson`;
    
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
  }, []);

  const filteredData = useFilteredData(geojsonData?.features || [], filters);

  // Check if any filter is active
  const hasActiveFilters = filters.edificio || filters.vivienda || filters.plan;

  // Listen to layer events to track toggle state
  const LayerEventHandler = () => {
    useMapEvents({
      overlayadd: (e) => {
        if (e.name === "Mostrar Todos") {
          setShowAllChecked(true);
        }
      },
      overlayremove: (e) => {
        if (e.name === "Mostrar Todos") {
          setShowAllChecked(false);
        }
      },
    });
    return null;
  };

  if (loading) {
    return <div>Cargando datos...</div>;
  }

  return (
    <>
      <LayerEventHandler />
      <LayersControl position="topright">
        <LayersControl.Overlay id="Mostrar Todos" name="Mostrar Todos">
          <MarkersList features={filteredData} />
        </LayersControl.Overlay>
      </LayersControl>
      {/* Show markers when filters are active, even if "Mostrar Todos" is unchecked */}
      {!showAllChecked && hasActiveFilters && (
        <MarkersList features={filteredData} />
      )}
      <FilterForm filters={filters} onFilterChange={setFilters} />
    </>
  );
};