import { type Locale } from '../i18n/locale'
import { t, type StringKey } from '../i18n/strings'
import { type Results, fmtInt, formatNum } from './compute'

// ─────────────────────────────────────────────────────────────────────────
// SQL → human-readable prose ("Applied assumptions" bullets), CSV export,
// and the printable PDF report. Ported from tree_potential_v2/widget.tsx.
// ─────────────────────────────────────────────────────────────────────────

// Sderot only ever emits SQL clauses for `summer_SI` and `width`. Other
// fields are listed as unavailable in filter-definitions.ts and never
// reach this translator.
const FIELD_KEYS: Array<{ field: string; key: StringKey }> = [
  { field: 'summer_SI', key: 'sql_summer_SI' },
  { field: 'width', key: 'sql_width' }
]

export function translateFilters (sql: string, locale: Locale): string[] {
  if (!sql || sql === '1=1' || sql === 'None') return [t(locale, 'allSegments')]
  const between = t(locale, 'sql_isBetween')
  const lt = t(locale, 'sql_lessThan')
  const gt = t(locale, 'sql_greaterThan')
  const le = t(locale, 'sql_lessOrEqual')
  const ge = t(locale, 'sql_greaterOrEqual')
  const eq = t(locale, 'sql_equalTo')
  const andWord = t(locale, 'sql_and')
  // Fields whose numeric value should be labelled with a "m" unit in the
  // rendered prose. Sderot ships `width` only from this list.
  const distanceDescs = ['ADws_mean', 'ADwm_mean', 'ADwbu_mean', 'width']
    .map(f => FIELD_KEYS.find(x => x.field === f))
    .filter((x): x is { field: string; key: StringKey } => !!x)
    .map(x => t(locale, x.key))

  const safeSql = sql.replace(/(BETWEEN\s+.*?)\s+AND\s+(.*?)/gi, '$1##RANGE_AND##$2')
  const conditions = safeSql.split(/\s+AND\s+/gi)
  return conditions.map((cond) => {
    let text = cond.trim()
    if (text.startsWith('(') && text.endsWith(')')) text = text.slice(1, -1).trim()
    FIELD_KEYS.forEach(({ field, key }) => { text = text.split(field).join(t(locale, key)) })
    text = text
      .replace(/\s+BETWEEN\s+/gi, ` ${between} `)
      .replace(/##RANGE_AND##/g, ` ${andWord} `)
      .replace(/<=\s*/g, `: ${le} `).replace(/>=\s*/g, `: ${ge} `)
      .replace(/<\s*/g, `: ${lt} `).replace(/>\s*/g, `: ${gt} `)
      .replace(/=\s*/g, `: ${eq} `)
    const isDistanceField = distanceDescs.some(d => d && text.includes(d))
    if (isDistanceField) {
      if (text.includes(` ${between} `)) {
        text = text.replace(/(\d+(?:\.\d+)?)\s+\S+\s+(\d+(?:\.\d+)?)/, (_m, a, b) => `${a}m ${andWord} ${b}m`)
      } else {
        text = text.replace(/(\d+(\.\d+)?)$/, '$1m')
      }
    }
    let bullet = text.charAt(0).toUpperCase() + text.slice(1)
    bullet = bullet.replace(/[:\s]+$/, '').trim()
    return bullet.endsWith('.') ? bullet : bullet + '.'
  })
}

/** Trigger a CSV download of the per-width-class breakdown. */
export function downloadCsv (
  results: Results,
  categoryLabels: Record<string, string>
): void {
  const header = 'Category,Ideal number of trees (ignoring existing shade trees),Number of existing shade trees,Number of existing underdeveloped trees,Number of new trees to plant,Length(m),TCCR,Spacing(m)\n'
  const rows = Object.keys(results.byWtype).map(k => {
    const g = results.byWtype[k]
    return `${categoryLabels[k] || k},${g.trees},${results.totalExistingShade},${results.totalExistingUnder},${g.treesToAdd},${g.length.toFixed(1)},${g.tccr.toFixed(2)},${g.spacing.toFixed(1)}`
  }).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'tree_planting_potential_report.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface PdfParams {
  scenario: 's1' | 's2'
  subScenario: '1a' | '1b'
  diameter: number
  tccrGlobal: number
  spacing: number
}

/**
 * Open a printable report in a new window. `screenshotDataUrl` is a PNG data
 * URL produced by the ArcGIS MapView's takeScreenshot().
 */
export function openPdfReport (
  results: Results,
  params: PdfParams,
  locale: Locale,
  categoryLabels: Record<string, string>,
  screenshotDataUrl: string
): void {
  const { scenario, subScenario, diameter, tccrGlobal, spacing } = params
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const methodDesc = scenario === 's1'
    ? (subScenario === '1a' ? t(locale, 'pdfMethod1Global') : t(locale, 'pdfMethod1ByWidth'))
    : t(locale, 'pdfMethod2')
  const paramSummary = `${t(locale, 'crownDiameter')}: ${diameter}m | ${scenario === 's1' ? (subScenario === '1a' ? `${t(locale, 'globalTccr')}: ${tccrGlobal}` : t(locale, 'pdfTargetsPerWidth')) : `${t(locale, 'desiredSpacing')}: ${spacing}m`}`
  const dirAttr = locale === 'he' ? 'rtl' : 'ltr'
  const langAttr = locale === 'he' ? 'he' : 'en'
  const align = locale === 'he' ? 'right' : 'left'

  printWindow.document.write(`<html lang="${langAttr}" dir="${dirAttr}"><head><title>${t(locale, 'pdfTitle')}</title><style>body{font-family:'Segoe UI',Arial,sans-serif;padding:25px;color:#333;font-size:10px;line-height:1.3}h1{color:#2c3e50;font-size:16px;margin:0 0 15px 0}h2{font-size:12px;border-bottom:1px solid #eee;padding-bottom:3px;margin:15px 0 8px 0}.section-title{font-weight:bold;margin-bottom:3px;font-size:11px}table{width:100%;border-collapse:collapse;margin-top:5px;font-size:9px}th,td{border:1px solid #ddd;padding:4px 6px;text-align:${align}}th{background-color:#f8f9fa}.map-container{margin:12px 0;border:1px solid #ccc;width:100%}.map-img{width:100%;height:auto;display:block;max-height:400px;object-fit:contain;background:#eee}.footer{margin-top:25px;padding-top:8px;border-top:1px solid #eee;text-align:center;color:#777;font-size:8px}ul{padding-${align}:15px;margin:3px 0}li{margin-bottom:1px}</style></head><body>
      <h1>${t(locale, 'pdfTitle')}</h1>
      <div class="section-title">${t(locale, 'pdfAppliedAssumptions')}</div><ul>${results.filterSummary.map(f => `<li>${f}</li>`).join('')}</ul>
      <p style="margin:5px 0;"><strong>${t(locale, 'pdfTotalSegments')}:</strong> ${fmtInt(results.segmentCount)} | <strong>${t(locale, 'pdfTotalLength')}:</strong> ${fmtInt(results.totalLength)} m</p>
      <div class="section-title">${t(locale, 'pdfChosenMethod')}</div><p style="margin:2px 0;">${methodDesc}<br/><span style="color:#666;">${t(locale, 'pdfParameters')}: ${paramSummary}</span></p>
      <div class="map-container"><img class="map-img" src="${screenshotDataUrl}"></div>
      <h2>${t(locale, 'pdfResultsSummary')}</h2><table><tr><th>${t(locale, 'pdfMetric')}</th><th>${t(locale, 'pdfValue')}</th></tr>
      <tr><td>${t(locale, 'pdfIdealTrees')}</td><td>${fmtInt(results.totalTrees)}</td></tr>
      <tr><td>${t(locale, 'pdfExistingShade')}</td><td>${fmtInt(results.totalExistingShade)}</td></tr>
      <tr><td>${t(locale, 'pdfExistingUnder')}</td><td>${fmtInt(results.totalExistingUnder)}</td></tr>
      <tr style="font-weight:bold;"><td>${t(locale, 'pdfNewTrees')}</td><td>${fmtInt(results.treesToAdd)}</td></tr>
      <tr><td>${t(locale, 'pdfAvgTccr')}</td><td>${formatNum(results.avgTccr)}</td></tr>
      <tr><td>${t(locale, 'pdfAvgSpacing')}</td><td>${fmtInt(results.avgSpacing)} m</td></tr></table>
      <h2>${t(locale, 'pdfResultsByWidth')}</h2><table><tr><th>${t(locale, 'pdfWidth')}</th><th>${t(locale, 'pdfTreesToAdd')}</th><th>${t(locale, 'tccrLabel')}</th><th>${t(locale, 'spacingLabel')} (m)</th><th>${t(locale, 'lengthLabel')} (m)</th></tr>
      ${Object.keys(results.byWtype).sort().map(k => { const g = results.byWtype[k]; return `<tr><td>${categoryLabels[k] || k}</td><td>${fmtInt(g.treesToAdd)}</td><td>${formatNum(g.tccr)}</td><td>${fmtInt(g.spacing)}</td><td>${fmtInt(g.length)}</td></tr>` }).join('')}</table>
      <div class="footer">${t(locale, 'pdfFooter')} | ${new Date().toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-GB')}</div></body></html>`)
  printWindow.document.close()
  setTimeout(() => { printWindow.print() }, 700)
}
