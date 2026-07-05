import { useEffect, useRef, useState } from 'react'
import WebMap from '@arcgis/core/WebMap'
import MapView from '@arcgis/core/views/MapView'
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer'

// ─────────────────────────────────────────────────────────────────────────
// Loads the ArcGIS web map by item id and attaches a MapView to a container.
// Replaces ExB's JimuMapViewComponent / DataSourceManager wiring.
// ─────────────────────────────────────────────────────────────────────────

export const WEBMAP_ITEM_ID = '17f589c1697044828c15af828df0dd27'
export const PORTAL_URL = 'https://technion-gis.maps.arcgis.com'

export interface WebMapHandle {
  /** The live MapView, or null until ready. */
  view: MapView | null
  /** The WebMap instance, or null until ready. */
  webmap: WebMap | null
  /** True once the view and all layers have loaded. */
  ready: boolean
  /** Any load error. */
  error: Error | null
}

/**
 * Hook: create the WebMap + MapView in the given container ref.
 * The container element must be sized by CSS (the view fills it).
 */
export function useWebMap (containerRef: React.RefObject<HTMLDivElement>): WebMapHandle {
  const [handle, setHandle] = useState<WebMapHandle>({
    view: null, webmap: null, ready: false, error: null
  })
  const viewRef = useRef<MapView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    const webmap = new WebMap({
      portalItem: { id: WEBMAP_ITEM_ID, portal: { url: PORTAL_URL } }
    })
    const view = new MapView({
      container: containerRef.current,
      map: webmap
    })
    // Move the default zoom in/out widget to the bottom-right corner of
    // the map area (just inside the calculator sidebar). The map-tools
    // overlay (basemap / fullscreen) sits in the bottom-left corner of the
    // map area instead — see global.css.
    view.ui.move('zoom', 'bottom-right')
    viewRef.current = view

    view.when(
      async () => {
        if (cancelled) return
        // Wait for all layers in the web map to load so titles/queries work.
        try { await webmap.loadAll() } catch (_) { /* some layers may fail */ }
        if (cancelled) return
        setHandle({ view, webmap, ready: true, error: null })
      },
      (err: Error) => {
        if (!cancelled) setHandle({ view: null, webmap: null, ready: false, error: err })
      }
    )

    return () => {
      cancelled = true
      view.destroy()
      viewRef.current = null
    }
    // containerRef is stable; run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return handle
}

/**
 * Find a feature layer by its canonical (English) title.
 *
 * Layer titles get mutated to Hebrew for display (see MapPanel), so we match
 * on a stashed `__canonicalTitle` first. The canonical title is captured the
 * first time a layer is seen under its English name; once stashed, lookups
 * keep working regardless of the current display title.
 */
export function findLayerByTitle (
  webmap: WebMap | null,
  title: string
): FeatureLayer | null {
  if (!webmap) return null
  const found = webmap.allLayers.find((l) => {
    if (l.type !== 'feature') return false
    const canonical = (l as any).__canonicalTitle as string | undefined
    if (canonical) return canonical === title
    if (l.title === title) {
      ;(l as any).__canonicalTitle = title
      return true
    }
    return false
  })
  return (found as FeatureLayer) || null
}
