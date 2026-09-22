# Mapa DPVyU Sur

## Descripción

Esta es una Aplicación Web Progresiva (PWA) diseñada para funcionar sin conexión en diversas ciudades del sur de la provincia de Santa Fe, Argentina. Su objetivo principal es optimizar la localización de torres y departamentos en grandes complejos habitacionales, abordando el desafío que representa la falta de señalización clara en estas áreas.

## Características (Features)

- **Búsqueda Inteligente:** Localiza torres y departamentos de forma rápida y precisa.
- **Funcionamiento Offline:** Accede a los mapas y a la funcionalidad de búsqueda sin necesidad de una conexión a internet.
- **Geolocalización:** Utiliza el GPS del dispositivo para mostrar tu ubicación actual en el mapa.
- **Interfaz Intuitiva:** Diseño simple y fácil de usar para una navegación fluida.
- **Datos Abiertos:** Utiliza cartografía de OpenStreetMap, asegurando el acceso a datos libres y actualizados.

## Tecnologías Utilizadas

Esta PWA fue desarrollada utilizando tecnologías de código abierto:

- **Vite PWA:** Generación de la Progressive Web App.
- **React con TypeScript:** Desarrollo de la interfaz de usuario.
- **MapLibre GL + react-map-gl:** Biblioteca para mapas interactivos.
- **OpenStreetMap / OpenFreeMap:** Cartografía base (estilos vectoriales de OpenFreeMap sobre datos de OpenStreetMap, más imágenes satelitales de Esri World Imagery).
- **KoboToolBox y QGIS:** Pipeline de relevamiento y producción de los datos geoespaciales (relevamiento de georeferencias en terreno y creación/edición de los datasets; no son dependencias de la app en runtime).
- **Git:** Sistema de control de versiones.
- **GNU/Linux:** Entorno de desarrollo.

## Instalación

Para clonar y ejecutar este proyecto localmente, sigue estos pasos:

1. **Clona el repositorio:**

    ```bash
    git clone https://github.com/Leandro-Calderon/mvp-mapa-sur.git
    cd mvp-mapa-sur
    ```

2. **Instala las dependencias:**

    Se recomienda usar `pnpm` como gestor de paquetes.

    ```bash
    pnpm install
    ```

## Uso

Una vez instaladas las dependencias, puedes ejecutar la aplicación en modo de desarrollo o generar una versión de producción.

- **Modo de Desarrollo:**

    ```bash
    pnpm dev
    ```

    Abre [http://localhost:5173](http://localhost:5173) en tu navegador para ver la aplicación.

- **Compilación (Build):**

    ```bash
    pnpm build
    ```

    Este comando genera los archivos estáticos de la aplicación en el directorio `dist/`.

### Comandos

```bash
pnpm dev        # Servidor de desarrollo
pnpm build      # Compilación de producción (dist/)
pnpm test       # Suite de tests
pnpm lint       # ESLint
pnpm typecheck  # Verificación de tipos de TypeScript
```

La integración continua (CI) ejecuta lint, typecheck y tests en cada PR, y gatea el deploy a GitHub Pages.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas colaborar, por favor sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m 'Añade nueva funcionalidad'`).
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Monitoreo de errores (Sentry)

Los errores de producción se reportan a [Sentry](https://sentry.io) de forma opt-in:
si el build no recibe la variable `VITE_SENTRY_DSN`, la aplicación se comporta
exactamente igual que antes de esta integración (sin init del SDK ni tráfico de red).

Para activarlo:

1. Crea una cuenta gratuita en Sentry y un proyecto nuevo con plataforma **React**.
2. Agrega estos secrets del repositorio
   (Settings → Secrets and variables → Actions):
   - `SENTRY_DSN`: el DSN del proyecto (Settings → Client Keys).
   - `SENTRY_AUTH_TOKEN`: un auth token con permisos `org:read` y `project:releases`.
   - `SENTRY_ORG` y `SENTRY_PROJECT`: los slugs de tu organización y tu proyecto.
3. Haz push a `main`. El deploy compila con sourcemaps, los sube a Sentry
   asociados al release `mapa-sur@<versión>+<sha>` y luego los elimina de `dist`,
   así no se publican en GitHub Pages.

Notas de privacidad:

- El DSN es público por diseño: el SDK corre en el navegador y envía los eventos
  por HTTPS al ingest de Sentry (no es un secreto de servidor; su uso queda
  limitado por las cuotas del proyecto).
- La recolección de datos personales está deshabilitada (`sendDefaultPii: false`),
  sin tracing ni grabaciones de sesión: sólo se reportan errores.

## Licencia

Este proyecto está bajo la Licencia [AGPL v3.0.](LICENSE).
