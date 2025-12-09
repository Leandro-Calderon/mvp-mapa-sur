import { useState, memo } from 'react';
import type { MapStyleId } from '../../types/map';
import { MAP_STYLES, AVAILABLE_STYLES } from '../../constants/mapStyles';

interface StyleSelectorProps {
    currentStyle: MapStyleId;
    onStyleChange: (styleId: MapStyleId) => void;
}

const styleIcons: Record<MapStyleId, string> = {
    liberty: '🗺️',
    dark: '🌙',
    satellite: '🛰️',
};

export const StyleSelector = memo(({ currentStyle, onStyleChange }: StyleSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleStyleSelect = (styleId: MapStyleId) => {
        onStyleChange(styleId);
        setIsOpen(false);
    };

    return (
        <div className="style-selector" style={{
            position: 'absolute',
            bottom: '120px',
            right: '10px',
            zIndex: 1000,
        }}>
            {/* Toggle button */}
            <button
                onClick={handleToggle}
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                }}
                aria-label="Cambiar estilo del mapa"
                title={`Estilo actual: ${MAP_STYLES[currentStyle].name}`}
            >
                {styleIcons[currentStyle]}
            </button>

            {/* Dropdown menu - opens upward */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '52px',
                    right: '0',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    minWidth: '140px',
                }}>
                    {AVAILABLE_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => handleStyleSelect(style.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '12px 16px',
                                border: 'none',
                                backgroundColor: currentStyle === style.id ? '#f0f0f0' : 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                textAlign: 'left',
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{styleIcons[style.id]}</span>
                            <span>{style.name}</span>
                            {currentStyle === style.id && (
                                <span style={{ marginLeft: 'auto', color: '#4ECDC4' }}>✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
});

StyleSelector.displayName = 'StyleSelector';
