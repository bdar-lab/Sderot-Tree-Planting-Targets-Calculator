import { useEffect, useRef } from 'react'
import { useWebMap, findLayerByTitle, type WebMapHandle } from './useWebMap'
import { SELECTED_LAYER_TITLE, FILTER_LAYER_MAPPINGS, FILTERABLE_LAYER_TITLES, TREES_LAYER_TITLE } from './layers'
import { useLocale } from '../i18n/locale'
import { LAYER_TITLES } from '../i18n/strings'
import MapLayers from './MapLayers'
import MapTools from './MapTools'

// ─────────────────────────────────────────────────────────────────────────
// Hosts the ArcGIS MapView plus the custom MapLayers panel (an exact replica
// of the original ExB Map Layers widget). Reports the ready WebMapHandle
// upward so the calculator/filter can query layers.
// ─────────────────────────────────────────────────────────────────────────

interface Props {
  onReady: (handle: WebMapHandle) => void
}

export default function MapPanel ({ onReady }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const handle = useWebMap(mapRef)
  const locale = useLocale()
  const initDone = useRef(false)

  // On first ready: eagerly stash __canonicalTitle on all layers we care
  // about and ensure the "selected streets" layer (in Sderot: the SDR
  // street shade-index layer) is visible. Sderot's shade-index layer ships
  // with its own gradient renderer, so we don't overwrite it here.
  useEffect(() => {
    if (!handle.ready || !handle.webmap || initDone.current) return
    const webmap = handle.webmap
    for (const title of FILTERABLE_LAYER_TITLES) findLayerByTitle(webmap, title)
    const selected = findLayerByTitle(webmap, SELECTED_LAYER_TITLE)
    if (selected) selected.visible = true
    // FILTER_LAYER_MAPPINGS may reference the same layer as SELECTED_LAYER_TITLE
    // (Sderot: yes). Don't hide layers that are also the selected one.
    for (const m of FILTER_LAYER_MAPPINGS) {
      if (m.layerTitle === SELECTED_LAYER_TITLE) continue
      const layer = findLayerByTitle(webmap, m.layerTitle)
      if (layer) layer.visible = false
    }
    const KEEP_VISIBLE = new Set<string>([SELECTED_LAYER_TITLE, TREES_LAYER_TITLE])
    webmap.allLayers.forEach((layer: any) => {
      if (!layer || layer.type !== 'feature') return
      const canonical = (layer.__canonicalTitle as string) || layer.title || ''
      if (!KEEP_VISIBLE.has(canonical)) layer.visible = false
    })
    initDone.current = true
    onReady(handle)
  }, [handle, onReady])

  // Stash __canonicalTitle on every layer (keyed off either language's
  // title), so code-side layer lookups keep working. The MapLayers
  // component handles localized DISPLAY in its own list; we never mutate
  // layer.title here, so the ArcGIS Legend widget shows the title and
  // class labels exactly as published by the web map.
  useEffect(() => {
    if (!handle.webmap) return
    const enDict = LAYER_TITLES.en
    const heDict = LAYER_TITLES.he
    const canonicalOf: Record<string, string> = {}
    Object.keys(enDict).forEach(k => { canonicalOf[enDict[k]] = k; canonicalOf[k] = k })
    Object.keys(heDict).forEach(k => { canonicalOf[heDict[k]] = k })
    handle.webmap.allLayers.forEach((layer: any) => {
      if (!layer || typeof layer.title !== 'string') return
      if (layer.__canonicalTitle) return
      const fromMap = canonicalOf[layer.title.trim()]
      if (fromMap) layer.__canonicalTitle = fromMap
    })
  }, [handle.webmap])

  return (
    <div className="map-panel">
      <div ref={mapRef} className="map-view" />
      {handle.error && (
        <div className="map-error">Failed to load map: {handle.error.message}</div>
      )}
      <div className="map-overlay">
        {handle.ready && handle.webmap && handle.view && (
          <MapLayers webmap={handle.webmap} view={handle.view} locale={locale} />
        )}
      </div>
      {handle.ready && handle.view && (
        <div className="map-tools-overlay">
          <MapTools view={handle.view} locale={locale} />
        </div>
      )}
    </div>
  )
}
