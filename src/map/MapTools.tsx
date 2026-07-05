import { useRef, useState, useCallback } from 'react'
import type MapView from '@arcgis/core/views/MapView'
import Basemap from '@arcgis/core/Basemap'
import { t } from '../i18n/strings'
import { type Locale } from '../i18n/locale'
import '../styles/map-tools.css'

// ─────────────────────────────────────────────────────────────────────────
// Basemap-toggle and fullscreen-toggle buttons. Ported from the ExB
// map-tools widget. Sits to the right of the layers panel.
// ─────────────────────────────────────────────────────────────────────────

// Calcite/ESRI-style 16×16 icons (verbatim from the original map-tools widget).
const basemapSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h6v6H1zm8 0h6v6H9zM1 9h6v6H1zm8 0h6v6H9z"/></svg>'
const fullscreenSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M1 6V1h5v1H2v4zm14 0V2h-4V1h5v5zM6 15H1v-5h1v4h4zm4 0h5v-5h-1v4h-4z"/></svg>'

interface Props {
  view: MapView
  locale: Locale
}

export default function MapTools ({ view, locale }: Props) {
  const [isSatellite, setIsSatellite] = useState(false)
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
        className="map-tool-btn"
        onClick={toggleFullscreen}
        title={t(locale, 'toggleFullscreen')}
      >
        <span dangerouslySetInnerHTML={{ __html: fullscreenSvg }} />
      </button>
    </div>
  )
}
