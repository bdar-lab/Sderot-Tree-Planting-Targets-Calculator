import { useRef, useState, useCallback, useEffect } from 'react'
import type MapView from '@arcgis/core/views/MapView'
import Basemap from '@arcgis/core/Basemap'
import { t } from '../i18n/strings'
import { type Locale } from '../i18n/locale'
import '../styles/map-tools.css'

// ─────────────────────────────────────────────────────────────────────────
// Basemap-toggle, label-toggle, and fullscreen-toggle buttons. Ported
// from the ExB map-tools widget. Sits to the right of the layers panel.
// ─────────────────────────────────────────────────────────────────────────

// Calcite/ESRI-style 16×16 icons (verbatim from the original map-tools widget).
const basemapSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h6v6H1zm8 0h6v6H9zM1 9h6v6H1zm8 0h6v6H9z"/></svg>'
const fullscreenSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M1 6V1h5v1H2v4zm14 0V2h-4V1h5v5zM6 15H1v-5h1v4h4zm4 0h5v-5h-1v4h-4z"/></svg>'
// Simple "Aa" glyph — a legible letter-based icon reads as "labels" in
// every locale without needing a per-language SVG.
const labelsSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><text x="8" y="12" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold">Aa</text></svg>'

interface Props {
  view: MapView
  locale: Locale
}

export default function MapTools ({ view, locale }: Props) {
  const [isSatellite, setIsSatellite] = useState(false)
  const [labelsHidden, setLabelsHidden] = useState(false)
  const originalBasemap = useRef<Basemap | null>(null)

  const toggleBasemap = useCallback(() => {
    const map = view.map
    if (!map) return
    if (!isSatellite) {
      if (!originalBasemap.current && map.basemap) {
        originalBasemap.current = map.basemap
      }
      map.basemap = Basemap.fromId('satellite')
      setIsSatellite(true)
    } else {
      if (originalBasemap.current) {
        map.basemap = originalBasemap.current
      }
      setIsSatellite(false)
    }
  }, [view, isSatellite])

  const toggleLabels = useCallback(() => {
    setLabelsHidden(v => !v)
  }, [])

  // Apply the label-visibility state to every layer in the current
  // basemap's `referenceLayers` collection. This runs on every basemap
  // swap too so the "labels off" preference survives the satellite
  // toggle (each basemap has its own referenceLayers).
  useEffect(() => {
    const map = view.map
    if (!map) return
    const apply = () => {
      const refs = (map.basemap as any)?.referenceLayers
      if (!refs) return
      refs.forEach((layer: any) => {
        if (layer && 'visible' in layer) layer.visible = !labelsHidden
      })
    }
    apply()
    const handle = (map as any).watch?.('basemap', () => apply())
    return () => handle?.remove?.()
  }, [view, labelsHidden])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [])

  return (
    <div className="map-tools-panel">
      <button
        className={`map-tool-btn ${isSatellite ? 'active' : ''}`}
        onClick={toggleBasemap}
        title={t(locale, 'toggleBasemap')}
      >
        <span dangerouslySetInnerHTML={{ __html: basemapSvg }} />
      </button>
      <button
        className={`map-tool-btn ${labelsHidden ? 'active' : ''}`}
        onClick={toggleLabels}
        title={t(locale, 'toggleLabels')}
      >
        <span dangerouslySetInnerHTML={{ __html: labelsSvg }} />
      </button>
      <button
        className="map-tool-btn"
        onClick={toggleFullscreen}
        title={t(locale, 'toggleFullscreen')}
      >
        <span dangerouslySetInnerHTML={{ __html: fullscreenSvg }} />
      </button>
    </div>
  )
}
