import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useMapHash } from "../../hooks/useMapHash";
import { logger } from "../../utils/logger";

/**
 * Component that syncs the map view state with the URL hash.
 * Must be used inside a react-map-gl Map component.
 */
export const MapHashSync = () => {
    const { current: map } = useMap();
    const { updateMapHash, getInitialMapState } = useMapHash();
    const isInitializedRef = useRef(false);
    const hashChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!map) return;

        // Initial setup - apply hash state if present
        if (!isInitializedRef.current) {
            const initialState = getInitialMapState();
            if (window.location.hash) {
                logger.debug('MapHashSync: Applying initial state from hash', initialState);
                map.jumpTo({
                    center: [initialState.center[0], initialState.center[1]],
                    zoom: initialState.zoom,
                });
            }
            isInitializedRef.current = true;
        }

        // Update hash when map moves
        const handleMoveEnd = () => {
            // Clear any pending timeout
            if (hashChangeTimeoutRef.current) {
                clearTimeout(hashChangeTimeoutRef.current);
            }

            // Debounce hash updates
            hashChangeTimeoutRef.current = setTimeout(() => {
                const center = map.getCenter();
                const zoom = map.getZoom();
                updateMapHash(center.lng, center.lat, Math.round(zoom));
                logger.debug('MapHashSync: Updated hash', { lng: center.lng, lat: center.lat, zoom });
            }, 300);
        };

        map.on('moveend', handleMoveEnd);

        // Handle browser back/forward navigation
        const handleHashChange = () => {
            const state = getInitialMapState();
            if (state) {
                logger.debug('MapHashSync: Hash changed, jumping to', state);
                map.jumpTo({
                    center: [state.center[0], state.center[1]],
                    zoom: state.zoom,
                });
            }
        };

        window.addEventListener('hashchange', handleHashChange);

        return () => {
            map.off('moveend', handleMoveEnd);
            window.removeEventListener('hashchange', handleHashChange);
            if (hashChangeTimeoutRef.current) {
                clearTimeout(hashChangeTimeoutRef.current);
            }
        };
    }, [map, updateMapHash, getInitialMapState]);

    return null;
};
