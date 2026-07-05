// ─────────────────────────────────────────────────────────────────────────
// Calculator math — TCCR and fixed-spacing planting-target computation.
// Pure functions; no React, no ArcGIS. Extracted from tree_potential_v2.
// ─────────────────────────────────────────────────────────────────────────

export type Results = {
  totalTrees: number
  totalExistingShade: number
  totalExistingUnder: number
  treesToAdd: number
  totalLength: number
  totalArea: number
  avgTccr: number
  avgSpacing: number
  filterSummary: string[]
  segmentCount: number
  byWtype: Record<string, {
    trees: number
    treesToAdd: number
    length: number
    area: number
    tccr: number
    spacing: number
  }>
}

/** Field names a segment record must expose. */
export interface SegmentRecord {
  getFieldValue: (field: string) => unknown
}

export interface ComputeParams {
  scenario: 's1' | 's2'
  subScenario: '1a' | '1b'
  /** Crown diameter in metres. */
  diameter: number
  /** Global target TCCR (scenario 1a). */
  tccrGlobal: number
  /** Per-width-class TCCR targets (scenario 1b), keyed by W_type id. */
  wtypeTargets: Record<string, number>
  /** Desired spacing in metres (scenario 2). */
  spacing: number
  /** Number of tree rows per street (default 2). */
  rows: number
  /** Field name config — defaults match the TLV feature service schema. */
  lengthField: string
  widthField: string
  wtypeField: string
  existingTreesField?: string
  underdevelopedTreesField?: string
}

export const canopyArea = (d: number) => Math.PI * Math.pow(d / 2, 2)

export const formatNum = (x?: number, d = 2) =>
  (!isFinite(Number(x)) ? '0' : Number(x).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ','))

export const fmtInt = (x?: number) =>
  (!isFinite(Number(x)) ? '0' : Math.round(Number(x)).toLocaleString())

/**
 * Run the planting-target calculation over a set of segment records.
 * `filterSummary` is passed through verbatim (it is locale-dependent prose
 * built by the caller).
 */
export function computeResults (
  recs: SegmentRecord[],
  params: ComputeParams,
  filterSummary: string[]
): Results {
  const {
    scenario, subScenario, diameter, tccrGlobal, wtypeTargets,
    spacing, rows, lengthField, widthField, wtypeField,
    existingTreesField, underdevelopedTreesField
  } = params

  const C = canopyArea(diameter)
  const summary: Results = {
    totalTrees: 0, totalExistingShade: 0, totalExistingUnder: 0, treesToAdd: 0,
    totalLength: 0, totalArea: 0, avgTccr: 0, avgSpacing: 0,
    filterSummary, segmentCount: recs.length, byWtype: {}
  }

  recs.forEach(r => {
    const L = Number(r.getFieldValue(lengthField)) || 0
    const W = Number(r.getFieldValue(widthField)) || 0
    const existingShade = existingTreesField
      ? (Number(r.getFieldValue(existingTreesField)) || 0) : 0
    const existingUnder = underdevelopedTreesField
      ? (Number(r.getFieldValue(underdevelopedTreesField)) || 0) : 0
    const typeID = String(r.getFieldValue(wtypeField) || '1')
    const A = L * W
    if (!summary.byWtype[typeID]) {
      summary.byWtype[typeID] = { trees: 0, treesToAdd: 0, length: 0, area: 0, tccr: 0, spacing: 0 }
    }
    const n_pot = scenario === 's1'
      ? Math.ceil(((subScenario === '1b' ? (wtypeTargets[typeID] || 0.6) : tccrGlobal) * A) / C)
      : rows * (Math.floor(L / spacing) + 1)
    const n_add = Math.max(0, n_pot - existingShade)
    summary.totalTrees += n_pot
    summary.totalExistingShade += existingShade
    summary.totalExistingUnder += existingUnder
    summary.treesToAdd += n_add
    summary.totalLength += L
    summary.totalArea += A
    summary.byWtype[typeID].trees += n_pot
    summary.byWtype[typeID].treesToAdd += n_add
    summary.byWtype[typeID].length += L
    summary.byWtype[typeID].area += A
  })

  summary.avgTccr = summary.totalArea > 0 ? (summary.totalTrees * C) / summary.totalArea : 0
  summary.avgSpacing = summary.totalTrees > 0
    ? summary.totalLength / (summary.totalTrees / rows) : 0
  Object.keys(summary.byWtype).forEach(k => {
    const g = summary.byWtype[k]
    g.tccr = g.area > 0 ? (g.trees * C) / g.area : 0
    g.spacing = g.trees > 0 ? g.length / (g.trees / rows) : 0
  })

  return summary
}
