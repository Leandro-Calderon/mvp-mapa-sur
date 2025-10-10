import { StreetsList } from "../StreetsList";

import type { StreetFeature } from "../../types/geojson";

interface StreetLayerProps {
    features: StreetFeature[];
    isVisible: boolean;
}

export const StreetLayer = ({ features, isVisible }: StreetLayerProps) => {
    if (!isVisible || features.length === 0) {
        return null;
    }

    return <StreetsList features={features} />;
};
