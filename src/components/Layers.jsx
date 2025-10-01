import { useState, useEffect } from "react";
import { LayersControl } from "react-leaflet";
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

  if (loading) {
    return <div>Cargando datos...</div>;
  }

  return (
    <>
      <LayersControl position="topright">
        <LayersControl.Overlay id="Mostrar Todos" name="Mostrar Todos">
          <MarkersList features={filteredData} />
        </LayersControl.Overlay>
      </LayersControl>
      <FilterForm filters={filters} onFilterChange={setFilters} />
    </>
  );
};