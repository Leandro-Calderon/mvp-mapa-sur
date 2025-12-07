import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

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
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        navigateFallback: "/mvp-mapa-sur/index.html", // Ruta fallback en caso de que no se encuentre una ruta
        navigateFallbackAllowlist: [/^\/mvp-mapa-sur\//], // Permitir la ruta "/mapaDPVyU/"
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/\w+\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: {
                maxEntries: 800,
                maxAgeSeconds: 365 * 24 * 60 * 60,
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
            urlPattern: /.*\/assets\/.*\.geojson$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "geojson-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              fetchOptions: {
                credentials: "same-origin",
                mode: "cors",
                cache: "no-cache"
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
  ],
  build: {
    outDir: "dist",
    sourcemap: false, // Desactivado para producción - ahorra ~139 KiB
    target: 'es2020', // Navegadores modernos - elimina polyfills legacy (~12 KiB)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
        passes: 2 // Múltiples pasadas de compresión
      },
      mangle: {
        safari10: false // No necesitamos soporte Safari 10
      }
    },
    rollupOptions: {
      output: {
        // Code splitting para mejor caching y carga paralela
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'leaflet-vendor': ['leaflet', 'react-leaflet'],
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
