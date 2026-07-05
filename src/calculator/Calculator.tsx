import { useState } from 'react'
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import type MapView from '@arcgis/core/views/MapView'
import { t, CATEGORY_LABELS } from '../i18n/strings'
import { type Locale } from '../i18n/locale'
import { computeResults, type Results, type SegmentRecord, fmtInt, formatNum } from './compute'
import { translateFilters, downloadCsv, openPdfReport } from './report'
import { findLayerByTitle, type WebMapHandle } from '../map/useWebMap'
import { TREES_LAYER_TITLE, TREE_CROWN_DIAM_FIELD, SHADE_TREE_CROWN_THRESHOLD } from '../map/layers'

// ─────────────────────────────────────────────────────────────────────────
// Calculation method + parameters + results panel. Sderot flavour:
//  - Street segments come from the Shade Index layer (summer_SI, width,
//    length; no W_type, no per-segment tree counts).
//  - Existing-tree counts are derived at Calculate time by spatially
//    joining the tree-trunks layer against the selected segments.
//  - Width class (W_type) is derived from the `width` value client-side
//    using the same buckets as TLV (<10 / 10-20 / 20-30 / 30-40 / >40).
// ─────────────────────────────────────────────────────────────────────────

/** Derive W_type (1..5) from segment width in metres. */
function wTypeFromWidth (w: number): string {
  if (!isFinite(w) || w <= 0) return '1'
  if (w < 10) return '1'
  if (w < 20) return '2'
  if (w < 30) return '3'
  if (w < 40) return '4'
  return '5'
}

const FIELD_CONFIG = {
  lengthField: 'length',
  widthField: 'width',
  wtypeField: '__wtype',  // synthetic — computed from width per segment
  existingTreesField: '__existingShade',   // synthetic — filled by spatial join
  underdevelopedTreesField: '__existingUnder'  // synthetic — filled by spatial join
}
const ROWS = 2

interface Props {
  locale: Locale
  /** The "Selected streets" layer — its definitionExpression is the filter. */
  selectedLayer: FeatureLayer | null
  /** MapView, needed for the PDF screenshot. */
  view: MapView | null
  /** Handle to the WebMap so we can find the tree-trunks layer for the
   *  existing-tree spatial join. */
  map: WebMapHandle | null
  /** Live segment count string (managed by the parent's polling). */
  segmentCountText: string
  /** Lets the parent show "Processing…" instead of the polled count. */
  onLoadingChange: (loading: boolean) => void
  setSegmentCountText: (s: string) => void
}

