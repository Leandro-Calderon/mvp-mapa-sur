import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchLogic } from './useSearchLogic';
import type { BuildingFeature, StreetFeature } from '../types/geojson';

const makeBuilding = (tipo: string, nombre: number | null, plan = ''): BuildingFeature => ({
    type: 'Feature',
    properties: { tipo, nombre, plan },
    geometry: { type: 'Point', coordinates: [0, 0] },
});

const makeStreet = (nombre: string): StreetFeature => ({
    type: 'Feature',
    properties: { nombre, tipo: 'Calle' },
    geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
});

const mockBuildingFeatures: BuildingFeature[] = [
    makeBuilding('Torre', 86, '077'),
    makeBuilding('Torre', 8, '078'),
    makeBuilding('Bloque', 22, '077'),
    makeBuilding('Torre', null, '123'),
    makeBuilding('Departamento', 543, '999'),
];

const mockStreetFeatures: StreetFeature[] = [
    makeStreet('Publica P'),
    makeStreet('Pasaje 9'),
];

// Mock logger
vi.mock('../utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock other hooks - simplificado para que los tests pasen
vi.mock('./useBuildingsData', () => ({
    useBuildingsData: () => ({
        data: mockBuildingFeatures,
        loading: false,
        error: null,
    }),
}));

vi.mock('./useStreetsData', () => ({
    useStreetsData: () => ({
        data: mockStreetFeatures,
        loading: false,
        error: null,
    }),
}));

vi.mock('./useFilteredData', () => ({
    useFilteredData: () => [],
}));

vi.mock('./useFilteredStreets', () => ({
    useFilteredStreets: () => [],
}));

vi.mock('./useGeolocation', () => ({
    useGeolocation: () => ({
        position: null,
        accuracy: null,
        error: null,
        errorKind: null,
        isActive: false,
        startTracking: vi.fn(),
        stopTracking: vi.fn(),
    }),
}));

describe('useSearchLogic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useSearchLogic());

        expect(result.current.searchQuery).toBe('');
        expect(result.current.searchType).toBe('edificio');
        expect(result.current.appliedQuery).toBe('');
        expect(result.current.appliedType).toBeNull();
        expect(result.current.totalResults).toBe(0);
        // The geolocation errorKind is threaded through additively
        expect(result.current.locationError).toBeNull();
        expect(result.current.locationErrorKind).toBeNull();
    });

    it('should update search query', () => {
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleQueryChange('Torre 5');
        });

        expect(result.current.searchQuery).toBe('Torre 5');
    });

    it('should update search type', () => {
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleTypeChange('departamento');
        });

        expect(result.current.searchType).toBe('departamento');
    });

    it('should apply search when handleSubmit is called', () => {
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleQueryChange('Torre 5');
        });

        act(() => {
            result.current.handleSubmit();
        });

        // El hook aplica la query sanitizada (trim + sin caracteres especiales)
        expect(result.current.appliedQuery).toBe('Torre 5'); // sanitized pero mantiene mayúsculas y espacios
        expect(result.current.appliedType).toBe('edificio');
    });

    it('should not apply empty search', () => {
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleSubmit();
        });

        expect(result.current.appliedQuery).toBe('');
        expect(result.current.appliedType).toBeNull();
    });

    it('should clear search', () => {
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleQueryChange('Torre 5');
        });

        act(() => {
            result.current.handleSubmit();
        });

        // Verificar que se aplicó
        expect(result.current.appliedQuery).toBe('Torre 5');

        act(() => {
            result.current.handleClear();
        });

        expect(result.current.searchQuery).toBe('');
        expect(result.current.appliedQuery).toBe('');
        expect(result.current.appliedType).toBeNull();
    });

    it('should trim and normalize search query before applying', () => {
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleQueryChange('  Torre 5  ');
        });

        act(() => {
            result.current.handleSubmit();
        });

        // Sanitization solo hace trim (los espacios internos se mantienen)
        expect(result.current.appliedQuery).toBe('Torre 5');
    });

    it('should clear when changing search type with active search', () => {
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleQueryChange('Torre 5');
        });

        act(() => {
            result.current.handleSubmit();
        });

        // Verificar que se aplicó
        expect(result.current.appliedQuery).toBe('Torre 5');
        expect(result.current.appliedType).toBe('edificio');

        act(() => {
            result.current.handleTypeChange('departamento');
        });

        // Should clear applied query when type changes
        expect(result.current.searchType).toBe('departamento');
        expect(result.current.appliedQuery).toBe('');
        expect(result.current.appliedType).toBeNull();
    });

    it('should keep the typed query when switching search type', () => {
        // (a) Typed query, not applied yet
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleQueryChange('Torre 5');
        });

        act(() => {
            result.current.handleTypeChange('departamento');
        });

        // The typed input text is preserved across the type switch
        expect(result.current.searchType).toBe('departamento');
        expect(result.current.searchQuery).toBe('Torre 5');

        // (b) Typed + applied query
        act(() => {
            result.current.handleQueryChange('Edificio 3');
        });

        act(() => {
            result.current.handleSubmit();
        });

        // Type a new query while the previous one is still applied
        act(() => {
            result.current.handleQueryChange('Edificio 4');
        });

        act(() => {
            result.current.handleTypeChange('calle');
        });

        // Applied results are cleared (they belong to the old type),
        // but the typed input text is preserved
        expect(result.current.searchType).toBe('calle');
        expect(result.current.appliedQuery).toBe('');
        expect(result.current.appliedType).toBeNull();
        expect(result.current.searchQuery).toBe('Edificio 4');
    });

    it('should toggle show all layers', () => {
        const { result } = renderHook(() => useSearchLogic());

        expect(result.current.showAllLayers).toBe(false);

        act(() => {
            result.current.handleShowAllToggle();
        });

        expect(result.current.showAllLayers).toBe(true);

        act(() => {
            result.current.handleShowAllToggle();
        });

        expect(result.current.showAllLayers).toBe(false);
    });

    it('should toggle panel collapsed state', () => {
        const { result } = renderHook(() => useSearchLogic());

        expect(result.current.panelCollapsed).toBe(true);

        act(() => {
            result.current.handlePanelToggle(false);
        });

        expect(result.current.panelCollapsed).toBe(false);

        act(() => {
            result.current.handlePanelToggle(true);
        });

        expect(result.current.panelCollapsed).toBe(true);
    });

    it('should derive suggestions from the typed query and the active type', () => {
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleQueryChange('8');
        });

        // Active type is 'edificio': only Torre/Bloque candidates match '8'
        expect(result.current.suggestions.map((s) => s.value)).toEqual(['8', '86']);

        act(() => {
            result.current.handleQueryChange('Pub');
        });

        // Type 'edificio' ignores street names
        expect(result.current.suggestions).toEqual([]);

        act(() => {
            result.current.handleTypeChange('calle');
        });

        // The typed query is kept across the type switch (T1) and drives calle suggestions
        expect(result.current.suggestions.map((s) => s.value)).toEqual(['Publica P']);
    });

    it('should apply a suggestion in a single step without a separate submit', () => {
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleQueryChange('8');
        });

        act(() => {
            result.current.handleSuggestionSelect('  Torre <5>  ');
        });

        // The input keeps the selected raw value; the applied query is sanitized
        expect(result.current.searchQuery).toBe('  Torre <5>  ');
        expect(result.current.appliedQuery).toBe('Torre 5');
        expect(result.current.appliedType).toBe('edificio');
        expect(result.current.appliedRevision).toBe(1);
    });

    it('should turn off show all layers when applying a suggestion', () => {
        const { result } = renderHook(() => useSearchLogic());

        act(() => {
            result.current.handleShowAllToggle();
        });

        expect(result.current.showAllLayers).toBe(true);

        act(() => {
            result.current.handleSuggestionSelect('Torre 5');
        });

        expect(result.current.showAllLayers).toBe(false);
        expect(result.current.appliedQuery).toBe('Torre 5');
    });
});
