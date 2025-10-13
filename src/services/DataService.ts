import type { BuildingFeature, StreetFeature } from '../types/geojson';

export interface DataService {
  loadBuildings(): Promise<BuildingFeature[]>;
  loadStreets(): Promise<StreetFeature[]>;
}

export interface DataServiceResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

/**
 * Concrete implementation of DataService for production use
 */
export class GeoJsonDataService implements DataService {
  private readonly buildingsPath = 'assets/fonavi.geojson';
  private readonly streetsPath = 'assets/calles.geojson';

  private buildResourceUrl(assetPath: string): string {
    const baseUrl = import.meta.env.DEV ? '' : import.meta.env.BASE_URL;
    return `${baseUrl}${assetPath}`;
  }

  async loadBuildings(): Promise<BuildingFeature[]> {
    try {
      const resourceUrl = this.buildResourceUrl(this.buildingsPath);
      const response = await fetch(resourceUrl);

      if (!response.ok) {
        throw new Error(`Failed to load buildings GeoJSON: ${response.status}`);
      }

      const geojson = await response.json();
      return Array.isArray(geojson.features) ? geojson.features : [];
    } catch (error) {
      throw new Error(`Failed to load buildings data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadStreets(): Promise<StreetFeature[]> {
    try {
      const resourceUrl = this.buildResourceUrl(this.streetsPath);
      const response = await fetch(resourceUrl);

      if (!response.ok) {
        throw new Error(`Failed to load streets GeoJSON: ${response.status}`);
      }

      const geojson = await response.json();
      return Array.isArray(geojson.features) ? geojson.features : [];
    } catch (error) {
      throw new Error(`Failed to load streets data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Mock implementation for testing
 */
export class MockDataService implements DataService {
  async loadBuildings(): Promise<BuildingFeature[]> {
    return [
      {
        type: 'Feature',
        properties: {
          tipo: 'Edificio',
          nombre: 1,
          plan: '2021',
          id: 1
        },
        geometry: {
          type: 'Point',
          coordinates: [-32.93968, -60.66904]
        }
      }
    ];
  }

  async loadStreets(): Promise<StreetFeature[]> {
    return [
      {
        type: 'Feature',
        properties: {
          nombre: 'Calle Test',
          tipo: 'Calle'
        },
        geometry: {
          type: 'LineString',
          coordinates: [[-32.93968, -60.66904], [-32.94000, -60.67000]]
        }
      }
    ];
  }
}
