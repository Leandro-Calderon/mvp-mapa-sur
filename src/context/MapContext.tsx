import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { MapContextValue, MapState, MapInstance, LatLng, LatLngArray } from "../types/map";

const MapContext = createContext<MapContextValue | null>(null);

interface MapProviderProps {
  children: ReactNode;
  initialState: MapState;
}

export const MapProvider = ({ children, initialState }: MapProviderProps): JSX.Element => {
  const [mapState, setMapState] = useState<MapState>(initialState);
  const mapRef = useRef<MapInstance | null>(null);

  const setMapReference = useCallback((map: MapInstance) => {
    mapRef.current = map;
  }, []);

  const value = useMemo((): MapContextValue => ({
    mapState,
    setMapState: (state: Partial<Omit<MapState, 'center'>> & { center?: LatLng | LatLngArray }) => {
      setMapState(prevState => ({ ...prevState, ...state }));
    },
    mapRef,
    setMapReference,
  }), [mapState, setMapReference]);

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
