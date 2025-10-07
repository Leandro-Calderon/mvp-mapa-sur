import { StreetsList } from "../StreetsList.jsx";

export const StreetLayer = ({ features, isVisible }) => {
    if (!isVisible || features.length === 0) {
        return null;
    }

    return <StreetsList features={features} />;
};
