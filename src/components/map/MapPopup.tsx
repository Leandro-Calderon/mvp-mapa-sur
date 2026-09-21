import { Popup } from 'react-map-gl/maplibre';
import type { PopupInfo } from '../../types/map';

interface MapPopupProps {
  popupInfo: PopupInfo;
  onClose: () => void;
}

export const MapPopup = ({ popupInfo, onClose }: MapPopupProps) => (
  <Popup
    longitude={popupInfo.longitude}
    latitude={popupInfo.latitude}
    anchor="bottom"
    onClose={onClose}
    closeOnClick={false}
  >
    <div style={{ padding: '8px', textAlign: 'center' }}>
      {popupInfo.layerId === 'unclustered-point' ? (
        <>
          <h4 style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            color: popupInfo.properties.tipo === 'Bloque' ? '#FF6B6B'
              : popupInfo.properties.tipo === 'Torre' ? '#4ECDC4'
                : '#45B7D1'
          }}>
            {String(popupInfo.properties.tipo)}
          </h4>
          {popupInfo.properties.nombre && (
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Número:</strong> {String(popupInfo.properties.nombre)}
            </p>
          )}
          {popupInfo.properties.plan && (
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong>Plan:</strong> {String(popupInfo.properties.plan)}
            </p>
          )}
        </>
      ) : (
        <>
          <strong>{String(popupInfo.properties.nombre)}</strong>
          <br />
          Tipo: {String(popupInfo.properties.tipo)}
        </>
      )}
    </div>
  </Popup>
);
