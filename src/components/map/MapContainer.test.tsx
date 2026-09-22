import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ForwardedRef, ReactNode } from 'react';
import { render, screen, act } from '@testing-library/react';
import { MapProvider } from '../../context/MapContext';
import { MapContainer } from './MapContainer';
import type { BuildingFeature, StreetFeature } from '../../types/geojson';
import { MAP_STYLES, DEFAULT_STYLE } from '../../constants/mapStyles';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Shared, resettable recording state for the react-map-gl stubs
const mapMocks = vi.hoisted(() => {
    const stubMap = {
        getSource: vi.fn(),
        easeTo: vi.fn(),
        flyTo: vi.fn(),
        fitBounds: vi.fn(),
    };
    const recordedSources: Array<{ id: string; type: string; data: unknown }> = [];
    const recordedLayers: Array<{ id: string; type: string; paint: unknown; filter: unknown }> = [];
    const recordedPopups: Array<{ longitude: number; latitude: number; onClose: () => void }> = [];
    const lastMapProps: { current: Record<string, unknown> | null } = { current: null };
    const reset = (): void => {
        recordedSources.length = 0;
        recordedLayers.length = 0;
        recordedPopups.length = 0;
        lastMapProps.current = null;
        stubMap.getSource.mockClear();
        stubMap.easeTo.mockClear();
        stubMap.flyTo.mockClear();
        stubMap.fitBounds.mockClear();
    };
    return { stubMap, recordedSources, recordedLayers, recordedPopups, lastMapProps, reset };
});

vi.mock('react-map-gl/maplibre', async () => {
    const React = await import('react');
    type StubProps = Record<string, unknown>;

    const Map = React.forwardRef((props: StubProps, ref: ForwardedRef<unknown>) => {
        React.useImperativeHandle(ref, () => ({ getMap: () => mapMocks.stubMap }), []);
        mapMocks.lastMapProps.current = props;
        return React.createElement(
            'div',
            { 'data-testid': 'maplibre-map' },
            props.children as ReactNode,
        );
    });
    Map.displayName = 'MapStub';

    const Source = (props: StubProps) => {
        mapMocks.recordedSources.push({
            id: props.id as string,
            type: props.type as string,
            data: props.data,
        });
        return React.createElement(
            'div',
            { 'data-testid': `source-${String(props.id)}` },
            props.children as ReactNode,
        );
    };

    const Layer = (props: StubProps) => {
        mapMocks.recordedLayers.push({
            id: props.id as string,
            type: props.type as string,
            paint: props.paint,
            filter: props.filter,
        });
        return React.createElement('div', { 'data-testid': `layer-${String(props.id)}` });
    };

    const Popup = (props: StubProps) => {
        mapMocks.recordedPopups.push({
            longitude: props.longitude as number,
            latitude: props.latitude as number,
            onClose: props.onClose as () => void,
        });
        return React.createElement(
            'div',
            {
                'data-testid': 'map-popup',
                'data-longitude': String(props.longitude),
                'data-latitude': String(props.latitude),
            },
            props.children as ReactNode,
        );
    };

    return {
        default: Map,
        Map,
        Source,
        Layer,
        Popup,
        useMap: () => ({ current: mapMocks.stubMap }),
    };
});

// Minimal but real-behaving LngLatBounds (the search-navigation path runs
// `new LngLatBounds()` inside a setTimeout(0), so it must actually work).
vi.mock('maplibre-gl', () => {
    class LngLatBounds {
        private sw: [number, number] | null = null;
        private ne: [number, number] | null = null;

        constructor(...args: unknown[]) {
            if (args.length === 2) {
                this.extend(args[0]);
                this.extend(args[1]);
            }
        }

        extend(coord: unknown): this {
            const point = coord as [number, number];
            const lng = point[0];
            const lat = point[1];
            if (typeof lng !== 'number' || typeof lat !== 'number') {
                return this;
            }
            if (this.sw === null || this.ne === null) {
                this.sw = [lng, lat];
                this.ne = [lng, lat];
            } else {
                this.sw = [Math.min(this.sw[0], lng), Math.min(this.sw[1], lat)];
                this.ne = [Math.max(this.ne[0], lng), Math.max(this.ne[1], lat)];
            }
            return this;
        }

        getCenter(): { lng: number; lat: number } {
            if (this.sw === null || this.ne === null) {
                throw new Error('LngLatBounds is empty');
            }
            return {
                lng: (this.sw[0] + this.ne[0]) / 2,
                lat: (this.sw[1] + this.ne[1]) / 2,
            };
        }

        isEmpty(): boolean {
            return this.sw === null || this.ne === null;
        }
    }

    return { default: { LngLatBounds } };
});

