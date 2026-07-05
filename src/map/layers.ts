// ─────────────────────────────────────────────────────────────────────────
// Filter-field → visualization-layer-title mapping for the Sderot web map.
// The web map now includes a dedicated "Selected streets" layer (matching
// the TLV pattern) — its definitionExpression is what the filter bar
// mutates. "Spring/summer Shade Index" is the always-on visualization.
// ─────────────────────────────────────────────────────────────────────────

/** The layer whose definitionExpression reflects the combined filter. */
export const SELECTED_LAYER_TITLE = 'Selected streets'

/** Filter field → visualization layer (canonical English titles). Only the
 *  Shade Index has a corresponding filter/visualization pairing. Street
 *  width filters through the "Selected streets" surface with no separate
 *  visualization. */
export const FILTER_LAYER_MAPPINGS: Array<{ filterField: string; layerTitle: string }> = [
  { filterField: 'summer_SI', layerTitle: 'Spring/summer Shade Index' }
]

/** Filter fields the SQL parser must recognise. Only fields the Sderot
 *  street-segment layer actually has can appear here. */
export const KNOWN_FILTER_FIELDS = [
  'summer_SI',
  'width'
]

/** All layer titles that carry the cumulative filter expression. */
export const FILTERABLE_LAYER_TITLES = [
  SELECTED_LAYER_TITLE,
  'Spring/summer Shade Index'
]

/** Tree trunks layer. Used by the calculator to spatial-join tree points
 *  to selected segments. */
export const TREES_LAYER_TITLE = 'Existing street tree locations 2025'
/** Field on the trees layer holding the crown diameter (metres). */
export const TREE_CROWN_DIAM_FIELD = 'crown_diam'
/** Threshold splitting shade trees (>= this) from underdeveloped trees. */
export const SHADE_TREE_CROWN_THRESHOLD = 5
