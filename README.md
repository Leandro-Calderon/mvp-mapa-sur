# Mapa Sur

## Descripción

Mapa Sur es una Aplicación Web Progresiva (PWA) diseñada para funcionar sin conexión en diversas ciudades del sur de la provincia de Santa Fe, Argentina. Su objetivo principal es optimizar la localización de torres y departamentos en grandes complejos habitacionales, abordando el desafío que representa la falta de señalización clara en estas áreas.

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
- **Leaflet:** Biblioteca para mapas interactivos.
- **OpenStreetMap:** Fuente de datos para la cartografía base.
- **KoboToolBox:** Formulario para relevar georeferencias de puntos de interes desde el terreno.
- **QGIS:** Herramienta para la creación y edición de datos geoespaciales.
- **Git:** Sistema de control de versiones.
- **GNU/Linux:** Entorno de desarrollo.

## Instalación

Para clonar y ejecutar este proyecto localmente, sigue estos pasos:

1. **Clona el repositorio:**

    ```bash
    git clone https://github.com/tu-usuario/mvp-mapa-sur.git
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

## Contribuciones

Las contribuciones son bienvenidas. Si deseas colaborar, por favor sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m 'Añade nueva funcionalidad'`).
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE).
