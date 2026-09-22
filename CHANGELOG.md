# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases before 1.0.0 were reconstructed retroactively from the commit
history at a milestone grain; individual exploratory commits are not
itemized.

## [Unreleased]

### Planned
- Sentry activation in production (awaiting repo secrets; code is wired
  and DSN-gated).

## [1.0.0] - 2026-09-22

First release with real phone users in production and a hardened
engineering baseline.

### Added
- Production error monitoring via Sentry, gated on `VITE_SENTRY_DSN`:
  privacy-first (no PII, no tracing), sourcemap upload from CI, release
  tagged as `mapa-sur@<version>+<sha>`.
- Playwright smoke E2E test of the critical path (load, map render,
  search pipeline, GPS availability) served from the production build;
  CI deploy now requires it green.
- This changelog and a documented release process.

### Changed
- Geolocation activation collapsed from three sequential GPS
  acquisitions into one chain with a coarse-first probe: the map flies
  to the approximate position in under a second and the dot refines.
- Upgraded to React 19, react-map-gl 8, maplibre-gl 5, Vite 7 and a
  unified toolchain; ESLint flat config with react-hooks enforcement.
- MapContainer decomposed into focused modules (view, controls,
  navigation, layers).

### Fixed
- GeoJSON caching unified under one strategy with ETag revalidation;
  corrected a batch of correctness and hygiene defects.
- Removed dead Leaflet-era marker components, vestigial clustering path
  and dead gate logic.

### Security
- Deploy on GitHub Pages gated on lint, typecheck and tests in CI.

## [0.9.0] - 2025-12-09

### Changed
- Base map switched to vector styles (OpenFreeMap over OpenStreetMap,
  Esri World Imagery for satellite).
- Lighthouse-oriented performance work and chunk optimization.

## [0.8.0] - 2025-12-07

### Added
- First automated test suite.

### Fixed
- Street filtering, flyTo behavior, search panel interactions, "Ver
  Todo" and duplicated GeoJSON features.

### Changed
- Performance and UX/UI pass over search and filtering.

## [0.6.0] - 2025-11-29

### Added
- IndexedDB persistence layer for cached survey data.

### Fixed
- GeoJSON data corrections.

## [0.4.0] - 2025-10-12

### Added
- Geolocation with live position, accuracy popup and PWA runtime
  caching (CacheFirst tiles); AGPL-3.0 license.

### Changed
- Migration from JavaScript to TypeScript; collapsible toolbar;
  separation of responsibilities across components.

## [0.1.0] - 2024-11-21

### Added
- Initial public deployment: React + Vite + MapLibre PWA on GitHub
  Pages with FONAVI building search for the southern Santa Fe
  conurbation.