export default function Calculator ({
  locale, selectedLayer, view, map, segmentCountText, onLoadingChange, setSegmentCountText
}: Props) {
  const cat = CATEGORY_LABELS[locale]

  const [scenario, setScenario] = useState<'s1' | 's2'>('s1')
  const [subScenario, setSubScenario] = useState<'1a' | '1b'>('1a')
  const [diameter, setDiameter] = useState(8)
  // Mirror of `diameter` as raw text so partial input like "8." stays in the
  // box while the user is typing. Accepts digits + one optional decimal
  // point + up to one decimal digit; the numeric `diameter` is updated
  // whenever the text parses to a valid finite number.
  const [diameterText, setDiameterText] = useState('8')
  const [tccrGlobal, setTccrGlobal] = useState(0.6)
  const [wtypeTargets, setWtypeTargets] = useState<Record<string, number>>(
    { '1': 0.50, '2': 0.40, '3': 0.40, '4': 0.40, '5': 0.40 }
  )
  const [spacing, setSpacing] = useState(25)
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(false)

  const onCompute = async () => {
    if (!selectedLayer) return
    setLoading(true); onLoadingChange(true)
    setSegmentCountText(t(locale, 'fetchingRecords'))
    try {
      const where = selectedLayer.definitionExpression || '1=1'
      // Paginated fetch of all matching segments — geometry is needed for
      // the tree spatial join below.
      const features: any[] = []
      let offset = 0
      let done = false
      while (!done) {
        const q = selectedLayer.createQuery()
        q.where = where
        q.outFields = ['*']
        q.returnGeometry = true
        q.start = offset
        q.num = 2000
        const res = await selectedLayer.queryFeatures(q)
        if (res?.features?.length) features.push(...res.features)
        if (!res.features || res.features.length < 2000) done = true
        else offset += 2000
      }
      if (features.length === 0) {
        setSegmentCountText(t(locale, 'noRecordsFound'))
        setLoading(false); onLoadingChange(false)
        return
      }

      // Sderot: derive W_type client-side from `width` (bucketed the same
      // way as the TLV data).
      for (const f of features) {
        f.attributes.__wtype = wTypeFromWidth(Number(f.attributes.width))
        // Initialise the synthetic tree counters — the spatial join fills them.
        f.attributes.__existingShade = 0
        f.attributes.__existingUnder = 0
      }

      // Spatial join: count tree trunks per segment.
      // Simple approach — query all trees within the combined extent, then
      // per tree find the nearest segment via geometryEngine.nearestCoordinate.
      const treesLayer = map?.webmap ? findLayerByTitle(map.webmap, TREES_LAYER_TITLE) : null
      if (treesLayer && features.length > 0) {
        try {
          const geometryEngine = await import('@arcgis/core/geometry/geometryEngine')
          // Union all segment geometries into one, take its extent as the
          // spatial filter envelope for the tree query.
          const combined = geometryEngine.union(features.map(f => f.geometry))
          if (combined) {
            const trees: any[] = []
            let toffset = 0; let tdone = false
            while (!tdone) {
              const tq = treesLayer.createQuery()
              tq.geometry = combined.extent as any
              tq.spatialRelationship = 'intersects'
              tq.outFields = ['*']
              tq.returnGeometry = true
              tq.start = toffset
              tq.num = 2000
              const res = await treesLayer.queryFeatures(tq)
              if (res?.features?.length) trees.push(...res.features)
              if (!res.features || res.features.length < 2000) tdone = true
              else toffset += 2000
            }
            // Assign each tree to the segment it is closest to.
            // NEAR_THRESHOLD_M: only count trees within N metres of a segment
            // line, to avoid counting trees that fall in yards/plazas.
            const NEAR_THRESHOLD_M = 15
            for (const tree of trees) {
              if (!tree.geometry) continue
              let bestIdx = -1
              let bestDist = Infinity
              for (let i = 0; i < features.length; i++) {
                const seg = features[i].geometry
                if (!seg) continue
                const d = geometryEngine.distance(tree.geometry, seg, 'meters')
                if (d < bestDist) { bestDist = d; bestIdx = i }
              }
              if (bestIdx >= 0 && bestDist <= NEAR_THRESHOLD_M) {
                const crown = Number(tree.attributes?.[TREE_CROWN_DIAM_FIELD]) || 0
                const attrs = features[bestIdx].attributes
                if (crown >= SHADE_TREE_CROWN_THRESHOLD) attrs.__existingShade += 1
                else attrs.__existingUnder += 1
              }
            }
          }
        } catch (e) {
          // Non-fatal — if the tree join fails the calculator still runs
          // with zero existing trees for every segment.
          console.warn('[calculator] tree spatial join failed:', e)
        }
      }

      const recs: SegmentRecord[] = features.map(f => ({
        getFieldValue: (field: string) => f.attributes[field]
      }))
      const summary = computeResults(
        recs,
        {
          scenario, subScenario, diameter, tccrGlobal, wtypeTargets,
          spacing, rows: ROWS, ...FIELD_CONFIG
        },
        translateFilters(where, locale)
      )
      setResults(summary)
      setSegmentCountText(t(locale, 'calculatedSegments', { n: features.length }))
    } catch (err) {
      console.error(err)
      setSegmentCountText(t(locale, 'errorFetching'))
    } finally {
      setLoading(false); onLoadingChange(false)
    }
  }

  const handleCsv = () => {
    if (results) downloadCsv(results, cat)
  }

  const handlePdf = async () => {
    if (!results || !view) return
    const shot = await view.takeScreenshot({ format: 'png' })
    openPdfReport(
      results,
      { scenario, subScenario, diameter, tccrGlobal, spacing },
      locale, cat, shot.dataUrl
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '4px 6px', background: '#3a3a3a',
    border: '1px solid #555', borderRadius: 3, color: '#eee', fontSize: 12
  }

  return (
    <div style={{ padding: '8px 10px' }} dir={locale === 'he' ? 'rtl' : 'ltr'}>
      <div style={{ fontSize: 12, fontStyle: 'italic', color: '#bbb', lineHeight: 1.4, marginBottom: 4, textAlign: locale === 'he' ? 'right' : 'left' }}>
        {t(locale, 'instruction')}
      </div>
      <div style={{ fontSize: 12, color: '#4fc3f7', marginBottom: 6 }}>{segmentCountText}</div>

      {/* Method */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>{t(locale, 'calculationMethod')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: 12, cursor: 'pointer' }}>
            <input type="radio" checked={scenario === 's1'} onChange={() => setScenario('s1')}
              style={{ marginInlineEnd: 6, accentColor: '#0079c1' }} />
            {t(locale, 'method1')}
          </label>
          <div style={{ paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <label style={{ fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" checked={scenario === 's1' && subScenario === '1a'}
                onChange={() => { setScenario('s1'); setSubScenario('1a') }}
                style={{ width: 14, height: 14, marginInlineEnd: 6, accentColor: '#0079c1' }} />
              {t(locale, 'method1aGlobal')}
            </label>
            <label style={{ fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <input type="checkbox" checked={scenario === 's1' && subScenario === '1b'}
                onChange={() => { setScenario('s1'); setSubScenario('1b') }}
                style={{ width: 14, height: 14, marginInlineEnd: 6, accentColor: '#0079c1' }} />
              {t(locale, 'method1bByWidth')}
            </label>
          </div>
          <label style={{ fontSize: 12, cursor: 'pointer', marginTop: 2 }}>
            <input type="radio" checked={scenario === 's2'} onChange={() => setScenario('s2')}
              style={{ marginInlineEnd: 6, accentColor: '#0079c1' }} />
            {t(locale, 'method2')}
          </label>
        </div>
      </div>

      {/* Parameters */}
      <div style={{ marginBottom: 6, padding: 8, border: '1px solid #555', borderRadius: 4 }}>
        <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>{t(locale, 'calculationParameters')}</div>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 11, marginBottom: 2 }}>{t(locale, 'crownDiameter')}</div>
          <input
            type="text"
            inputMode="decimal"
            value={diameterText}
            onChange={e => {
              const v = e.target.value
              // Allow empty, digits, optionally a single decimal point and
              // up to one decimal digit (e.g. "", "8", "8.", "8.1").
              if (!/^\d*\.?\d{0,1}$/.test(v)) return
              setDiameterText(v)
              const n = Number(v)
              if (isFinite(n) && v !== '' && v !== '.') setDiameter(n)
            }}
            style={inputStyle}
          />
        </div>
        {scenario === 's1' && subScenario === '1a' && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, marginBottom: 2 }}>{t(locale, 'globalTccr')}</div>
            <input type="text" value={String(tccrGlobal)} onChange={e => setTccrGlobal(Number(e.target.value))} style={inputStyle} />
          </div>
        )}
        {scenario === 's1' && subScenario === '1b' && (
          <div style={{ padding: 6, border: '1px solid #555', borderRadius: 3, fontSize: 11 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{t(locale, 'tccrTargetsByWidth')}</div>
            {Object.keys(wtypeTargets).sort().map(id => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>{cat[id] || `${t(locale, 'classLabel')} ${id}`}:</span>
                <input type="text" value={String(wtypeTargets[id])}
                  onChange={e => setWtypeTargets({ ...wtypeTargets, [id]: Number(e.target.value) })}
                  style={{ width: 60, padding: '2px 4px', background: '#3a3a3a', border: '1px solid #555', borderRadius: 3, color: '#eee', fontSize: 11, textAlign: 'end' }} />
              </div>
            ))}
          </div>
        )}
        {scenario === 's2' && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, marginBottom: 2 }}>{t(locale, 'desiredSpacing')}</div>
            <input type="text" value={String(spacing)} onChange={e => setSpacing(Number(e.target.value))} style={inputStyle} />
          </div>
        )}
      </div>

      <button onClick={onCompute} disabled={!selectedLayer || loading}
        style={{ width: '100%', padding: '8px', background: loading ? '#555' : '#4a90d9', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, cursor: loading ? 'default' : 'pointer', marginBottom: 8 }}>
        {loading ? t(locale, 'processing') : t(locale, 'calculate')}
      </button>

      {results && (
        <div style={{ padding: 10, border: '1px solid #555', borderRadius: 4, background: '#333' }}>
          <div style={{ fontWeight: 'bold', borderBottom: '1px solid #555', marginBottom: 6, paddingBottom: 4, textTransform: 'uppercase', fontSize: 11 }}>{t(locale, 'results')}</div>
          <Row label={t(locale, 'selectedSegments')} value={fmtInt(results.segmentCount)} />
          <Row label={t(locale, 'totalStreetLength')} value={`${fmtInt(results.totalLength)} m`} />
          <Row label={t(locale, 'idealTrees')} value={fmtInt(results.totalTrees)} mt />
          <Row label={t(locale, 'existingShadeTrees')} value={fmtInt(results.totalExistingShade)} />
          <Row label={t(locale, 'underdevelopedTrees')} value={fmtInt(results.totalExistingUnder)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 'bold', borderBottom: '1px solid #555', paddingBottom: 4, marginBottom: 4 }}>
            <span>{t(locale, 'newTreesToPlant')}</span><strong>{fmtInt(results.treesToAdd)}</strong>
          </div>
          <Row label={t(locale, 'weightedTccr')} value={formatNum(results.avgTccr)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
            <span>{t(locale, 'avgSpacing')}</span><strong>{fmtInt(results.avgSpacing)} m</strong>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button onClick={handleCsv} style={resultBtn}>{t(locale, 'exportCsv')}</button>
            <button onClick={handlePdf} style={resultBtn}>{t(locale, 'printPdf')}</button>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #555', marginBottom: 4, fontSize: 11, textTransform: 'uppercase' }}>{t(locale, 'analysisByWidth')}</div>
            {Object.keys(results.byWtype).sort().map(k => (
              <div key={k} style={{ borderBottom: '1px solid #444', paddingBottom: 4, marginBottom: 4, fontSize: 11 }}>
                <div style={{ fontWeight: 'bold', color: '#4fc3f7' }}>{cat[k] || `${t(locale, 'classLabel')} ${k}`}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t(locale, 'addTrees', { n: fmtInt(results.byWtype[k].treesToAdd) })}</span>
                  <span>{t(locale, 'tccrLabel')}: {formatNum(results.byWtype[k].tccr)}</span>
                </div>
                <div style={{ color: '#888', fontSize: 10 }}>
                  {t(locale, 'spacingLabel')}: {fmtInt(results.byWtype[k].spacing)} m | {t(locale, 'lengthLabel')}: {fmtInt(results.byWtype[k].length)} m
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const resultBtn: React.CSSProperties = {
  flex: 1, padding: '4px 8px', background: '#4a4a4a', color: '#eee',
  border: '1px solid #666', borderRadius: 3, fontSize: 11, cursor: 'pointer'
}

function Row ({ label, value, mt }: { label: string; value: string; mt?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: mt ? 4 : 0 }}>
      <span>{label}</span><strong>{value}</strong>
    </div>
  )
}
