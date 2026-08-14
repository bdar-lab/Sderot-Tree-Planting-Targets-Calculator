import { useCallback, useRef, useState } from 'react'
import MapPanel from './map/MapPanel'
import Sidebar from './calculator/Sidebar'
import Header from './components/Header'
import Dialog from './components/Dialog'
import { INSTRUCTIONS_HTML, ABOUT_HTML } from './components/dialog-content'
import { findLayerByTitle, type WebMapHandle } from './map/useWebMap'
import { SELECTED_LAYER_TITLE } from './map/layers'
import { useLocale } from './i18n/locale'
import { t } from './i18n/strings'
import { type FiltersMap } from './calculator/filter-sql'
import * as SavedSel from './calculator/saved-selections'

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
  // OIDs the user has explicitly de-selected. Subtracted from the union
  // so a click on a filter-matched street can drop it. Reset by Clear
  // Selection and Select All.
  const [removedIds, setRemovedIds] = useState<Set<number>>(() => new Set())
  const [inSelectAllMode, setInSelectAllMode] = useState(false)
  const filtersRef = useRef<FiltersMap | null>(null)
  const restoreFiltersRef = useRef<((f: FiltersMap) => void) | null>(null)
  // Reset-every-filter callback that Sidebar registers on mount so Clear
  // Selection / Select All also wipe active sliders.
  const resetFiltersRef = useRef<(() => void) | null>(null)
  // Mirror of Sidebar's server-queried filter matches so the click
  // handler can decide "is this OID currently selected?".
  const filterMatchesRef = useRef<Set<number>>(new Set())

  const onMapReady = useCallback((h: WebMapHandle, oid: string | null) => {
    setMapHandle(h)
    setOidField(oid)
  }, [])

  const isSelected = useCallback((oid: number): boolean => {
    if (removedIds.has(oid)) return false
    if (manualIds.has(oid)) return true
    return filterMatchesRef.current.has(oid)
  }, [manualIds, removedIds])

  const onStreetClick = useCallback((oid: number) => {
    setInSelectAllMode(false)
    if (isSelected(oid)) {
      setRemovedIds(prev => { const n = new Set(prev); n.add(oid); return n })
      setManualIds(prev => {
        if (!prev.has(oid)) return prev
        const n = new Set(prev); n.delete(oid); return n
      })
    } else {
      setManualIds(prev => { const n = new Set(prev); n.add(oid); return n })
      setRemovedIds(prev => {
        if (!prev.has(oid)) return prev
        const n = new Set(prev); n.delete(oid); return n
      })
    }
  }, [isSelected])

  const onStreetRectangleSelect = useCallback((oids: number[]) => {
    if (oids.length === 0) return
    setInSelectAllMode(false)
    const alreadyIn = oids.filter(o => isSelected(o)).length
    const shouldRemove = alreadyIn >= oids.length / 2
    if (shouldRemove) {
      setRemovedIds(prev => {
        const n = new Set(prev)
        for (const o of oids) n.add(o)
        return n
      })
      setManualIds(prev => {
        const n = new Set(prev)
        for (const o of oids) n.delete(o)
        return n
      })
    } else {
      setManualIds(prev => {
        const n = new Set(prev)
        for (const o of oids) n.add(o)
        return n
      })
      setRemovedIds(prev => {
        const n = new Set(prev)
        for (const o of oids) n.delete(o)
        return n
      })
    }
  }, [isSelected])

  const onClearSelection = useCallback(() => {
    setManualIds(new Set())
    setRemovedIds(new Set())
    setInSelectAllMode(false)
    resetFiltersRef.current?.()
  }, [])

  const onSaveSelection = useCallback((name: string): SavedSel.SavedSelection | null => {
    const filters = filtersRef.current
    if (!filters) return null
    return SavedSel.save(name, manualIds, filters, removedIds)
  }, [manualIds, removedIds])

  const onLoadSelection = useCallback((id: string): SavedSel.SavedSelection | null => {
    const all = SavedSel.loadAll()
    const rec = all.find(s => s.id === id) || null
    if (!rec) return null
    setManualIds(new Set(rec.manualIds))
    setRemovedIds(new Set(rec.removedIds || []))
    setInSelectAllMode(false)
    restoreFiltersRef.current?.(rec.filters)
    return rec
  }, [])

  const onSelectAll = useCallback(async () => {
    if (!mapHandle?.webmap) return
    const base = findLayerByTitle(mapHandle.webmap, SELECTED_LAYER_TITLE)
    if (!base) return
    try {
      const q = base.createQuery()
      q.where = '1=1'
      const oidArr = await (base as any).queryObjectIds(q)
      setManualIds(new Set<number>(oidArr as number[]))
      setRemovedIds(new Set<number>())
      setInSelectAllMode(true)
      resetFiltersRef.current?.()
    } catch (_) { /* ignore */ }
  }, [mapHandle])

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
            removedIds={removedIds}
            onFilterMatchesChange={(s) => { filterMatchesRef.current = s }}
            onClearSelection={onClearSelection}
            onSelectAll={onSelectAll}
            onFiltersChange={(f) => { filtersRef.current = f }}
            registerRestoreFilters={(fn) => { restoreFiltersRef.current = fn }}
            registerResetFilters={(fn) => { resetFiltersRef.current = fn }}
            inSelectAllMode={inSelectAllMode}
            onFilterActivatedWhileAllSelected={() => {
              setManualIds(new Set())
              setRemovedIds(new Set())
              setInSelectAllMode(false)
            }}
            onSaveSelection={onSaveSelection}
            onLoadSelection={onLoadSelection}
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
