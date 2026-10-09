import { test, expect } from "@playwright/test";

// Explicit viewport pin (native-review advisory R3-viewport-pin): do not rely
// on the playwright.config.ts device descriptor for the desktop regression
// below; pin the desktop layout dimensions for every test in this file.
test.use({ viewport: { width: 1280, height: 720 } });

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
/**
 * Regression for the P0 desktop bug (audit Oct 2025): the >=769px media
 * query in SearchPanel.css used to hide .search-type-row and .layer-btn-row
 * (display:none) while styling replacement classes (.search-type-selector /
 * .layer-toggle) that were never rendered, so desktop users could not change
 * the search type or use "Ver Todo". Both controls must stay visible and
 * usable at the desktop viewport (pinned above: 1280x720).
 */
test("desktop viewport: search type buttons and Ver Todo stay visible and usable", async ({
  page,
}) => {
  await page.goto("/");

  // Expand the panel the way the UI drives it (starts collapsed).
  await page.locator(".search-header").click();

  const edificio = page.getByRole("button", { name: /edificio/i });
  const calle = page.getByRole("button", { name: /calle/i });
  await expect(edificio).toBeVisible();
  await expect(calle).toBeVisible();

  const verTodo = page.getByRole("button", { name: /ver todo/i });
  await expect(verTodo).toBeVisible();
  await expect(verTodo).toBeEnabled();

  // Changing the search type from the desktop viewport must work end to end:
  // the input placeholder follows the newly selected type. Exact string must
  // match `placeholders.calle` in src/components/SearchPanel.tsx
  // (native-review advisory R3-placeholder-contrast).
  await calle.click();
  const input = page.locator("input.search-input");
  await expect(input).toBeVisible();
  await expect(input).toHaveAttribute(
    "placeholder",
    "Ej: Publica P, Pasaje 2...",
  );

  // "Ver Todo" must be usable end to end (advisory R3-vertodo-usability):
  // clicking it activates the show-all state and auto-collapses the panel so
  // the map becomes visible.
  const panel = page.locator(".search-panel");
  await verTodo.click();
  await expect(panel).toHaveClass(/collapsed/);
  await expect(verTodo).toHaveClass(/active/);

  // Re-expanding the panel must not reset the show-all state: the button
  // keeps its active class across collapse cycles. Bounded check — toggling
  // the show-all state back off is intentionally out of scope here.
  await page.locator(".search-header").click();
  await expect(panel).not.toHaveClass(/collapsed/);
  await expect(page.locator(".layer-btn.active")).toBeVisible();
});

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

test("autocomplete: typed query lists suggestions and Enter applies the pick", async ({
  page,
}) => {
  await page.goto("/");

  // Expand the panel and focus the input while it is still empty (the
  // suggestion list stays closed until suggestions exist).
  await page.locator(".search-header").click();
  const input = page.locator("input.search-input");
  await expect(input).toBeVisible();
  await input.click();

  // "56" matches a "Bloque" nombre in public/assets/fonavi.geojson (see the
  // happy-path test), so as-you-type suggestions must be derivable from it.
  // Typing opens the listbox on its own (no ArrowDown needed).
  await input.fill("56");
  await expect(
    page.getByRole("option", { name: "56", exact: true }).first(),
  ).toBeVisible();

  // ArrowDown highlights the first option; Enter applies the highlighted
  // suggestion as a search. Visible feedback follows the same tolerant
  // pattern as the happy-path test: applied-search preview, or the no-results
  // warning, or a data-status error notification if the GeoJSON fetch failed.
  await input.press("ArrowDown");
  await input.press("Enter");
  const appliedPreview = page.locator(".search-input-preview", {
    hasText: "Buscando edificio: 56",
  });
  const noResultsWarning = page.locator(".search-feedback.warning");
  const dataError = page.locator(".data-status-notification.error");
  await expect(
    appliedPreview.or(noResultsWarning).or(dataError),
  ).toBeVisible({ timeout: 15_000 });
});

test("type switch keeps the typed query in the input", async ({ page }) => {
  await page.goto("/");

  await page.locator(".search-header").click();
  const input = page.locator("input.search-input");
  await expect(input).toBeVisible();
  await input.fill("56");

  await page.getByRole("button", { name: /departamento/i }).click();

  // T1 regression guard: switching the search type must not clear the typed
  // query. Only the placeholder follows the newly selected type (exact
  // string from `placeholders.departamento` in SearchPanel.tsx).
  await expect(input).toHaveValue("56");
  await expect(input).toHaveAttribute(
    "placeholder",
    "Ej: 543, 204, 15...",
  );
});

test("first run: idle panel shows the empty-state note until the user types", async ({
  page,
}) => {
  await page.goto("/");

  // Fresh load, panel expanded, no typed or applied query: the first-run
  // guidance note is visible (T3).
  await page.locator(".search-header").click();
  const note = page.getByRole("note");
  await expect(note).toBeVisible();
  await expect(note).toContainText("Buscá en el barrio");

  // Typing a single character leaves the idle state and removes the note.
  const input = page.locator("input.search-input");
  await input.click();
  await input.pressSequentially("5");
  await expect(note).not.toBeVisible();
});
