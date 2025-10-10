import { MarkersList } from "../MarkersList";

import type { BuildingFeature } from "../../types/geojson";

interface BuildingLayerProps {
    features: BuildingFeature[];
    isVisible: boolean;
}

export const BuildingLayer = ({ features, isVisible }: BuildingLayerProps) => {
    if (!isVisible || features.length === 0) {
        return null;
    }

    return <MarkersList features={features} />;
};
