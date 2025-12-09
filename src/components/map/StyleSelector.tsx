import { memo } from 'react';
import type { MapStyleId } from '../../types/map';
import { AVAILABLE_STYLES } from '../../constants/mapStyles';

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
        <div className="style-selector" style={{
            position: 'absolute',
            bottom: '130px', /* Positioned above location button (60px + 56px + gap) */
            right: '16px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        }}>
            {AVAILABLE_STYLES.map((style) => (
                <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style.id)}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: currentStyle === style.id ? '#2563eb' : 'white',
                        color: currentStyle === style.id ? 'white' : '#1f2933',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        minWidth: '110px',
                    }}
                    aria-label={`Cambiar estilo a ${styleLabels[style.id]}`}
                >
                    <span style={{ fontSize: '16px' }}>{styleIcons[style.id]}</span>
                    <span>{styleLabels[style.id]}</span>
                </button>
            ))}
        </div>
    );
});

StyleSelector.displayName = 'StyleSelector';
