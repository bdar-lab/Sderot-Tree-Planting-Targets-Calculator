import { useEffect, useRef, useState } from 'react'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import { useWebMap, findLayerByTitle, type WebMapHandle } from './useWebMap'
import {
  SELECTED_LAYER_TITLE,
  FILTER_LAYER_MAPPINGS,
  FILTERABLE_LAYER_TITLES,
  TREES_LAYER_TITLE,
  SELECTION_HIGHLIGHT_LAYER_TITLE,
  SELECTION_HIGHLIGHT_RENDERER
} from './layers'
import { useLocale } from '../i18n/locale'
import { LAYER_TITLES, t } from '../i18n/strings'
import MapLayers from './MapLayers'
import MapTools from './MapTools'

// ─────────────────────────────────────────────────────────────────────────
// Hosts the ArcGIS MapView plus the custom MapLayers panel. Also owns:
//  - the in-code "Selected streets (highlight)" overlay layer, added on
//    top of the grey base so the current selection can be painted blue;
//  - the map click handler that toggles a street's OID into the parent's
//    manual-selection set.
// Reports the ready WebMapHandle upward so the calculator/filter can
// query layers; also reports the base layer's OID field name so the click
// handler can build valid SQL from clicked features.
// ─────────────────────────────────────────────────────────────────────────

interface Props {
  onReady: (handle: WebMapHandle, oidField: string | null) => void
  onStreetClick: (oid: number) => void
  onStreetRectangleSelect: (oids: number[]) => void
}

