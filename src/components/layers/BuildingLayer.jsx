import { MarkersList } from "../MarkersList.jsx";

export const BuildingLayer = ({ features, isVisible }) => {
    if (!isVisible || features.length === 0) {
        return null;
    }

    return <MarkersList features={features} />;
};
