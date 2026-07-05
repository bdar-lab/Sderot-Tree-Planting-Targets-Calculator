import { useCallback, useEffect, useRef, useState } from 'react'
import { findLayerByTitle, type WebMapHandle } from '../map/useWebMap'
import {
  SELECTED_LAYER_TITLE, FILTER_LAYER_MAPPINGS, KNOWN_FILTER_FIELDS
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
// state, pushes the combined SQL to all visualization layers + "Selected
// streets", and polls the live segment count.
// Replaces the ExB tree_potential_v2 widget's main component + filter-layer-
// sync's SQL→layer sync.
// ─────────────────────────────────────────────────────────────────────────

interface Props {
  locale: Locale
  map: WebMapHandle
}

export default function Sidebar ({ locale, map }: Props) {
  const [filters, setFilters] = useState<FiltersMap>(createInitialFilters)
  const [segmentCountText, setSegmentCountText] = useState('')
  const [loading, setLoading] = useState(false)
  const prevSqlRef = useRef<string>('')
  const expectedSqlRef = useRef<string>('1=1')

  // Apply the combined filter SQL to every visualization layer + Selected
  // streets whenever the filters change.
  useEffect(() => {
    if (!map.ready || !map.webmap) return
    const sql = buildCombinedSql(filters)
    if (sql === prevSqlRef.current) return
    prevSqlRef.current = sql
    // Keep only clauses for known fields (incl. `width`).
    const clauses = [...parseFilterClauses(sql, KNOWN_FILTER_FIELDS).values()]
    const combined = clauses.length > 0 ? clauses.join(' AND ') : '1=1'
    expectedSqlRef.current = combined
    for (const m of FILTER_LAYER_MAPPINGS) {
      const layer = findLayerByTitle(map.webmap, m.layerTitle)
      if (layer) layer.definitionExpression = combined
    }
    const selected = findLayerByTitle(map.webmap, SELECTED_LAYER_TITLE)
    if (selected) selected.definitionExpression = combined
  }, [filters, map.ready, map.webmap])

  // Guard layers against external definitionExpression resets (e.g. popups),
  // mirroring the ExB filter-layer-sync layer.watch guard.
  useEffect(() => {
    if (!map.ready || !map.webmap) return
    const handles: IHandle[] = []
    const titles = [...FILTER_LAYER_MAPPINGS.map(m => m.layerTitle), SELECTED_LAYER_TITLE]
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

  // Poll the live count of selected segments.
  useEffect(() => {
    if (!map.ready || !map.webmap) return
    const selected = findLayerByTitle(map.webmap, SELECTED_LAYER_TITLE)
    if (!selected) return
    let cancelled = false
    const update = async () => {
      if (loading) return
      try {
        const q = selected.createQuery()
        q.where = selected.definitionExpression || '1=1'
        const count = await selected.queryFeatureCount(q)
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
