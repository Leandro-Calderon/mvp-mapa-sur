import { memo } from 'react';
import type { MapStyleId } from '../../types/map';
import { AVAILABLE_STYLES } from '../../constants/mapStyles';
import styles from './StyleSelector.module.css';

interface StyleSelectorProps {
    currentStyle: MapStyleId;
    onStyleChange: (styleId: MapStyleId) => void;
}

const styleIcons: Record<MapStyleId, string> = {
    liberty: '🗺️',
    dark: '🌙',
    satellite: '🛰️',
};

const styleLabels: Record<MapStyleId, string> = {
    liberty: 'Default',
    dark: 'Dark Mode',
    satellite: 'Satélite',
};

export const StyleSelector = memo(({ currentStyle, onStyleChange }: StyleSelectorProps) => {

    const handleStyleSelect = (styleId: MapStyleId) => {
        onStyleChange(styleId);
    };

    return (
        <div className={styles.selector}>
            {AVAILABLE_STYLES.map((style) => (
                <button
                    key={style.id}
                    className={currentStyle === style.id ? styles.btnActive! : styles.btn!}
                    onClick={() => handleStyleSelect(style.id)}
                    aria-label={`Cambiar estilo a ${styleLabels[style.id]}`}
                >
                    <span className={styles.icon!}>{styleIcons[style.id]}</span>
                    <span>{styleLabels[style.id]}</span>
                </button>
            ))}
        </div>
    );
});

StyleSelector.displayName = 'StyleSelector';
