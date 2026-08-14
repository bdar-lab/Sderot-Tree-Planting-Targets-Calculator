import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { findLayerByTitle, type WebMapHandle } from '../map/useWebMap'
import {
  SELECTED_LAYER_TITLE,
  KNOWN_FILTER_FIELDS
} from '../map/layers'
import { FILTER_DEFINITIONS } from './filter-definitions'
import {
  type FiltersMap, buildCombinedSql, createInitialFilters, parseFilterClauses
} from './filter-sql'
import { t } from '../i18n/strings'
import { type Locale } from '../i18n/locale'
import type { SavedSelection } from './saved-selections'
import FilterBar from './FilterBar'
import Calculator from './Calculator'

// ─────────────────────────────────────────────────────────────────────────
// The unified sidebar: filter bar on top, calculator below. Owns the filter
// state, computes the UNION of filter clauses and manually-clicked OIDs,
// pushes that union into the highlight overlay's definitionExpression, and
// polls the live segment count.
//
// The grey "Selected streets" base layer keeps all polygons visible so the
// user always sees where they can click; the highlight overlay carries the
// blue selection paint driven by the union clause.
// ─────────────────────────────────────────────────────────────────────────

interface Props {
  locale: Locale
  map: WebMapHandle
  /** OID field name for the street-segment feature service, discovered in
   *  MapPanel. Null until the layer's metadata has loaded — when null, the
   *  click set can't be turned into SQL and we fall back to filter-only. */
  oidField: string | null
  /** Manually-clicked street OIDs. Owned by App so both this sidebar and
   *  MapPanel's click handler see the same source of truth. */
  manualIds: Set<number>
  /** OIDs the user has explicitly de-selected. Subtracted from the union
   *  regardless of source — the only way filter-matched streets can be
   *  dropped. */
  removedIds: Set<number>
  /** Fires whenever the server-queried filter-match set updates so App's
   *  click handler can tell if a given OID is currently in the union. */
  onFilterMatchesChange: (matches: Set<number>) => void
  /** Clears manual + removed sets; filters are NOT touched. */
  onClearSelection: () => void
  /** Queries every street OID and adds them all to the selection at once. */
  onSelectAll: () => void
  /** Fires on every filter change so App can snapshot the current state
   *  when the user saves a named selection. */
  onFiltersChange: (filters: FiltersMap) => void
  /** App calls this once on mount to hand over a "here's how you restore
   *  filters" callback, which loadSelection invokes. */
  registerRestoreFilters: (restore: (filters: FiltersMap) => void) => void
  /** Reset-every-filter callback invoked by Clear Selection / Select All
   *  so those actions wipe the sliders too. */
  registerResetFilters: (reset: () => void) => void
  /** True when App is in "everything selected" mode via Select All. */
  inSelectAllMode: boolean
  /** Fired the first time a filter transitions to active while
   *  inSelectAllMode is true. */
  onFilterActivatedWhileAllSelected: () => void
  /** Persist the current (manualIds + filters) snapshot under a name. */
  onSaveSelection: (name: string) => SavedSelection | null
  /** Load a saved snapshot by id — App applies it to manualIds + filters. */
  onLoadSelection: (id: string) => SavedSelection | null
}

