import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Subir sourcemaps a Sentry sólo cuando el entorno tiene credenciales
// completas (CI con secrets configurados). Sin ellas el build queda
// exactamente como hoy: sin sourcemaps y sin plugin.
const sentryUploadEnabled = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT
);

export default defineConfig({
  base: "/mvp-mapa-sur/",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto", // Cambia esta configuración para asegurarte de que el SW se registre automáticamente en el lugar correcto
      manifest: {
        name: "mvp-mapa-sur",
        short_name: "mapa",
        start_url: "/mvp-mapa-sur",
        scope: "/mvp-mapa-sur",
        id: "/mvp-mapa-sur/",
        lang: "es",
        description:
          "mapa para marcar la geolocalizacion de edificios o viviendas para llegar más rapido",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "./icons/pwa-64x64.png",
            sizes: "64x64",
            type: "any maskable",
          },
          {
            src: "./icons/pwa-144x144.png",
            sizes: "144x144",
            purpose: "any",
          },
          {
            src: "./icons/pwa-192x192.png",
            sizes: "192x192",
            type: "any maskable",
          },
          {
            src: "./icons/pwa-512x512.png",
            sizes: "512x512",
            type: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "./screenshots/screenshot-desktop.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "./screenshots/screenshot-mobile.png",
            sizes: "720x1280",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
      },

      includeAssets: [
        "favicon.svg",
        "favicon.ico",
        "robots.txt",
        "apple-touch-icon.png",
        "manifest.webmanifest"
      ],

      workbox: {
        globDirectory: "dist",
        sourcemap: false, // Desactivado para producción
        globPatterns: ["**/*.{js,css,html}"],
        globIgnores: ["**/node_modules/**/*", "sw.js", "workbox-*.js"],
        // Sin skipWaiting/clientsClaim: con registerType "prompt", el nuevo
        // Service Worker queda esperando hasta que el usuario acepte el
        // banner de actualización antes de activarse.
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        navigateFallback: "/mvp-mapa-sur/index.html", // Ruta fallback en caso de que no se encuentre una ruta
        navigateFallbackAllowlist: [/^\/mvp-mapa-sur\//], // Permitir la ruta "/mapaDPVyU/"
        runtimeCaching: [
          {
            // Estilos y TileJSON de OpenFreeMap: son punteros mutables (el
            // TileJSON apunta a la versión vigente del planeta), así que se
            // sirven al instante desde cache y se refrescan en segundo plano
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/(styles\/[^/]+|planet)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "openfreemap-styles",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              fetchOptions: {
                credentials: "omit",
                mode: "cors",
                cache: "default"
              },
            },
          },
          {
            // Teselas vectoriales (.pbf), glifos, sprites y raster de baja
            // zoom de OpenFreeMap: sus URLs son versionadas/inmutables, por
            // lo que CacheFirst es seguro y da soporte offline real
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/(planet\/.+\.pbf|fonts\/.+\.pbf|sprites\/.+|natural_earth\/.+\.png)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "openfreemap-tiles",
              expiration: {
                maxEntries: 2500,
                maxAgeSeconds: 90 * 24 * 60 * 60, // 90 días
                purgeOnQuotaError: true, // Borrar si se excede el almacenamiento
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              fetchOptions: {
                credentials: "omit", // Don't send credentials to tile servers
                mode: "cors",
                cache: "default"
              },
            },
          },
          {
            // Teselas satelitales raster (Esri World Imagery)
            urlPattern: /^https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/.+/,
            handler: "CacheFirst",
            options: {
              cacheName: "esri-satellite-tiles",
              expiration: {
                maxEntries: 1500,
                maxAgeSeconds: 90 * 24 * 60 * 60, // 90 días
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              fetchOptions: {
                credentials: "omit",
                mode: "cors",
                cache: "default"
              },
            },
          },
          {
            // Datos GeoJSON (edificios/calles): NetworkFirst para que, con
            // conexión, la red siempre gane (datos nuevos apenas se deploya;
            // gracias al ETag la revalidación es sólo headers vía 304). Si la
            // red no responde en 5 segundos o estamos offline, se sirve desde
            // la cache del SW como fallback offline (hasta 30 días)
            urlPattern: /.*\/assets\/.*\.geojson$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "geojson-cache",
              networkTimeoutSeconds: 5, // Caer a la cache del SW si la red se cuelga
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días de fallback offline
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              fetchOptions: {
                credentials: "same-origin",
                mode: "cors",
                cache: "no-cache" // La capa HTTP del navegador también revalida por ETag
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
        navigateFallback: "index.html",
        type: "module",
        suppressWarnings: true,
      },
    }),
    // Pre-generar archivos .br (Brotli) para mejor compresión que gzip (~20% mejor)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240, // Solo comprimir archivos > 10KB
      deleteOriginFile: false, // Mantener originales para fallback
    }),
    // Subir sourcemaps a Sentry asociados al release y borrarlos de dist
    // después del upload (no se publican en GitHub Pages). Debe ir último.
    ...(sentryUploadEnabled
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: process.env.VITE_SENTRY_RELEASE },
            sourcemaps: { filesToDeleteAfterUpload: ["dist/**/*.map"] },
          }),
        ]
      : []),
  ],
  build: {
    outDir: "dist",
    sourcemap: sentryUploadEnabled ? "hidden" : false, // 'hidden' sólo cuando se suben a Sentry
    target: 'es2020', // Navegadores modernos - elimina polyfills legacy (~12 KiB)
    minify: 'terser',
    cssCodeSplit: true, // Habilitar CSS code splitting para cargar MapLibre CSS bajo demanda
    modulePreload: { polyfill: false }, // Deshabilitar polyfill de modulepreload (navegadores modernos no lo necesitan)
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        dead_code: true, // Eliminar código muerto
        unused: true, // Eliminar variables no usadas
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
        passes: 2 // Múltiples pasadas de compresión
      },
      mangle: {
        safari10: false // No necesitamos soporte Safari 10
      }
    },
    rollupOptions: {
      output: {
        // Code splitting mejorado para mejor caching y carga paralela
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'maplibre': ['maplibre-gl'], // Separar MapLibre (~750KB) para carga diferida
          'react-map-gl-vendor': ['react-map-gl/maplibre'], // Separar react-map-gl
        }
      }
    },
    chunkSizeWarningLimit: 500, // Advertir si chunks > 500KB
  },
  css: {
    devSourcemap: true,
  },
  preview: {
    headers: {
      // Cache headers para mejorar Lighthouse score
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  },
});
