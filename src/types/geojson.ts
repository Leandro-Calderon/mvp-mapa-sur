export interface GeoJsonFeature<T = Record<string, unknown>> {
  type: 'Feature';
  properties: T;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

export interface BuildingFeature extends GeoJsonFeature {
  properties: {
    tipo: string;
    nombre: number;
    plan: string;
    id: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface StreetFeature extends GeoJsonFeature {
  properties: {
    nombre: string;
    tipo: string;
  };
  geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: number[][] | number[][][];
  };
}

export interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}
