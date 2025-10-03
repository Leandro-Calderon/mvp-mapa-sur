import { useState, useEffect } from "react";
import { LayersControl, useMapEvents } from "react-leaflet";
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

  // // Debug logging for streets
  // useEffect(() => {
  //   console.log('=== STREETS DEBUG ===');
  //   console.log('streetsData:', streetsData);
  //   console.log('streetsData?.features:', streetsData?.features);
  //   console.log('streetFilters:', streetFilters);
  //   console.log('filteredStreets:', filteredStreets);
  //   console.log('filteredStreets.length:', filteredStreets.length);
  //   console.log('showStreets checked?', streetFilters.showStreets);
  //   console.log('Will render streets?', streetFilters.showStreets && filteredStreets.length > 0);
  //   console.log('====================');
  // }, [streetsData, streetFilters, filteredStreets]);

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
      {(streetFilters.showStreets || streetFilters.streetName) && filteredStreets.length > 0 && (
        <StreetsList features={filteredStreets} />
      )}
      <FilterForm 
        filters={filters} 
        onFilterChange={setFilters}
        streetFilters={streetFilters}
        onStreetFilterChange={setStreetFilters}
      />
    </>
  );
};