export default function MapPanel ({ onReady, onStreetClick, onStreetRectangleSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const rectRef = useRef<HTMLDivElement>(null)
  const handle = useWebMap(mapRef)
  const locale = useLocale()
  const initDone = useRef(false)
  const clickHandlerRef = useRef(onStreetClick)
  clickHandlerRef.current = onStreetClick
  const rectHandlerRef = useRef(onStreetRectangleSelect)
  rectHandlerRef.current = onStreetRectangleSelect
  const oidFieldRef = useRef<string | null>(null)
  const greyBaseRef = useRef<any>(null)

  // Selection-frame state machine:
  //   'idle'       — default. Click on street toggles it; click on empty
  //                  area arms us for rectangle drawing. Drag anywhere pans
  //                  (native map behaviour).
  //   'armed'      — waiting for the first-corner click. A banner tells
  //                  the user what to do next.
  //   'drawing'    — first corner is placed; the pointer sizes the box
  //                  until a second click finishes it. Escape cancels.
  // Ref for handlers, useState for the banner (needs re-render).
  const modeRef = useRef<'idle' | 'armed' | 'drawing'>('idle')
  const [mode, setMode] = useState<'idle' | 'armed' | 'drawing'>('idle')
  const setModeBoth = (m: 'idle' | 'armed' | 'drawing') => {
    modeRef.current = m
    setMode(m)
  }
  const rectStartRef = useRef<{ x: number; y: number } | null>(null)

  // On first ready: apply the grey renderer to "Selected streets", move it
  // to the bottom of the stack so the shade-index gradient stays visible
  // on top, then hide any layers we don't want on the map.
  useEffect(() => {
    if (!handle.ready || !handle.webmap || !handle.view || initDone.current) return
    const webmap = handle.webmap
    const view = handle.view
    for (const title of FILTERABLE_LAYER_TITLES) findLayerByTitle(webmap, title)
    const selected = findLayerByTitle(webmap, SELECTED_LAYER_TITLE)
    if (selected) {
      selected.opacity = 1.0
      // The grey base always shows every polygon — its definitionExpression
      // is left null so it's not narrowed by filters or clicks. The overlay
      // layer created below carries the union clause instead.
      ;(selected as any).definitionExpression = null
      ;(selected as any).renderer = {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          // 35% opaque (65% transparent) so basemap features (street
          // names, road lines) show through the grey canvas.
          color: [151, 151, 151, 0.35],
          outline: { color: [80, 80, 80, 0.6], width: 0.5 }
        }
      }
      webmap.layers.remove(selected as any)
      webmap.layers.add(selected as any, 0)
      selected.visible = true
      greyBaseRef.current = selected
      oidFieldRef.current = (selected as any).objectIdField || null
    }

    // Create the highlight overlay: a second FeatureLayer against the same
    // service URL, painted light-blue, added on top of the stack. This is
    // the layer the filter/click union clause is written to.
    if (selected && (selected as any).url != null) {
      const highlight = new FeatureLayer({
        url: (selected as any).url,
        title: SELECTION_HIGHLIGHT_LAYER_TITLE,
        renderer: SELECTION_HIGHLIGHT_RENDERER as any,
        // Start empty so no features flash on load before the sidebar
        // pushes its first definitionExpression.
        definitionExpression: '1=0',
        listMode: 'hide'
      })
      ;(highlight as any).__canonicalTitle = SELECTION_HIGHLIGHT_LAYER_TITLE
      webmap.layers.add(highlight as any)
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
      // The base + highlight for the selection stay visible; everything
      // else on the web map is hidden by default per the Sderot UX.
      layer.visible =
        canonical === SELECTED_LAYER_TITLE ||
        canonical === SELECTION_HIGHLIGHT_LAYER_TITLE
    })

    // Helper: after the rectangle is finished (second corner clicked),
    // query the grey base for all street OIDs whose geometry intersects
    // the screen bounding box, then hand them off to the parent.
    const finishRectangleAt = async (endX: number, endY: number) => {
      const base = greyBaseRef.current
      const oidField = oidFieldRef.current
      const rectEl = rectRef.current
      const s = rectStartRef.current
      rectStartRef.current = null
      setModeBoth('idle')
      if (rectEl) rectEl.style.display = 'none'
      if (!base || !oidField || !s) return
      const screenLeft = Math.min(s.x, endX)
      const screenTop = Math.min(s.y, endY)
      const screenRight = Math.max(s.x, endX)
      const screenBottom = Math.max(s.y, endY)
      if (screenRight - screenLeft < 4 && screenBottom - screenTop < 4) return
      try {
        const bottomLeft = view.toMap({ x: screenLeft, y: screenBottom })
        const topRight = view.toMap({ x: screenRight, y: screenTop })
        if (!bottomLeft || !topRight) return
        const extent = {
          type: 'extent',
          xmin: Math.min(bottomLeft.x, topRight.x),
          ymin: Math.min(bottomLeft.y, topRight.y),
          xmax: Math.max(bottomLeft.x, topRight.x),
          ymax: Math.max(bottomLeft.y, topRight.y),
          spatialReference: bottomLeft.spatialReference
        }
        const q = base.createQuery()
        q.geometry = extent as any
        q.spatialRelationship = 'intersects'
        q.outFields = [oidField]
        q.returnGeometry = false
        const res = await base.queryFeatures(q)
        const oids: number[] = []
        for (const f of res.features || []) {
          const oid = f.attributes?.[oidField]
          if (typeof oid === 'number') oids.push(oid)
        }
        if (oids.length > 0) rectHandlerRef.current(oids)
      } catch (_) { /* ignore transient query errors */ }
    }

    const cancelRectangle = () => {
      rectStartRef.current = null
      const rectEl = rectRef.current
      if (rectEl) rectEl.style.display = 'none'
      setModeBoth('idle')
    }

    // Unified click handler. Behaviour depends on the mode ref:
    //   idle    + hit street → toggle that OID (single-click selection)
    //   idle    + hit empty  → arm rectangle mode (banner appears)
    //   armed   + any click  → place first corner, enter drawing mode
    //   drawing + any click  → place second corner, finish rectangle
    view.on('click', async (evt: any) => {
      const base = greyBaseRef.current
      const oidField = oidFieldRef.current
      if (!base || !oidField) return

      const currentMode = modeRef.current

      if (currentMode === 'drawing') {
        await finishRectangleAt(evt.x, evt.y)
        return
      }

      if (currentMode === 'armed') {
        rectStartRef.current = { x: evt.x, y: evt.y }
        setModeBoth('drawing')
        return
      }

      // idle: hit-test to decide toggle vs arm.
      try {
        const hit = await view.hitTest(evt, { include: [base] })
        const first = hit.results.find((r: any) => r.type === 'graphic')
        const oid = (first as any)?.graphic?.attributes?.[oidField]
        if (typeof oid === 'number') {
          clickHandlerRef.current(oid)
        } else {
          setModeBoth('armed')
        }
      } catch (_) { /* ignore transient hitTest errors */ }
    })

    // Cursor + rectangle sizing.
    view.on('pointer-move', async (evt: any) => {
      const base = greyBaseRef.current
      if (!base) return
      const el = view.container as HTMLElement | undefined
      const currentMode = modeRef.current

      // While drawing, size the rectangle overlay to track the pointer.
      if (currentMode === 'drawing') {
        const rectEl = rectRef.current
        const s = rectStartRef.current
        if (rectEl && s) {
          const left = Math.min(s.x, evt.x)
          const top = Math.min(s.y, evt.y)
          const width = Math.abs(evt.x - s.x)
          const height = Math.abs(evt.y - s.y)
          rectEl.style.display = 'block'
          rectEl.style.left = `${left}px`
          rectEl.style.top = `${top}px`
          rectEl.style.width = `${width}px`
          rectEl.style.height = `${height}px`
        }
      }

      // Cursor: crosshair while armed/drawing (indicates something special
      // is about to happen); pointer when hovering a street; default
      // otherwise (drag still pans the map).
      if (currentMode === 'armed' || currentMode === 'drawing') {
        if (el) el.style.cursor = 'crosshair'
        return
      }
      try {
        const hit = await view.hitTest(evt, { include: [base] })
        const over = hit.results.some((r: any) => r.type === 'graphic')
        if (el) el.style.cursor = over ? 'pointer' : 'default'
      } catch (_) { /* ignore */ }
    })

    // Escape at any point cancels rectangle mode. Listens on window so
    // the key works no matter where focus currently sits.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modeRef.current !== 'idle') {
        cancelRectangle()
      }
    }
    window.addEventListener('keydown', onKey)
    // No cleanup registered here — MapPanel mounts once for the app's
    // lifetime; the ArcGIS view isn't destroyed until page unload.

    initDone.current = true
    onReady(handle, oidFieldRef.current)
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
      <div ref={mapRef} className="map-view">
        {/* Rectangle-select overlay. Positioned absolutely inside the map
            container, so screen coordinates from pointer-move map directly
            to left/top. Hidden by default; the pointer-move handler
            toggles display and sets left/top/width/height while drawing. */}
        <div
          ref={rectRef}
          style={{
            position: 'absolute',
            display: 'none',
            border: '1.5px dashed rgba(21,101,192,0.9)',
            background: 'rgba(100,181,246,0.18)',
            pointerEvents: 'none',
            zIndex: 5
          }}
        />
        {/* Selection-frame status banner. Only rendered while armed or
            drawing; sits pinned to the top of the map, non-interactive. */}
        {mode !== 'idle' && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '6px 12px',
              background: 'rgba(21,101,192,0.92)',
              color: '#fff',
              fontSize: 12,
              borderRadius: 4,
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              zIndex: 6,
              pointerEvents: 'none',
              direction: locale === 'he' ? 'rtl' : 'ltr'
            }}
          >
            {mode === 'armed'
              ? t(locale, 'selectionFrameArmed')
              : t(locale, 'selectionFrameDrawing')}
          </div>
        )}
      </div>
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
