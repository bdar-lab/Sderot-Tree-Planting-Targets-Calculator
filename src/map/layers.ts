// ─────────────────────────────────────────────────────────────────────────
// Filter-field → visualization-layer-title mapping. For Sderot the web map
// has a single street-level layer, `SDR street summer shade index`, which
// carries `summer_SI`, `width`, `length`, etc. That same layer is the
// "selection" surface — its definitionExpression is what the filter bar
// mutates, and Sderot doesn't have a separate grey-fill "Selected streets"
// layer like the TLV web map does.
// ─────────────────────────────────────────────────────────────────────────

/** The layer whose definitionExpression reflects the combined filter. */
export const SELECTED_LAYER_TITLE = 'SDR street summer shade index'

/** Filter field → visualization layer (canonical English titles). Only the
 *  Shade Index has a corresponding filter/visualization pairing. Street
 *  width filters through the same layer with no separate visualization. */
export const FILTER_LAYER_MAPPINGS: Array<{ filterField: string; layerTitle: string }> = [
  { filterField: 'summer_SI', layerTitle: 'SDR street summer shade index' }
]

/** Filter fields the SQL parser must recognise. Only fields the Sderot
 *  street-segment layer actually has can appear here. */
export const KNOWN_FILTER_FIELDS = [
  'summer_SI',
  'width'
]

/** All layer titles that carry the cumulative filter expression. In Sderot
 *  this is just the single street-index layer. */
export const FILTERABLE_LAYER_TITLES = [
  SELECTED_LAYER_TITLE
]

/** Tree trunks layer (SDR extracted street tree locations 2025). Used by
 *  the calculator to spatial-join tree points to selected segments. */
export const TREES_LAYER_TITLE = 'SDR extracted street tree locations 2025'
/** Field on the trees layer holding the crown diameter (metres). */
export const TREE_CROWN_DIAM_FIELD = 'crown_diam'
/** Threshold splitting shade trees (>= this) from underdeveloped trees. */
export const SHADE_TREE_CROWN_THRESHOLD = 5
