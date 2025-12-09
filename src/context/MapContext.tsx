import React, { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { MapContextValue, MapState, MapInstance, LngLatArray } from "../types/map";

const MapContext = createContext<MapContextValue | null>(null);

// Default center: Rosario, Santa Fe, Argentina [lng, lat]
const DEFAULT_CENTER: LngLatArray = [-60.66904, -32.93968];
const DEFAULT_ZOOM = 12;

interface MapProviderProps {
  children: ReactNode;
  initialState?: Partial<MapState>;
}

export const MapProvider = ({ children, initialState }: MapProviderProps): React.JSX.Element => {
  const [mapState, setMapState] = useState<MapState>({
    center: initialState?.center ?? DEFAULT_CENTER,
    zoom: initialState?.zoom ?? DEFAULT_ZOOM,
    bearing: initialState?.bearing ?? 0,
    pitch: initialState?.pitch ?? 0,
  });
  const mapRef = useRef<MapInstance | null>(null);

  const setMapReference = useCallback((map: MapInstance) => {
    mapRef.current = map;
  }, []);

  const setMapStateCallback = useCallback((state: Partial<MapState>) => {
    setMapState(prevState => ({ ...prevState, ...state }));
  }, []);

  const value = useMemo((): MapContextValue => ({
    mapState,
    setMapState: setMapStateCallback,
    mapRef,
    setMapReference,
  }), [mapState, setMapReference, setMapStateCallback]);

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = (): MapContextValue => {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }

  return context;
};

// Export defaults for use elsewhere
export { DEFAULT_CENTER, DEFAULT_ZOOM };
