import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const MapContext = createContext(null);

export const MapProvider = ({ children, initialState }) => {
    const [mapState, setMapState] = useState(initialState);
    const mapRef = useRef(null);

    const setMapReference = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const value = useMemo(() => ({
        mapState,
        setMapState,
        mapRef,
        setMapReference,
    }), [mapState, setMapReference]);

    return (
        <MapContext.Provider value={value}>
            {children}
        </MapContext.Provider>
    );
};

export const useMapContext = () => {
    const context = useContext(MapContext);

    if (!context) {
        throw new Error("useMapContext must be used within a MapProvider");
    }

    return context;
};
