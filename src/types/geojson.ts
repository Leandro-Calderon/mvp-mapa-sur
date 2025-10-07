// GeoJSON feature types for map data
export interface GeoJsonFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
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
