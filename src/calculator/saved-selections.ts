import { type FiltersMap, createInitialFilters } from './filter-sql'
import { FILTER_DEFINITIONS } from './filter-definitions'

// ─────────────────────────────────────────────────────────────────────────
// Named-selection persistence.
//
// A saved selection is a snapshot of the two things that drive the union
// SQL clause: the manually-clicked street OIDs and the filter slider
// state. Loading a saved set restores both, so the map, the count, and
// Calculate return to exactly what the user saw at save time.
//
// Storage is plain browser localStorage under a namespaced key. Nothing
// leaves the user's browser unless they explicitly export the file.
// ─────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sderot.savedSelections'
const SCHEMA_VERSION = 1

export interface SavedSelection {
  id: string
  name: string
  createdAt: number
  manualIds: number[]
  /** Optional so records written before this field existed still load
   *  cleanly — App treats a missing value as an empty set. */
  removedIds?: number[]
  filters: FiltersMap
}

interface StoredFile {
  version: number
  sets: SavedSelection[]
}

function readStore (): StoredFile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: SCHEMA_VERSION, sets: [] }
    const parsed = JSON.parse(raw) as StoredFile
    // Defensive: coerce older/malformed payloads into an empty list rather
    // than throw. If we ever bump the schema we can migrate here.
    if (!parsed || !Array.isArray(parsed.sets)) return { version: SCHEMA_VERSION, sets: [] }
    return parsed
  } catch (_) {
    return { version: SCHEMA_VERSION, sets: [] }
  }
}

function writeStore (store: StoredFile): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (_) { /* quota exceeded or private mode — the caller will see stale reads and can inform the user */ }
}

/** Load every saved selection, newest first. */
export function loadAll (): SavedSelection[] {
  const store = readStore()
  return [...store.sets].sort((a, b) => b.createdAt - a.createdAt)
}

/** Persist a new selection. Returns the stored record (with generated id). */
export function save (
  name: string,
  manualIds: Set<number>,
  filters: FiltersMap,
  removedIds: Set<number> = new Set()
): SavedSelection {
  const store = readStore()
  // Ensure the display name is unique. Duplicate names would work
  // technically (ids are separate) but confuse the user in the picker.
  const uniqueName = ensureUniqueName(name.trim() || 'Untitled', store.sets)
  const rec: SavedSelection = {
    id: makeId(),
    name: uniqueName,
    // Date.now() is fine at runtime; the workflow-script sandbox that
    // disallows it doesn't apply here.
    createdAt: Date.now(),
    manualIds: [...manualIds],
    removedIds: [...removedIds],
    // Structured-clone via JSON to detach from React state; also strips
    // any Immutable wrappers if the shape ever changes.
    filters: JSON.parse(JSON.stringify(filters)) as FiltersMap
  }
  store.sets.push(rec)
  writeStore(store)
  return rec
}

/** Remove a set by id. No-op if missing. */
export function remove (id: string): void {
  const store = readStore()
  store.sets = store.sets.filter(s => s.id !== id)
  writeStore(store)
}

/** Rename a set in place. Returns the resulting (uniqueified) name or null
 *  if the id was not found. */
export function rename (id: string, newName: string): string | null {
  const store = readStore()
  const idx = store.sets.findIndex(s => s.id === id)
  if (idx < 0) return null
  const others = store.sets.filter(s => s.id !== id)
  const unique = ensureUniqueName(newName.trim() || 'Untitled', others)
  store.sets[idx].name = unique
  writeStore(store)
  return unique
}

/** Trigger a download of every saved set as a JSON file. */
export function exportToFile (): void {
  const store = readStore()
  const blob = new Blob([JSON.stringify(store, null, 2)], {
    type: 'application/json;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `sderot-saved-selections-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Read a JSON file exported by exportToFile and merge its sets into the
 *  store. Returns the number of sets that were successfully imported.
 *  Existing sets are kept; imported sets always get fresh ids and their
 *  names deduped. */
export async function importFromFile (file: File): Promise<number> {
  const text = await file.text()
  let payload: unknown
  try { payload = JSON.parse(text) } catch (_) { return 0 }
  const p = payload as Partial<StoredFile> | null
  if (!p || !Array.isArray(p.sets)) return 0
  const store = readStore()
  let count = 0
  for (const raw of p.sets) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Partial<SavedSelection>
    if (typeof r.name !== 'string' || !Array.isArray(r.manualIds)) continue
    // Reconstitute filters against the current definitions — any keys the
    // file has but this city doesn't know about are dropped; any new
    // filters get their factory defaults so the loaded state is coherent
    // with the current UI.
    const filters = mergeFilters(r.filters as FiltersMap | undefined)
    const uniqueName = ensureUniqueName(r.name.trim() || 'Untitled', store.sets)
    const removedIds = Array.isArray(r.removedIds)
      ? (r.removedIds.filter((n: unknown) => typeof n === 'number') as number[])
      : []
    store.sets.push({
      id: makeId(),
      name: uniqueName,
      createdAt: Date.now(),
      manualIds: r.manualIds.filter((n: unknown) => typeof n === 'number') as number[],
      removedIds,
      filters
    })
    count++
  }
  writeStore(store)
  return count
}

// Helpers ------------------------------------------------------------------

function makeId (): string {
  // Simple 12-char base36 id; collisions are effectively impossible for a
  // per-browser store that holds tens of sets.
  return `sel-${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 8)}`
}

function ensureUniqueName (base: string, existing: SavedSelection[]): string {
  const taken = new Set(existing.map(s => s.name))
  if (!taken.has(base)) return base
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base} (${i})`
    if (!taken.has(candidate)) return candidate
  }
  return `${base} (${Date.now()})`
}

function mergeFilters (incoming: FiltersMap | undefined): FiltersMap {
  const base = createInitialFilters()
  if (!incoming) return base
  for (const def of FILTER_DEFINITIONS) {
    const s = incoming[def.field]
    if (s && typeof s.active === 'boolean' && 'value' in s) {
      base[def.field] = { active: s.active, value: s.value }
    }
  }
  return base
}