vi.mock('./MapHashSync', () => ({ MapHashSync: () => null }));
vi.mock('./StyleSelector', () => ({ StyleSelector: () => null }));

// ---------------------------------------------------------------------------
// Fixtures and helpers
// ---------------------------------------------------------------------------

const makeBuilding = (index: number): BuildingFeature => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-60.7 - index * 0.001, -33.9 + index * 0.001] },
    properties: { tipo: 'Torre', nombre: 5, plan: '077' },
});

const makeStreet = (): StreetFeature => ({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: [[-60.7, -33.9], [-60.71, -33.92]] },
    properties: { nombre: 'Av Siempreviva', tipo: 'Calle' },
});

interface TestProps {
    filteredBuildings: BuildingFeature[];
    filteredStreets: StreetFeature[];
    showAllLayers: boolean;
    userPosition: [number, number] | null;
    locationAccuracy: number | null;
    locationError: string | null;
    isLocationTracking: boolean;
    searchRevision: number;
    onMapClick?: () => void;
}

const baseProps: TestProps = {
    filteredBuildings: [],
    filteredStreets: [],
    showAllLayers: false,
    userPosition: null,
    locationAccuracy: null,
    locationError: null,
    isLocationTracking: false,
    searchRevision: 0,
};

const renderMap = (props: Partial<TestProps> = {}): void => {
    render(
        <MapProvider initialState={{ center: [-60.5, -33.1], zoom: 13 }}>
            <MapContainer {...baseProps} {...props} />
        </MapProvider>,
    );
};

interface StubClickEvent {
    features?: Array<{
        layer?: { id?: string };
        geometry?: { type?: string; coordinates?: unknown };
        properties?: Record<string, unknown>;
    }>;
    lngLat?: { lng: number; lat: number };
}

type ClickHandler = (evt: StubClickEvent) => void | Promise<void>;

const getOnClick = (): ClickHandler => mapMocks.lastMapProps.current?.onClick as ClickHandler;

const findSource = (id: string): { id: string; type: string; data: unknown } | undefined =>
    mapMocks.recordedSources.find((s) => s.id === id);

const findLayer = (id: string): { id: string; type: string; paint: unknown; filter: unknown } | undefined =>
    mapMocks.recordedLayers.find((l) => l.id === id);

interface GeoJsonData {
    type: string;
    features: Array<{ id: number; properties: Record<string, unknown> }>;
}

// ---------------------------------------------------------------------------
// Tests (assert CURRENT behavior — this is the refactor safety net)
// ---------------------------------------------------------------------------

