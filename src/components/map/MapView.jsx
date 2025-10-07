import { MapContainer, TileLayer } from "react-leaflet";
import PWABadge from "../../PWABadge.jsx";
import { Layers } from "../Layers.jsx";
import LiveLocationToggle from "../LiveLocationToggle.jsx";
import { MapHashSync } from "./MapHashSync.jsx";
import { useMapContext } from "../../context/MapContext.jsx";

const MAP_STYLE = {
    height: "100vh",
    width: "100vw",
};

const TILE_LAYER_CONFIG = {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
    maxZoom: 19,
    maxNativeZoom: 19,
};

export const MapView = () => {
    const { mapState } = useMapContext();

    return (
        <MapContainer
            center={mapState.center}
            zoom={mapState.zoom}
            zoomControl={false}
            scrollWheelZoom
            style={MAP_STYLE}
        >
            <TileLayer
                url={TILE_LAYER_CONFIG.url}
                attribution={TILE_LAYER_CONFIG.attribution}
                maxZoom={TILE_LAYER_CONFIG.maxZoom}
                maxNativeZoom={TILE_LAYER_CONFIG.maxNativeZoom}
            />
            <MapHashSync />
            <PWABadge />
            <Layers />
            <LiveLocationToggle />
        </MapContainer>
    );
};
