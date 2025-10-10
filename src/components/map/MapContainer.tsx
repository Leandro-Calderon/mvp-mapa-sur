import { MapContainer as LeafletMapContainer, TileLayer } from "react-leaflet";
import { useMapContext } from "../../context/MapContext";
import { MapHashSync } from "./MapHashSync";
import { BuildingLayer } from "../layers/BuildingLayer";
import { StreetLayer } from "../layers/StreetLayer";
import type { BuildingFeature, StreetFeature } from "../../types/geojson";

const TILE_LAYER_CONFIG = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
  maxZoom: 19,
  maxNativeZoom: 19,
} as const;

interface MapContainerProps {
  filteredBuildings: BuildingFeature[];
  filteredStreets: StreetFeature[];
  shouldShowBuildings: boolean;
  shouldShowStreets: boolean;
}

export const MapContainer = ({
  filteredBuildings,
  filteredStreets,
  shouldShowBuildings,
  shouldShowStreets
}: MapContainerProps) => {
  const { mapState } = useMapContext();

  return (
    <LeafletMapContainer
      center={mapState.center}
      zoom={mapState.zoom}
      zoomControl={false}
      scrollWheelZoom
      className="h-full w-full"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url={TILE_LAYER_CONFIG.url}
        attribution={TILE_LAYER_CONFIG.attribution}
        maxZoom={TILE_LAYER_CONFIG.maxZoom}
        maxNativeZoom={TILE_LAYER_CONFIG.maxNativeZoom}
      />
      <MapHashSync />
      <BuildingLayer
        features={filteredBuildings}
        isVisible={shouldShowBuildings}
      />
      <StreetLayer
        features={filteredStreets}
        isVisible={shouldShowStreets}
      />
    </LeafletMapContainer>
  );
};