export default function Sidebar ({
  locale, map, oidField, manualIds, removedIds, onFilterMatchesChange,
  onClearSelection, onSelectAll, onFiltersChange, registerRestoreFilters,
  registerResetFilters, inSelectAllMode, onFilterActivatedWhileAllSelected,
  onSaveSelection, onLoadSelection
}: Props) {
  const [filters, setFilters] = useState<FiltersMap>(createInitialFilters)
  const [loading, setLoading] = useState(false)
  // Displayed status text under the header. Normally reflects the current
  // union OID count; Calculator temporarily overrides it during Calculate
  // ("Fetching…", "No records found", etc.), then the effect below
  // restores it once loading finishes.
  const [segmentCountText, setSegmentCountText] = useState('')
  // OIDs matched by the current filter clauses, queried from the server
  // exactly once per filter change. Kept out of React state so that pure
  // click bursts (which don't change filterSql) never trigger a re-query.
  const filterMatchIdsRef = useRef<Set<number>>(new Set())
  const [filterSqlSnapshot, setFilterSqlSnapshot] = useState<string>('1=1')

  // Keep App's filters ref in sync so it can snapshot on save.
  useEffect(() => { onFiltersChange(filters) }, [filters, onFiltersChange])

  // Hand App a stable "how to restore filters" callback exactly once.
  useEffect(() => {
    registerRestoreFilters((f) => setFilters(f))
  }, [registerRestoreFilters])

  // And a stable "reset every filter" callback for Clear Selection /
  // Select All to invoke.
  useEffect(() => {
    registerResetFilters(() => setFilters(createInitialFilters()))
  }, [registerResetFilters])

  // Recompute the filter SQL from `filters` and, if it actually changed,
  // query the server for the OID set that matches it. This is the only
  // place we still hit the server for selection state; the result is
  // cached until the user moves a slider.
  useEffect(() => {
    if (!map.ready || !map.webmap || !oidField) return
    const rawFilterSql = buildCombinedSql(filters)
    const clauses = [...parseFilterClauses(rawFilterSql, KNOWN_FILTER_FIELDS).values()]
    const filterSql = clauses.length > 0 ? clauses.join(' AND ') : '1=1'
    // Only rerun when the SQL actually changes. The snapshot is bumped
    // AFTER the async query completes, not before — bumping synchronously
    // would re-fire this effect, its cleanup would flip `cancelled=true`,
    // and the resolution would be silently discarded.
    if (filterSql === filterSqlSnapshot) return
    if (filterSql === '1=1') {
      filterMatchIdsRef.current = new Set()
      onFilterMatchesChange(filterMatchIdsRef.current)
      setFilterSqlSnapshot(filterSql)
      return
    }
    const base = findLayerByTitle(map.webmap, SELECTED_LAYER_TITLE)
    if (!base) return
    let cancelled = false
    ;(async () => {
      try {
        // queryObjectIds gets every matching OID in one call, bypassing
        // the service's per-request maxRecordCount (default 2000).
        const q = base.createQuery()
        q.where = filterSql
        const raw = await (base as any).queryObjectIds(q)
        const oidArr: number[] = Array.isArray(raw)
          ? raw
          : (raw?.objectIds as number[] | undefined) || []
        if (cancelled) return
        filterMatchIdsRef.current = new Set<number>(oidArr)
        onFilterMatchesChange(filterMatchIdsRef.current)
        setFilterSqlSnapshot(filterSql)
      } catch (_) { /* leave stale cache; visualization won't update */ }
    })()
    return () => { cancelled = true }
  }, [filters, oidField, map.ready, map.webmap, filterSqlSnapshot])

  // Union set = (filter matches ∪ manually-clicked OIDs) \ removed OIDs.
  // Removals win over both sources so a single click can de-select a
  // street the filter is still matching.
  const unionOids = useMemo<number[]>(() => {
    const s = new Set<number>(filterMatchIdsRef.current)
    manualIds.forEach(o => s.add(o))
    removedIds.forEach(o => s.delete(o))
    return [...s]
    // filterSqlSnapshot is included so this recomputes when the async
    // query above finishes and bumps the snapshot.
  }, [manualIds, removedIds, filterSqlSnapshot])

  // Push the union OID list into the highlight + shade-index LayerViews
  // as a client-side filter. This is what makes rectangle-select feel
  // instant: no server round-trip, just a re-paint of features that are
  // already loaded on the client.
  //
  // Gotcha: FeatureFilter treats { objectIds: [] } the same as "no
  // filter" and paints ALL features — the opposite of what we want when
  // the selection is empty. Use `where: '1=0'` in that case to reliably
  // paint nothing.
  useEffect(() => {
    if (!map.ready) return
    const hlv = map.highlightLayerView
    const shadeLvs = map.shadeLayerViews || []
    const spec = unionOids.length === 0
      ? { where: '1=0' }
      : { objectIds: unionOids }
    if (hlv) hlv.filter = spec
    for (const lv of shadeLvs) lv.filter = spec
  }, [unionOids, map])

  // Push the derived count into the display text whenever the union
  // changes or locale flips. During a Calculate run Calculator overrides
  // this transiently via setSegmentCountText; once loading returns to
  // false the effect re-syncs to the truth.
  useEffect(() => {
    if (loading) return
    setSegmentCountText(t(locale, 'streetSegmentsSelected', { n: unionOids.length.toLocaleString() }))
  }, [unionOids, locale, loading])

  const handleUpdateValue = useCallback((field: string, value: number | [number, number]) => {
    setFilters(prev => ({ ...prev, [field]: { ...prev[field], value } }))
  }, [])

  const handleToggle = useCallback((field: string) => {
    setFilters(prev => {
      const state = prev[field]
      if (state?.active) {
        const def = FILTER_DEFINITIONS.find(d => d.field === field)
        return { ...prev, [field]: { active: false, value: def?.defaultValue ?? 0 } }
      }
      // Filter going from inactive to active: if App is in Select All
      // mode, tell it to drop the "everything" baseline so the filter
      // narrows instead of unioning to a no-op.
      if (inSelectAllMode) onFilterActivatedWhileAllSelected()
      return { ...prev, [field]: { ...prev[field], active: true } }
    })
  }, [inSelectAllMode, onFilterActivatedWhileAllSelected])

  const handleReset = useCallback(() => setFilters(createInitialFilters()), [])

  // Calculator queries the grey base (that's the layer with the real
  // attributes + geometry). The highlight overlay is purely a paint layer
  // now — we don't touch its definitionExpression any more.
  const selectedLayer = map.webmap
    ? findLayerByTitle(map.webmap, SELECTED_LAYER_TITLE)
    : null

  return (
    <aside className="sidebar">
      <FilterBar
        filters={filters}
        locale={locale}
        onUpdateValue={handleUpdateValue}
        onToggle={handleToggle}
        onReset={handleReset}
        onClearSelection={onClearSelection}
        clearSelectionEnabled={manualIds.size > 0}
        onSelectAll={onSelectAll}
        selectAllEnabled={!!oidField}
        onSaveSelection={onSaveSelection}
        onLoadSelection={onLoadSelection}
        saveSelectionEnabled={unionOids.length > 0}
      />
      <Calculator
        locale={locale}
        selectedLayer={selectedLayer}
        unionOids={unionOids}
        oidField={oidField}
        filterDescriptionSql={filterSqlSnapshot.trim()}
        view={map.view}
        map={map}
        segmentCountText={segmentCountText}
        onLoadingChange={setLoading}
        setSegmentCountText={setSegmentCountText}
      />
    </aside>
  )
}

