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

  // On first ready: apply the grey renderer to "Selected streets", move it
  // to the bottom of the stack so the shade-index gradient stays visible
  // on top, then hide any layers we don't want on the map.
  useEffect(() => {
    if (!handle.ready || !handle.webmap || initDone.current) return
    const webmap = handle.webmap
    for (const title of FILTERABLE_LAYER_TITLES) findLayerByTitle(webmap, title)
    const selected = findLayerByTitle(webmap, SELECTED_LAYER_TITLE)
    if (selected) {
      selected.opacity = 1.0
      ;(selected as any).renderer = {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [151, 151, 151, 1],
          outline: { color: [80, 80, 80, 1], width: 0.5 }
        }
      }
      webmap.layers.remove(selected as any)
      webmap.layers.add(selected as any, 0)
      selected.visible = true
    }
    const trees = findLayerByTitle(webmap, TREES_LAYER_TITLE)
    if (trees) {
      ;(trees as any).renderer = {
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          color: [76, 175, 80, 0.65],
          outline: { color: [46, 125, 50, 1], width: 0.5 }
        },
        visualVariables: [
          {
            type: 'size',
            field: 'crown_diam',
            valueUnit: 'meters'
          },
          {
            type: 'color',
            field: 'crown_diam',
            stops: [
              { value: 3.999, color: [229, 57, 53, 0.7] },
              { value: 4, color: [76, 175, 80, 0.7] }
            ]
          }
        ]
      }
    }
    webmap.allLayers.forEach((layer: any) => {
      if (!layer || layer.type !== 'feature') return
      const canonical = (layer.__canonicalTitle as string) || layer.title || ''
      layer.visible = canonical === SELECTED_LAYER_TITLE
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
