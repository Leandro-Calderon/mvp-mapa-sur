import { describe, it, expect } from 'vitest';
import { getSuggestions } from './searchSuggest';
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

const buildings: BuildingFeature[] = [
    makeBuilding('Torre', 86),
    makeBuilding('Torre', 8),
    makeBuilding('Bloque', 22),
    makeBuilding('Torre', null),
    makeBuilding('Departamento', 845),
    makeBuilding('Departamento', null),
];

const streets: StreetFeature[] = [
    makeStreet('Pasaje 9'),
    makeStreet('Publica P'),
    makeStreet(''),
];

describe('getSuggestions', () => {
    it('should return an empty list for an empty or whitespace-only query', () => {
        expect(getSuggestions('', 'edificio', buildings, streets)).toEqual([]);
        expect(getSuggestions('   ', 'calle', buildings, streets)).toEqual([]);
    });

    it('should only use Torre/Bloque buildings as candidates for edificio', () => {
        // Query '8' would also match Departamento 845 if the tipo gate were absent
        const results = getSuggestions('8', 'edificio', buildings, streets);

        const values = results.map((s) => s.value);
        expect(values).toEqual(['8', '86']);
        expect(values).not.toContain('845');
        expect(values).not.toContain('22');
    });

    it('should only use Departamento buildings as candidates for departamento', () => {
        const results = getSuggestions('84', 'departamento', buildings, streets);

        expect(results.map((s) => s.value)).toEqual(['845']);
    });

    it('should use plan values as candidates for plan and skip null/empty plans', () => {
        const withPlans: BuildingFeature[] = [
            makeBuilding('Torre', 1, '077'),
            makeBuilding('Torre', 2, '123'),
            makeBuilding('Bloque', 3, '077'),
            makeBuilding('Departamento', 4, ''),
        ];

        const results = getSuggestions('07', 'plan', withPlans, streets);

        expect(results.map((s) => s.value)).toEqual(['077']);
    });

    it('should use street names as candidates for calle and skip empty names', () => {
        const results = getSuggestions('pub', 'calle', buildings, streets);

        expect(results.map((s) => s.value)).toEqual(['Publica P']);
    });

    it('should return distinct values', () => {
        const withDuplicates: BuildingFeature[] = [
            makeBuilding('Torre', 8),
            makeBuilding('Torre', 8),
            makeBuilding('Bloque', 8),
        ];

        const results = getSuggestions('8', 'edificio', withDuplicates, streets);

        expect(results.map((s) => s.value)).toEqual(['8']);
    });

    it('should order prefix matches before other substring matches', () => {
        const mixedStreets: StreetFeature[] = [
            makeStreet('Calle Pasaje 9'),
            makeStreet('Pasaje 2'),
        ];

        const results = getSuggestions('Pasaje', 'calle', buildings, mixedStreets);

        // 'Pasaje 2' starts with the query; 'Calle Pasaje 9' only contains it
        expect(results.map((s) => s.value)).toEqual(['Pasaje 2', 'Calle Pasaje 9']);
    });

    it('should sort within each group ascending, numeric-aware', () => {
        const numericStreets: StreetFeature[] = [
            makeStreet('Pasaje 10'),
            makeStreet('Pasaje 9'),
            makeStreet('Pasaje 2'),
        ];

        const results = getSuggestions('Pasaje', 'calle', buildings, numericStreets);

        // A plain lexicographic sort would yield 10 < 2 < 9
        expect(results.map((s) => s.value)).toEqual([
            'Pasaje 2',
            'Pasaje 9',
            'Pasaje 10',
        ]);
    });

    it('should cap the result list at 7 suggestions', () => {
        const manyStreets: StreetFeature[] = Array.from({ length: 10 }, (_, i) =>
            makeStreet(`Pasaje ${i + 1}`)
        );

        const results = getSuggestions('Pasaje', 'calle', buildings, manyStreets);

        expect(results).toHaveLength(7);
        expect(results.map((s) => s.value)).toEqual([
            'Pasaje 1',
            'Pasaje 2',
            'Pasaje 3',
            'Pasaje 4',
            'Pasaje 5',
            'Pasaje 6',
            'Pasaje 7',
        ]);
    });

    it('should match case-insensitively', () => {
        const results = getSuggestions('PUBLI', 'calle', buildings, streets);

        expect(results.map((s) => s.value)).toEqual(['Publica P']);
    });
});
