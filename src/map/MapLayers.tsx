import { useEffect, useState } from 'react'
import type WebMap from '@arcgis/core/WebMap'
import type MapView from '@arcgis/core/views/MapView'
import Legend from '@arcgis/core/widgets/Legend'
import { FILTER_DEFINITIONS } from '../calculator/filter-definitions'
import { FILTER_LAYER_MAPPINGS } from './layers'
import { STANDALONE_LAYER_ICONS } from './layer-icons'
import { LAYER_TITLES } from '../i18n/strings'
import { type Locale } from '../i18n/locale'
import '../styles/map-layers.css'

// ─────────────────────────────────────────────────────────────────────────
// Custom layers panel — an exact replica of the original ExB Map Layers
// widget: per-layer custom icon + name + visibility checkbox + legend toggle.
// Driven directly off the WebMap's layers (no ESRI LayerList widget).
// ─────────────────────────────────────────────────────────────────────────

const PNG_BASE = `${import.meta.env.BASE_URL}icons/`

// Build canonical-layer-title → icon HTML.
// 9 attribute layers reuse the filter-bar icons (matched by filter field);
// the 2 non-filter layers use standalone PNGs.
function buildIconMap (): Record<string, string> {
  const map: Record<string, string> = { ...STANDALONE_LAYER_ICONS }
  for (const m of FILTER_LAYER_MAPPINGS) {
    const def = FILTER_DEFINITIONS.find(d => d.field === m.filterField)
    if (!def) continue
    if (def.iconType === 'svg' && def.iconSvg) {
      map[m.layerTitle] = def.iconSvg
    } else if (def.iconType === 'png' && def.iconPng) {
      map[m.layerTitle] = `<img src="${PNG_BASE}${def.iconPng}" style="width:16px;height:16px;" />`
    }
  }
  return map
}
const ICON_MAP = buildIconMap()

interface LayerRow {
  id: string
  /** Canonical English title (stable key). */
  canonical: string
  /** Display title in the current locale. */
  display: string
  visible: boolean
  layer: any
}

interface Props {
  webmap: WebMap
  view: MapView
  locale: Locale
}

export default function MapLayers ({ webmap, view, locale }: Props) {
  const [rows, setRows] = useState<LayerRow[]>([])
  // The layer whose legend pop-out is open, plus the vertical offset of its
  // row so the pop-out lines up with it.
  const [legend, setLegend] = useState<{ id: string; top: number } | null>(null)

  // Build the row list from the web map's operational layers, in reverse
  // draw order (top of panel = top of map stack), matching ESRI LayerList.
  useEffect(() => {
    const collect = () => {
      const out: LayerRow[] = []
      // allLayers is bottom→top; the panel shows top→bottom.
      const layers = webmap.allLayers.toArray().slice().reverse()
      for (const layer of layers as any[]) {
        if (layer.type !== 'feature') continue
        const canonical = (layer.__canonicalTitle as string) || layer.title || ''
        const display = LAYER_TITLES[locale][canonical] || layer.title || canonical
        out.push({
          id: layer.id,
          canonical,
          display,
          visible: layer.visible,
          layer
        })
      }
      setRows(out)
    }
    collect()
    // Re-collect when any layer's visibility changes externally.
    const handles = webmap.allLayers.map((l: any) =>
      l.watch?.('visible', collect)
    ).toArray()
    return () => handles.forEach((h: any) => h?.remove?.())
  }, [webmap, locale])

  const toggleVisible = (row: LayerRow) => {
    row.layer.visible = !row.layer.visible
    setRows(rs => rs.map(r => r.id === row.id ? { ...r, visible: row.layer.visible } : r))
  }

  const legendRow = legend ? rows.find(r => r.id === legend.id) : null

  return (
    <div className="map-layers" dir={locale === 'he' ? 'rtl' : 'ltr'}>
      <ul className="map-layers-list">
        {rows.map(row => (
          <li key={row.id}>
            <div className="map-layers-item">
              <button
                className="map-layers-toggle"
                title={`${row.visible ? 'Hide' : 'Show'} ${row.display}`}
                onClick={() => toggleVisible(row)}
              >
                {/* check-square-f when visible, square when hidden */}
                <span className={row.visible ? 'tick on' : 'tick off'} />
              </button>
              <span
                className="map-layers-icon"
                dangerouslySetInnerHTML={{ __html: ICON_MAP[row.canonical] || '' }}
              />
              <span className="map-layers-name">{row.display}</span>
              <button
                className="map-layers-legend-btn"
                title="Legend"
                disabled={!row.visible}
                onClick={e => {
                  if (legend?.id === row.id) { setLegend(null); return }
                  // Align the pop-out with the clicked row.
                  const item = (e.currentTarget.closest('li') as HTMLElement)
                  const list = item?.parentElement as HTMLElement
                  const top = item && list
                    ? item.offsetTop - list.scrollTop
                    : 0
                  setLegend({ id: row.id, top })
                }}
              >
                ▤
              </button>
            </div>
          </li>
        ))}
      </ul>
      {/* Legend pop-out — floats to the side of the panel. The ESRI Legend
          widget renders the layer name itself, so we don't add our own. */}
      {legend && legendRow && legendRow.visible && (
        <div className="map-layers-legend-popout" style={{ top: legend.top }}>
          <LegendForLayer view={view} layerId={legend.id} locale={locale} />
        </div>
      )}
    </div>
  )
}

// Inline legend for a single layer, rendered via the ESRI Legend widget
// scoped to one layerInfos entry. The layer's renderer labels (class
// breaks, unique values) are shown verbatim as published by the web map.
function LegendForLayer ({ view, layerId, locale }: { view: MapView; layerId: string; locale: Locale }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!el) return
    const layer = (view.map as any).allLayers.find((l: any) => l.id === layerId)
    if (!layer) return
    const legend = new Legend({
      view,
      container: el,
      layerInfos: [{ layer }]
    })
    return () => legend.destroy()
  }, [el, view, layerId, locale])
  return <div ref={setEl} />
}
