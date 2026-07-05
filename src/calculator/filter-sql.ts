import { FILTER_DEFINITIONS, type FilterDef } from './filter-definitions'

// ─────────────────────────────────────────────────────────────────────────
// Filter state + SQL generation
// (extracted from tree_potential_v2/widget.tsx and filter-layer-sync/widget.tsx)
// ─────────────────────────────────────────────────────────────────────────

export interface FilterState {
  active: boolean
  value: number | [number, number] | number[]
}

export type FiltersMap = Record<string, FilterState>

export function buildClause (def: FilterDef, state: FilterState): string {
  switch (def.type) {
    case 'slider':
      return `${def.field} ${def.operator} ${state.value}`
    case 'range-slider': {
      const [lo, hi] = state.value as [number, number]
      return `${def.field} BETWEEN ${lo} AND ${hi}`
    }
    case 'multi-select': {
      const vals = state.value as number[]
      return vals.length > 0 ? `${def.field} IN (${vals.join(',')})` : '1=0'
    }
  }
}

export function buildCombinedSql (filters: FiltersMap): string {
  const clauses: string[] = []
  for (const def of FILTER_DEFINITIONS) {
    // Defensive: unavailable filters can't be toggled in the UI, but skip
    // them here too so a stale localStorage state never emits a clause
    // that would reference a non-existent column in this city's data.
    if (def.unavailable) continue
    const state = filters[def.field]
    if (state?.active) {
      clauses.push(buildClause(def, state))
    }
  }
  return clauses.length > 0 ? clauses.join(' AND ') : '1=1'
}

export function createInitialFilters (): FiltersMap {
  const map: FiltersMap = {}
  for (const def of FILTER_DEFINITIONS) {
    map[def.field] = {
      active: false,
      value: def.type === 'multi-select' ? [...def.defaultValue] : def.defaultValue
    }
  }
  return map
}

/**
 * Parse a combined SQL WHERE clause into individual filter clauses keyed by
 * field name. `knownFields` must include every filter field — including
 * fields with no visualization layer (e.g. `width`), otherwise their clauses
 * are silently dropped.
 */
export function parseFilterClauses (
  sql: string,
  knownFields: string[]
): Map<string, string> {
  const result = new Map<string, string>()
  if (!sql || sql === '1=1') return result

  // Temporarily replace BETWEEN...AND so we don't split on it
  const placeholder = '##BETWEEN_AND##'
  const safeSql = sql.replace(
    /BETWEEN\s+([\d.]+)\s+AND\s+([\d.]+)/gi,
    `BETWEEN $1 ${placeholder} $2`
  )

  const parts = safeSql.split(/\s+AND\s+/i)

  for (const part of parts) {
    let clause = part.trim().replace(new RegExp(placeholder, 'g'), 'AND')
    if (clause.startsWith('(') && clause.endsWith(')')) {
      clause = clause.slice(1, -1).trim()
    }
    for (const field of knownFields) {
      if (clause.toLowerCase().startsWith(field.toLowerCase())) {
        result.set(field, clause)
        break
      }
    }
  }
  return result
}