describe('MapContainer', () => {
    beforeEach(() => {
        mapMocks.reset();
    });

    it('renders building and street sources with geojson data and their layers', () => {
        renderMap({
            filteredBuildings: [makeBuilding(0), makeBuilding(1)],
            filteredStreets: [makeStreet()],
        });

        expect(screen.getByTestId('maplibre-map')).toBeInTheDocument();

        const buildingsSource = findSource('fonavi-buildings');
        expect(buildingsSource).toBeDefined();
        expect(buildingsSource?.type).toBe('geojson');
        const buildingsData = buildingsSource?.data as GeoJsonData;
        expect(buildingsData.type).toBe('FeatureCollection');
        expect(buildingsData.features).toHaveLength(2);
        expect(buildingsData.features[0]).toMatchObject({
            id: 0,
            properties: expect.objectContaining({ tipo: 'Torre', nombre: 5, plan: '077', _id: 0 }),
        });
        expect(buildingsData.features[1]?.properties?._id).toBe(1);

        const streetsSource = findSource('streets');
        expect(streetsSource).toBeDefined();
        expect(streetsSource?.type).toBe('geojson');
        const streetsData = streetsSource?.data as GeoJsonData;
        expect(streetsData.type).toBe('FeatureCollection');
        expect(streetsData.features).toHaveLength(1);
        expect(streetsData.features[0]?.properties).toMatchObject({
            nombre: 'Av Siempreviva',
            tipo: 'Calle',
            _id: 0,
        });

        // Layers rendered in the DOM
        expect(screen.getByTestId('layer-unclustered-point')).toBeInTheDocument();
        expect(screen.getByTestId('layer-street-lines')).toBeInTheDocument();
        expect(screen.getByTestId('layer-street-fills')).toBeInTheDocument();
        expect(screen.getByTestId('layer-street-outlines')).toBeInTheDocument();

        // Exact paints/filters (locked for the structural refactor)
        expect(findLayer('unclustered-point')?.paint).toEqual({
            'circle-color': [
                'match', ['get', 'tipo'],
                'Bloque', '#FF6B6B',
                'Torre', '#4ECDC4',
                'Departamento', '#45B7D1',
                '#95A5A6',
            ],
            'circle-radius': 10,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
        });
        expect(findLayer('street-lines')?.paint).toEqual({
            'line-color': '#00bcd4',
            'line-width': 5,
            'line-opacity': 0.9,
        });
        expect(findLayer('street-lines')?.filter).toEqual([
            'any',
            ['==', ['geometry-type'], 'LineString'],
            ['==', ['geometry-type'], 'MultiLineString'],
        ]);
        expect(findLayer('street-fills')?.paint).toEqual({
            'fill-color': '#3388ff',
            'fill-opacity': 0.4,
            'fill-outline-color': '#0066cc',
        });
        expect(findLayer('street-fills')?.filter).toEqual(['==', ['geometry-type'], 'Polygon']);
        expect(findLayer('street-outlines')?.paint).toEqual({
            'line-color': '#0066cc',
            'line-width': 3,
        });
        expect(findLayer('street-outlines')?.filter).toEqual(['==', ['geometry-type'], 'Polygon']);
    });

    it('renders user location source, dot and accuracy layers and flies to the position when tracking', () => {
        renderMap({ userPosition: [-60.7, -33.9], locationAccuracy: 15, isLocationTracking: true });

        const userSource = findSource('user-location');
        expect(userSource).toBeDefined();
        expect(userSource?.type).toBe('geojson');
        expect(userSource?.data).toEqual({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [-60.7, -33.9] },
                properties: { accuracy: 15 },
            }],
        });
        expect(screen.getByTestId('layer-user-location-accuracy')).toBeInTheDocument();
        expect(screen.getByTestId('layer-user-location-dot')).toBeInTheDocument();
        expect(findLayer('user-location-accuracy')?.paint).toEqual({
            'circle-radius': ['/', 15, 2],
            'circle-color': 'rgba(37, 99, 235, 0.15)',
            'circle-stroke-color': 'rgba(37, 99, 235, 0.3)',
            'circle-stroke-width': 1,
        });
        expect(findLayer('user-location-dot')?.paint).toEqual({
            'circle-radius': 8,
            'circle-color': '#2563eb',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#fff',
        });

        // First position after starting tracking flies to the user
        expect(mapMocks.stubMap.flyTo).toHaveBeenCalledTimes(1);
        expect(mapMocks.stubMap.flyTo).toHaveBeenCalledWith({
            center: [-60.7, -33.9],
            zoom: 17,
            duration: 1500,
        });
    });

    it('does not re-fly when the updated position stays under the re-fly threshold', () => {
        const view = render(
            <MapProvider initialState={{ center: [-60.5, -33.1], zoom: 13 }}>
                <MapContainer {...baseProps} userPosition={[-60.7, -33.9]} isLocationTracking={true} />
            </MapProvider>,
        );
        expect(mapMocks.stubMap.flyTo).toHaveBeenCalledTimes(1);

        // ~11 m north: walking-speed update, below the ~50 m planar threshold
        view.rerender(
            <MapProvider initialState={{ center: [-60.5, -33.1], zoom: 13 }}>
                <MapContainer {...baseProps} userPosition={[-60.7, -33.8999]} isLocationTracking={true} />
            </MapProvider>,
        );
        expect(mapMocks.stubMap.flyTo).toHaveBeenCalledTimes(1);
    });

    it('re-flies when the position jumps beyond the re-fly threshold', () => {
        const view = render(
            <MapProvider initialState={{ center: [-60.5, -33.1], zoom: 13 }}>
                <MapContainer {...baseProps} userPosition={[-60.7, -33.9]} isLocationTracking={true} />
            </MapProvider>,
        );
        expect(mapMocks.stubMap.flyTo).toHaveBeenCalledTimes(1);

        // ~1 km east: coarse seed refined by the accurate watch -> re-fly
        view.rerender(
            <MapProvider initialState={{ center: [-60.5, -33.1], zoom: 13 }}>
                <MapContainer {...baseProps} userPosition={[-60.69, -33.9]} isLocationTracking={true} />
            </MapProvider>,
        );
        expect(mapMocks.stubMap.flyTo).toHaveBeenCalledTimes(2);
        expect(mapMocks.stubMap.flyTo).toHaveBeenLastCalledWith({
            center: [-60.69, -33.9],
            zoom: 17,
            duration: 1500,
        });
    });

    it('does not render user location when tracking is off', () => {
        renderMap({ userPosition: [-60.7, -33.9], isLocationTracking: false });

        expect(findSource('user-location')).toBeUndefined();
        expect(screen.queryByTestId('layer-user-location-dot')).toBeNull();
        expect(mapMocks.stubMap.flyTo).not.toHaveBeenCalled();
    });

    it('renders no sources with empty filtered lists, regardless of showAllLayers', () => {
        // Current behavior: a source is rendered only when its feature list is
        // non-empty; showAllLayers alone does not render empty sources.
        renderMap({ showAllLayers: false });
        expect(mapMocks.recordedSources).toHaveLength(0);

        mapMocks.reset();
        renderMap({ showAllLayers: true });
        expect(mapMocks.recordedSources).toHaveLength(0);

        // With data present, showAllLayers keeps the sources rendered.
        mapMocks.reset();
        renderMap({
            showAllLayers: true,
            filteredBuildings: [makeBuilding(0)],
            filteredStreets: [makeStreet()],
        });
        expect(mapMocks.recordedSources.map((s) => s.id)).toEqual(['fonavi-buildings', 'streets']);
    });

    it('passes interactiveLayerIds, mapStyle and initialViewState to Map', () => {
        renderMap();

        const props = mapMocks.lastMapProps.current;
        expect(props?.interactiveLayerIds).toEqual([
            'unclustered-point',
            'street-lines',
            'street-fills',
        ]);
        expect(props?.mapStyle).toBe(MAP_STYLES[DEFAULT_STYLE].url);
        expect(props?.initialViewState).toMatchObject({
            longitude: -60.5,
            latitude: -33.1,
            zoom: 13,
            bearing: 0,
            pitch: 0,
        });
    });

    it('shows a building popup on unclustered-point click and closes it via onClose', async () => {
        renderMap({ filteredBuildings: [makeBuilding(0)] });

        await act(async () => {
            await getOnClick()({
                features: [{
                    layer: { id: 'unclustered-point' },
                    geometry: { type: 'Point', coordinates: [-60.7, -33.9] },
                    properties: { tipo: 'Torre', nombre: '5', plan: '077' },
                }],
                lngLat: { lng: -60.7, lat: -33.9 },
            });
        });

        const popup = screen.getByTestId('map-popup');
        expect(popup).toHaveAttribute('data-longitude', '-60.7');
        expect(popup).toHaveAttribute('data-latitude', '-33.9');
        expect(popup.textContent).toContain('Torre');
        expect(popup.textContent).toContain('Número:');
        expect(popup.textContent).toContain('5');
        expect(popup.textContent).toContain('Plan:');
        expect(popup.textContent).toContain('077');

        // Popup onClose clears the popup
        await act(async () => {
            mapMocks.recordedPopups[0]?.onClose();
        });
        expect(screen.queryByTestId('map-popup')).toBeNull();
    });

    it('shows a street popup on street-lines click', async () => {
        renderMap({ filteredStreets: [makeStreet()] });

        await act(async () => {
            await getOnClick()({
                features: [{
                    layer: { id: 'street-lines' },
                    geometry: { type: 'LineString', coordinates: [[-60.7, -33.9], [-60.71, -33.92]] },
                    properties: { nombre: 'Av Siempreviva', tipo: 'Calle' },
                }],
                lngLat: { lng: -60.7, lat: -33.9 },
            });
        });

        const popup = screen.getByTestId('map-popup');
        expect(popup).toHaveAttribute('data-longitude', '-60.7');
        expect(popup).toHaveAttribute('data-latitude', '-33.9');
        expect(popup.textContent).toContain('Av Siempreviva');
        expect(popup.textContent).toContain('Tipo: Calle');
    });

    it('clears a previous popup and notifies onMapClick on empty-area click', async () => {
        const onMapClick = vi.fn();
        renderMap({ filteredBuildings: [makeBuilding(0)], onMapClick });

        await act(async () => {
            await getOnClick()({
                features: [{
                    layer: { id: 'unclustered-point' },
                    geometry: { type: 'Point', coordinates: [-60.7, -33.9] },
                    properties: { tipo: 'Torre', nombre: '5', plan: '077' },
                }],
                lngLat: { lng: -60.7, lat: -33.9 },
            });
        });
        expect(screen.getByTestId('map-popup')).toBeInTheDocument();

        await act(async () => {
            await getOnClick()({ features: [], lngLat: { lng: -60.6, lat: -33.8 } });
        });
        expect(screen.queryByTestId('map-popup')).toBeNull();
        expect(onMapClick).toHaveBeenCalledTimes(1);
    });
});
