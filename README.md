# Sderot Tree Planting Targets Calculator

A standalone web app for calculating street-tree planting targets in
Sderot. Adapted from the Tel Aviv-Yafo Tree Planting Targets Calculator
([bdar-lab/Tel-Aviv-Tree-Planting-Targets-Calculator_V2](https://github.com/bdar-lab/Tel-Aviv-Tree-Planting-Targets-Calculator_V2))
with two key differences for Sderot:

- **Two filters only** — Shade Index and Street width. The other eight
  filters (centrality, building density, commercial and public-transport
  proximity) are shown greyed out because the underlying data has not
  been produced for Sderot.
- **Existing trees are counted at Calculate time** by spatially joining
  the SDR tree-trunks layer to the selected street segments (Sderot does
  not ship per-segment tree counts on the street layer).

Live site (once deployed): `https://bdar-lab.github.io/Sderot-Tree-Planting-Targets-Calculator/`

## Stack

- **React 18** + **TypeScript** + **Vite 4**
- **@arcgis/core 4.34** — the ArcGIS Maps SDK for JavaScript (npm, not CDN)
- No backend — a static site. Data comes from public ArcGIS feature services.

## Project layout

```
src/
  main.tsx              React entry
  App.tsx               layout shell: header + map + sidebar + dialogs
  i18n/
    locale.ts            EN/HE locale state (localStorage + events)
    strings.ts           all UI strings, layer titles, site title
  map/
    useWebMap.ts         loads the ArcGIS web map by item id
    layers.ts            filter-field ↔ layer-title mapping
    MapPanel.tsx         hosts the MapView
    MapLayers.tsx        custom layers panel (icons, checkboxes, legend)
    MapTools.tsx         basemap + fullscreen toggles
    layer-icons.ts       standalone layer icon assets
  calculator/
    filter-definitions.ts  the 10 filter definitions + icons
    filter-sql.ts          filter state → SQL WHERE clause
    compute.ts             TCCR / fixed-spacing planting math (pure)
    report.ts              CSV export + printable PDF report
    FilterBar.tsx          icon filter bar + slider popovers
    Calculator.tsx         method / parameters / results panel
    Sidebar.tsx            ties the filter bar + calculator together
  components/
    Header.tsx  LanguageToggle.tsx  Dialog.tsx  dialog-content.ts
  styles/                global + component CSS
public/
  bdar-logo.png          header logo
  icons/                 filter PNG icons
```

## Develop

```sh
npm install
npm run dev          # http://localhost:5173/
```

## Build

```sh
npm run build        # → dist/  (static, ready to deploy)
npm run preview      # preview the production build locally
```

The Vite `base` path defaults to `/Sderot-Tree-Planting-Targets-Calculator/`
for the GitHub Pages project site. `npm run dev` serves from `/`. Override
with the `VITE_BASE` env var for any other host.

## Deploy (GitHub Pages)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the app
and publishes `dist/` to GitHub Pages on every push to `main`. Enable it
once in the repo settings: **Settings → Pages → Source → GitHub Actions**.

## Data sources

- Web map: item `17f589c1697044828c15af828df0dd27` on `Technion-GIS.maps.arcgis.com`
- Street segments: `SDR street summer shade index` (fields `summer_SI`, `width`)
- Tree trunks: `SDR extracted street tree locations 2025` (field `crown_diam`)

All data sources are public; no authentication is required.

## Bilingual

The app is English/Hebrew. Locale is detected from the browser, persisted
in `localStorage` (`bdar.locale`), and switched via the header toggle.
Hebrew text is right-aligned per-component; the overall layout stays LTR.
