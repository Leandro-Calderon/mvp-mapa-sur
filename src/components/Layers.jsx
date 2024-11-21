import { useState, useMemo } from "react";
import { FeatureGroup, LayersControl, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import icono from "../assets/marker-icon.png";
import shadow from "../assets/marker-shadow.png";
import geojsonData from "../assets/fonavi.json"; // Cargar el GeoJSON

const customIcon = L.icon({
  iconUrl: icono,
  shadowUrl: shadow, // opción si tienes sombra
});

// Función de filtrado
const useFilteredData = (data, filters) => {
  return useMemo(() => {
    return data.filter((item) =>
      (!filters.edificio || item.properties?.nombre?.toString().includes(filters.edificio)) &&
      (!filters.vivienda || item.properties?.nombre?.toString().includes(filters.vivienda)) &&
      (!filters.plan || item.properties?.plan?.toString().includes(filters.plan))
    );
  }, [data, filters]);
};

export const Layers = () => {
  const [filters, setFilters] = useState({
    edificio: "",
    vivienda: "",
    plan: "",
  });

  // Filtrar datos del GeoJSON
  const geojsonFiltrado = useFilteredData(geojsonData.features, filters);

  const searchFormStyle = {
    padding: "5px",
    borderRadius: "4px",
    marginBottom: "0",
    width: "40%",
  };

  const inputStyle = {
    width: "100%",
    padding: "5px",
    margin: "0",
    borderRadius: "3px",
    border: "1px solid #ccc",
  };

  return (
    <>
      <LayersControl position="topright">
        {/* Capa de Edificios filtrados */}
        <LayersControl.Overlay checked id="GeoJSON" name="GeoJSON">
          <FeatureGroup>
            {geojsonFiltrado.map((feature, index) => (
              <Marker
                icon={customIcon}
                key={index}
                position={feature.geometry.coordinates.reverse()} // Invertir lat/lng si es necesario
              >
                <Popup>
                  {feature.properties.tipo}: {feature.properties.nombre} - Plan {feature.properties.plan}
                </Popup>
              </Marker>
            ))}
          </FeatureGroup>
        </LayersControl.Overlay>
      </LayersControl>

      {/* Formulario de filtros */}
      <form
        className="leaflet-control"
        id="search"
        name="search"
        style={searchFormStyle}
      >
        <input
          type="text"
          name="edificio"
          id="edificio"
          placeholder="Filtrar edificio (nombre)"
          autoComplete="off"
          value={filters.edificio}
          onChange={(e) => setFilters({ ...filters, edificio: e.target.value })}
          style={inputStyle}
        />
        <input
          type="text"
          name="vivienda"
          id="vivienda"
          placeholder="Filtrar vivienda (nombre)"
          autoComplete="off"
          value={filters.vivienda}
          onChange={(e) => setFilters({ ...filters, vivienda: e.target.value })}
          style={inputStyle}
        />
        <input
          type="text"
          name="plan"
          id="plan"
          placeholder="Filtrar por plan"
          autoComplete="off"
          value={filters.plan}
          onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
          style={inputStyle}
        />
      </form>
    </>
  );
};
