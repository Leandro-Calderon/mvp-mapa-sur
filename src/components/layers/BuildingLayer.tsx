import { MarkersList } from "../MarkersList";

interface BuildingLayerProps {
    features: any[];
    isVisible: boolean;
}

export const BuildingLayer = ({ features, isVisible }: BuildingLayerProps) => {
    if (!isVisible || features.length === 0) {
        return null;
    }

    return <MarkersList features={features} />;
};
