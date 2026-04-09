import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FonaviMarkers } from './FonaviMarkers';
import type { BuildingFeature } from '../types/geojson';

// Mock logger
vi.mock('../utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('FonaviMarkers (deprecated)', () => {
    const mockFeatures: BuildingFeature[] = [
        {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [-60.6393, -32.9468],
            },
            properties: {
                tipo: 'Torre',
                nombre: 1,
                plan: '077',
            },
        },
    ];

    it('should render null (deprecated component)', () => {
        const { container } = render(<FonaviMarkers features={mockFeatures} />);
        expect(container.innerHTML).toBe('');
    });

    it('should render null with empty features', () => {
        const { container } = render(<FonaviMarkers features={[]} />);
        expect(container.innerHTML).toBe('');
    });
});
