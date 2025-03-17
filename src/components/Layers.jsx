import { useState } from "react";
import { LayersControl } from "react-leaflet";
import { FilterForm } from "./FilterForm";
import { MarkersList } from "./MarkersList";
import { useFilteredData } from "../hooks/useFilteredData";
import geojsonData from "../assets/fonavi.json";

export const Layers = () => {
  const [filters, setFilters] = useState({
    edificio: "",
    vivienda: "",
    plan: "",
  });

  const filteredData = useFilteredData(geojsonData.features, filters);

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
