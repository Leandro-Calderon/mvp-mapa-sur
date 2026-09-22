import { test, expect } from "@playwright/test";

/**
 * Smoke test for the critical PWA path against the production build served
 * by `vite preview` under the vite base path (see playwright.config.ts):
 *
 *   load -> app shell renders -> map canvas appears -> search pipeline
 *   produces visible feedback -> GPS button is available.
 *
 * Resilience rules (odd/tasks/e2e-smoke-playwright.md):
 * - Never assert on map tiles (network-dependent); canvas existence is enough.
 * - Never click the GPS button (OS-owned permission prompt).
 * - Data-dependent assertions tolerate a data-status error notification if the
 *   GeoJSON fetch fails; the point is that the pipeline ran visibly.
 */
test("happy path: app shell, map canvas, search flow and GPS button", async ({
  page,
}) => {
  await page.goto("/");

  // 1. App shell renders: document title and the search panel (app root UI).
  await expect(page).toHaveTitle(/mvp-mapa-sur/i);
  await expect(page.locator(".search-panel")).toBeVisible();

  // 2. Map canvas appears (MapContainer is lazy-loaded; ignore tiles).
  await expect(
    page.locator(".maplibregl-canvas").first(),
  ).toBeVisible({ timeout: 20_000 });

  // 3. Search flow, the way the UI drives it: the panel starts collapsed,
  // expand it via its header, type a query and submit with Enter.
  // "56" exactly matches a "Bloque" nombre in public/assets/fonavi.geojson
  // (matchesBuildingName is an exact, case-insensitive match).
  const query = "56";
  await page.locator(".search-header").click();
  const input = page.locator("input.search-input");
  await expect(input).toBeVisible();
  await input.fill(query);
  await expect(input).toHaveValue(query);
  await input.press("Enter");

  // 4. Visible feedback that the search pipeline ran. On a successful search
  // the panel auto-collapses and the header preview shows the applied query;
  // with zero matches the panel stays open showing the no-results warning;
  // if the data layer failed, a data-status error notification renders.
  const appliedPreview = page.locator(".search-input-preview", {
    hasText: `Buscando edificio: ${query}`,
  });
  const noResultsWarning = page.locator(".search-feedback.warning");
  const dataError = page.locator(".data-status-notification.error");
  await expect(
    appliedPreview.or(noResultsWarning).or(dataError),
  ).toBeVisible({ timeout: 15_000 });

  // 5. GPS/location button is present and usable (presence only, no click).
  const gpsButton = page.getByRole("button", { name: /activar ubicación/i });
  await expect(gpsButton).toBeVisible();
  await expect(gpsButton).toBeEnabled();
});
