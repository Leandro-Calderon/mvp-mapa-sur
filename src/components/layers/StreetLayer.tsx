import { StreetsList } from "../StreetsList";

interface StreetLayerProps {
    features: any[];
    isVisible: boolean;
}

export const StreetLayer = ({ features, isVisible }: StreetLayerProps) => {
    if (!isVisible || features.length === 0) {
        return null;
    }

    return <StreetsList features={features} />;
};
