import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useMapHash } from "../../hooks/useMapHash.js";

export const MapHashSync = () => {
    const map = useMap();
    const { updateMapHash } = useMapHash();

    useEffect(() => {
        const handleMoveEnd = () => updateMapHash(map);
        map.on("moveend", handleMoveEnd);

        return () => {
            map.off("moveend", handleMoveEnd);
        };
    }, [map, updateMapHash]);

    return null;
};
