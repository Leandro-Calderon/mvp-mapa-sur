import React from "react";
import { FeatureGroup, Polyline, Popup } from "react-leaflet";
import type { StreetFeature } from "../types/geojson";

interface streetsListProps {
  features: StreetFeature[];
}

/**
 * Component to render street GeoJSON LineStrings with popups
 * @param features - Array of GeoJSON features with LineString geometry
 */
export const StreetsList = ({ features }: streetsListProps) => {

  return (
    <FeatureGroup>
      {features.map((feature, index) => {
        const isLngLatPair = (value: unknown): value is [number, number] => {
          return Array.isArray(value) &&
            value.length === 2 &&
            typeof value[0] === "number" &&
            typeof value[1] === "number";
        };

        const isLineStringCoordinates = (
          value: unknown,
        ): value is [number, number][] => {
          return Array.isArray(value) &&
            value.length > 0 &&
            value.every(isLngLatPair);
        };

        const isMultiLineStringCoordinates = (
          value: unknown,
        ): value is [number, number][][] => {
          return Array.isArray(value) &&
            value.length > 0 &&
            value.every(isLineStringCoordinates);
        };

        // Handle both LineString (number[][]) and MultiLineString (number[][][]) coordinates
        const coordinates = feature.geometry.coordinates;

        let lineStrings: [number, number][][] | null = null;

        if (feature.geometry.type === "LineString" &&
          isLineStringCoordinates(coordinates)) {
          lineStrings = [coordinates];
        } else if (feature.geometry.type === "MultiLineString" &&
          isMultiLineStringCoordinates(coordinates)) {
          lineStrings = coordinates;
        }

        if (!lineStrings) {
          return null;
        }

        // Convert all coordinates from [lng, lat] to [lat, lng] for Leaflet
        const leafletPositions = lineStrings.map((lineString) =>
          lineString.map(([lng, lat]) => [lat, lng] as [number, number]),
        );
        return (
          <Polyline
            key={index}
            positions={leafletPositions as [number, number][][]}
            pathOptions={{
              color: "cyan",
              weight: 5,
              opacity: 1,
            }}
          >
            <Popup>
              <strong>{feature.properties.nombre}</strong>
              <br />
              Tipo: {feature.properties.tipo}
            </Popup>
          </Polyline>
        );
      })}
    </FeatureGroup>
  );
};
