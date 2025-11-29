# Funcionalidad Offline - Mapa Sur

## 🚀 Problema Resuelto

La aplicación ahora funciona completamente sin conexión a internet. Los archivos `calles.geojson` y `fonavi.geojson` se guardan en IndexedDB la primera vez que el usuario se conecta, permitiendo el uso offline en lugares remotos sin acceso a red.

## ✅ Características Implementadas

### 📱 Experiencia Usuario

- **Carga automática**: Los datos se descargan y guardan en la primera visita
- **Funcionamiento offline**: Uso completo sin conexión a internet
- **Sincronización automática**: Actualización cuando se restaura la conexión
- **Indicadores visuales**: Estado de conexión y caché siempre visibles

### 🔄 Estrategia de Caché

- **Cache First**: Prioriza datos locales sobre red
- **Datos frescos**: Verificación de timestamps (24h por defecto)
- **Actualización en segundo plano**: No interrumpe la experiencia
- **Fallback inteligente**: Usa datos obsoletos si no hay conexión

### 🛠️ Componentes Técnicos

- **IndexedDB Service**: Almacenamiento local robusto
- **Connection Service**: Detección de estado de red
- **Offline Data Service**: Lógica de caché y sincronización
- **UI Components**: Notificaciones e indicadores

## 📋 Estructura de Archivos

```text
src/
├── services/
│   ├── IndexedDBService.ts      # Manejo de base de datos local
│   ├── ConnectionService.ts      # Detección de conexión
│   └── OfflineDataService.ts    # Servicio con caché offline
├── hooks/
│   ├── useConnectionStatus.ts     # Hook de estado de conexión
│   ├── useDataService.ts         # Hook mejorado con metadatos
│   ├── useBuildingsData.ts      # Hook de edificios actualizado
│   └── useStreetsData.ts       # Hook de calles actualizado
├── components/
│   ├── ConnectionStatus.tsx       # Indicador de conexión
│   └── DataStatusNotification.tsx # Notificaciones de datos
└── docs/
    └── OFFLINE_IMPLEMENTATION.md   # Documentación técnica
```

## 🎯 Flujo de Usuario

### Primera Visita (Online)

1. Usuario abre la aplicación
2. Datos se descargan desde `assets/calles.geojson` y `assets/fonavi.geojson`
3. Datos se guardan en IndexedDB con timestamps
4. Aplicación funciona normalmente

### Uso Offline

1. Usuario abre aplicación sin conexión
2. Sistema detecta estado offline
3. Datos se cargan desde IndexedDB
4. Indicadores muestran "Modo offline"
5. Funcionalidad completa disponible

### Vuelta a Conexión

1. Sistema detecta restauración de conexión
2. Compara timestamps de datos caché vs. servidor
3. Si hay actualizaciones, descarga en segundo plano
4. Actualiza caché y notifica al usuario

## 🔧 Configuración

### Service Worker

Los archivos GeoJSON se cachean con estrategia "Stale While Revalidate":

- **Cache Name**: `geojson-cache`
- **Max Age**: 7 días
- **Max Entries**: 10 archivos
- **Strategy**: `StaleWhileRevalidate`

### IndexedDB

- **Database Name**: `MapaSurDB`
- **Version**: 1
- **Stores**: `geojson_cache`, `sync_status`
- **Max Cache Age**: 24 horas (configurable)

## 📊 Estado de Datos

### Indicadores Visuales

- 🟢 **Online**: Conexión activa y datos frescos
- 🟡 **Offline/Desactualizado**: Sin conexión o datos obsoletos
- 🔴 **Error**: Problemas al cargar datos

### Notificaciones

- **Modo offline**: "Usando datos guardados localmente"
- **Datos desactualizados**: "Mostrando datos en caché. Conéctate para actualizar"
- **Error**: "Error al cargar datos. Verifica tu conexión"

## 🧪 Testing

### Escenarios Probados

1. ✅ Sin conexión inicial
2. ✅ Con conexión → Sin conexión
3. ✅ Sin conexión → Con conexión
4. ✅ Datos obsoletos con conexión
5. ✅ Actualización forzada

### Herramientas de Desarrollo

```bash
# Simular offline en Chrome DevTools
# Network → Offline

# Verificar IndexedDB
# Application → IndexedDB → MapaSurDB

# Forzar actualización
# localStorage.clear() + refresh
```

## 🚀 Beneficios

### Para Usuarios

- **Acceso universal**: Funciona en cualquier lugar, sin importar conexión
- **Experiencia fluida**: Sin interrupciones por falta de red
- **Datos siempre disponibles**: Información crítica accesible offline

### Para Desarrollo

- **Arquitectura escalable**: Fácil de extender para más datos
- **Mantenimiento simple**: Actualizaciones automáticas
- **Debugging friendly**: Herramientas visuales de estado

## 🔮 Futuro

### Próximas Mejoras

- [ ] Background Sync API para actualizaciones más robustas
- [ ] Compresión de datos para reducir almacenamiento
- [ ] Actualizaciones delta (solo cambios)
- [ ] Métricas de uso offline

## 📞 Soporte

Si encuentras problemas:

1. **Verifica consola**: Busca errores de IndexedDB
2. **Limpia caché**: `indexedDB.deleteDatabase('MapaSurDB')`
3. **Contacta desarrollo**: Reporta el escenario específico

---

**Resultado**: La aplicación ahora es completamente funcional offline, resolviendo el problema de acceso a datos en lugares remotos sin conexión a internet.
