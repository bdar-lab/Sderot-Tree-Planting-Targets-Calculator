import { useCallback, useEffect, useRef, useState } from 'react'
import { findLayerByTitle, type WebMapHandle } from '../map/useWebMap'
import {
  SELECTION_HIGHLIGHT_LAYER_TITLE,
  FILTER_LAYER_MAPPINGS,
  KNOWN_FILTER_FIELDS
} from '../map/layers'
import { FILTER_DEFINITIONS } from './filter-definitions'
import {
  type FiltersMap, buildCombinedSql, createInitialFilters, parseFilterClauses
} from './filter-sql'
import { t } from '../i18n/strings'
import { type Locale } from '../i18n/locale'
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
  /** Clears every manually-clicked OID; filters are NOT touched. */
  onClearSelection: () => void
  /** Queries every street OID and adds them all to the selection at once. */
  onSelectAll: () => void
}

export default function Sidebar ({
  locale, map, oidField, manualIds, onClearSelection, onSelectAll
}: Props) {
  const [filters, setFilters] = useState<FiltersMap>(createInitialFilters)
  const [segmentCountText, setSegmentCountText] = useState('')
  const [loading, setLoading] = useState(false)
  const prevSqlRef = useRef<string>('')
  const expectedSqlRef = useRef<string>('1=0')

  // Push the UNION of filter clauses + manually-clicked OIDs into the
  // highlight overlay's definitionExpression. Filter layers (e.g. the
  // Shade Index visualization) still get the raw filter SQL so their
  // gradient narrows to the filtered subset — that layer is separate from
  // the selection concept.
  useEffect(() => {
    if (!map.ready || !map.webmap) return
    const rawFilterSql = buildCombinedSql(filters)
    const clauses = [...parseFilterClauses(rawFilterSql, KNOWN_FILTER_FIELDS).values()]
    const filterSql = clauses.length > 0 ? clauses.join(' AND ') : '1=1'

    // Build the click clause. Skip it if OID discovery hasn't finished yet
    // OR the set is empty — either way, filter alone drives the selection.
    const clicksSql = (oidField && manualIds.size > 0)
      ? `${oidField} IN (${[...manualIds].join(',')})`
      : null

    // Union rules:
    //   - both empty              → '1=0' (highlight overlay shows nothing)
    //   - filter only             → filterSql
    //   - clicks only             → clicksSql
    //   - both present            → (filterSql) OR clicksSql
    //   Note: filter '1=1' means "no active sliders". In that case we
    //   want the OVERLAY to also be empty until the user actually picks
    //   something — otherwise the entire map would flash blue on load.
    let combined: string
    if (filterSql === '1=1' && !clicksSql) combined = '1=0'
    else if (filterSql === '1=1' && clicksSql) combined = clicksSql
    else if (!clicksSql) combined = filterSql
    else combined = `(${filterSql}) OR ${clicksSql}`

    if (combined === prevSqlRef.current) return
    prevSqlRef.current = combined
    expectedSqlRef.current = combined

    // Filter visualization layers (e.g. the Shade Index gradient) get the
    // full union too — the gradient should reveal exactly the same street
    // set that's painted blue on the highlight overlay, so manual clicks
    // outside the filter still show their shade colour.
    for (const m of FILTER_LAYER_MAPPINGS) {
      const layer = findLayerByTitle(map.webmap, m.layerTitle)
      if (layer) layer.definitionExpression = combined
    }
    // The highlight overlay gets the same union.
    const highlight = findLayerByTitle(map.webmap, SELECTION_HIGHLIGHT_LAYER_TITLE)
    if (highlight) highlight.definitionExpression = combined
  }, [filters, manualIds, oidField, map.ready, map.webmap])

  // Guard the highlight layer (and filter viz layers) against external
  // definitionExpression resets (e.g. popup interactions).
  useEffect(() => {
    if (!map.ready || !map.webmap) return
    const handles: IHandle[] = []
    const titles = [
      ...FILTER_LAYER_MAPPINGS.map(m => m.layerTitle),
      SELECTION_HIGHLIGHT_LAYER_TITLE
    ]
    for (const title of titles) {
      const layer = findLayerByTitle(map.webmap, title)
      if (!layer) continue
      const h = layer.watch('definitionExpression', (newVal: string) => {
        if (newVal !== expectedSqlRef.current) {
          layer.definitionExpression = expectedSqlRef.current
        }
      })
      handles.push(h)
    }
    return () => handles.forEach(h => h.remove())
  }, [map.ready, map.webmap])

  // Poll the live count of selected segments. Reads from the highlight
  // overlay so it reflects the same union the user sees painted blue.
  useEffect(() => {
    if (!map.ready || !map.webmap) return
    const highlight = findLayerByTitle(map.webmap, SELECTION_HIGHLIGHT_LAYER_TITLE)
    if (!highlight) return
    let cancelled = false
    const update = async () => {
      if (loading) return
      try {
        const q = highlight.createQuery()
        q.where = highlight.definitionExpression || '1=0'
        const count = await highlight.queryFeatureCount(q)
        if (!cancelled && !loading) {
          setSegmentCountText(t(locale, 'streetSegmentsSelected', { n: count.toLocaleString() }))
        }
      } catch (_) { /* ignore transient query errors */ }
    }
    update()
    const interval = setInterval(update, 2000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [map.ready, map.webmap, loading, locale])

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
      return { ...prev, [field]: { ...prev[field], active: true } }
    })
  }, [])

  const handleReset = useCallback(() => setFilters(createInitialFilters()), [])

  // Calculator + count polling both read from the highlight overlay, which
  // carries the union clause. The grey base is left untouched.
  const selectedLayer = map.webmap
    ? findLayerByTitle(map.webmap, SELECTION_HIGHLIGHT_LAYER_TITLE)
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
      />
      <Calculator
        locale={locale}
        selectedLayer={selectedLayer}
        view={map.view}
        map={map}
        segmentCountText={segmentCountText}
        onLoadingChange={setLoading}
        setSegmentCountText={setSegmentCountText}
      />
    </aside>
  )
}

// Minimal shape of an ArcGIS watch handle.
interface IHandle { remove: () => void }
