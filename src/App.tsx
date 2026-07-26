import { useCallback, useState } from 'react'
import MapPanel from './map/MapPanel'
import Sidebar from './calculator/Sidebar'
import Header from './components/Header'
import Dialog from './components/Dialog'
import { INSTRUCTIONS_HTML, ABOUT_HTML } from './components/dialog-content'
import { findLayerByTitle, type WebMapHandle } from './map/useWebMap'
import { SELECTED_LAYER_TITLE } from './map/layers'
import { useLocale } from './i18n/locale'
import { t } from './i18n/strings'

// Top-level layout shell: header + map + calculator sidebar + dialogs.
// Owns the manually-clicked selection set so both MapPanel (which toggles
// on click) and Sidebar (which merges it with filters into the union SQL)
// see the same source of truth.
export default function App () {
  const locale = useLocale()
  const [mapHandle, setMapHandle] = useState<WebMapHandle | null>(null)
  const [oidField, setOidField] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'instructions' | 'about' | null>(null)
  const [manualIds, setManualIds] = useState<Set<number>>(() => new Set())

  const onMapReady = useCallback((h: WebMapHandle, oid: string | null) => {
    setMapHandle(h)
    setOidField(oid)
  }, [])

  const onStreetClick = useCallback((oid: number) => {
    setManualIds(prev => {
      const next = new Set(prev)
      if (next.has(oid)) next.delete(oid)
      else next.add(oid)
      return next
    })
  }, [])

  // Rectangle-select toggles every OID in one batch. If the vast majority
  // of the rectangle's hits are new, we ADD them all; if most are already
  // selected, we REMOVE them all. This matches how single-click toggles
  // one OID and is more useful than per-OID toggling (which would leave
  // half the box selected and half not when you drag over a mixed area).
  const onStreetRectangleSelect = useCallback((oids: number[]) => {
    if (oids.length === 0) return
    setManualIds(prev => {
      const next = new Set(prev)
      const alreadyIn = oids.filter(o => next.has(o)).length
      const shouldRemove = alreadyIn >= oids.length / 2
      for (const oid of oids) {
        if (shouldRemove) next.delete(oid)
        else next.add(oid)
      }
      return next
    })
  }, [])

  const onClearSelection = useCallback(() => {
    setManualIds(new Set())
  }, [])

  // "Select all" queries every OID from the grey base and dumps them into
  // manualIds in one go. Once populated, the union-SQL effect writes
  // `<oidField> IN (…all OIDs…)` to the highlight layer, which is
  // equivalent to selecting every street regardless of the filter. Kept
  // as an explicit user action rather than a "1=1" default so a fresh
  // load stays visually calm.
  const onSelectAll = useCallback(async () => {
    if (!mapHandle?.webmap || !oidField) return
    const base = findLayerByTitle(mapHandle.webmap, SELECTED_LAYER_TITLE)
    if (!base) return
    try {
      const q = base.createQuery()
      q.where = '1=1'
      q.outFields = [oidField]
      q.returnGeometry = false
      const res = await base.queryFeatures(q)
      const oids = new Set<number>()
      for (const f of res.features || []) {
        const oid = f.attributes?.[oidField]
        if (typeof oid === 'number') oids.add(oid)
      }
      setManualIds(oids)
    } catch (_) { /* ignore — button will look inert; user can retry */ }
  }, [mapHandle, oidField])

  return (
    <div className={`app-shell ${locale === 'he' ? 'rtl' : ''}`}>
      <Header
        locale={locale}
        onOpenInstructions={() => setDialog('instructions')}
        onOpenAbout={() => setDialog('about')}
      />
      <main className="app-main">
        <MapPanel
          onReady={onMapReady}
          onStreetClick={onStreetClick}
          onStreetRectangleSelect={onStreetRectangleSelect}
        />
        {mapHandle && (
          <Sidebar
            locale={locale}
            map={mapHandle}
            oidField={oidField}
            manualIds={manualIds}
            onClearSelection={onClearSelection}
            onSelectAll={onSelectAll}
          />
        )}
      </main>

      <Dialog
        open={dialog === 'instructions'}
        title={t(locale, 'instructions')}
        html={INSTRUCTIONS_HTML[locale]}
        locale={locale}
        onClose={() => setDialog(null)}
      />
      <Dialog
        open={dialog === 'about'}
        title={t(locale, 'about')}
        html={ABOUT_HTML[locale]}
        locale={locale}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}
