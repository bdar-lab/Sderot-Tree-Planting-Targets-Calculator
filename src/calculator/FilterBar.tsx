import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FILTER_DEFINITIONS, type FilterDef } from './filter-definitions'
import { type FiltersMap } from './filter-sql'
import { t } from '../i18n/strings'
import { type Locale } from '../i18n/locale'
import '../styles/filter-bar.css'

// ─────────────────────────────────────────────────────────────────────────
// Icon-based filter bar with live-updating slider popovers.
// Ported from tree_potential_v2/widget.tsx (FilterIconImg, SliderContent,
// RangeSliderContent, and the filter-bar JSX block).
// ─────────────────────────────────────────────────────────────────────────

const ICON_BASE = `${import.meta.env.BASE_URL}icons/`

function FilterIconImg ({ def, label }: { def: FilterDef; label: string }) {
  if (def.iconType === 'svg' && def.iconSvg) {
    return <span dangerouslySetInnerHTML={{ __html: def.iconSvg }} style={{ display: 'flex', width: 18, height: 18 }} />
  }
  if (def.iconType === 'png' && def.iconPng) {
    return <img src={`${ICON_BASE}${def.iconPng}`} alt={label} />
  }
  return <span>?</span>
}

function SliderContent ({ def, value, onChange, locale }: {
  def: FilterDef & { type: 'slider' }; value: number; onChange: (v: number) => void; locale: Locale
}) {
  // Categorical slider: discrete categories with custom tick labels.
  // Slider position N → categories[N] → SQL e.g. `class_2k >= 5`. The
  // readout below the slider uses `readouts[N]` if provided, otherwise
  // the default "Top X% selected" template.
  //
  // In Hebrew, mirror the slider visually so it reads right-to-left:
  // categories, tickLabels and readouts are reversed in place. The user's
  // numeric value (the class id) is unchanged — only its position on the
  // slider flips — so the SQL stays correct.
  const rawCats = def.categories
  const rawTicks = def.tickLabels
  const rawReadouts = def.readouts
  if (rawCats && rawTicks && rawCats.length === rawTicks.length) {
    const reverse = locale === 'he'
    const categories = reverse ? [...rawCats].reverse() : rawCats
    const tickLabels = reverse ? [...rawTicks].reverse() : rawTicks
    const readouts = rawReadouts && reverse ? [...rawReadouts].reverse() : rawReadouts
    const idx = Math.max(0, categories.indexOf(value))
    const safeIdx = idx >= 0 ? idx : 0
    const readoutKey = readouts?.[safeIdx] ?? 'topPercentSelected'
    return (
      <div>
        <div className="compact-filter-slider-row">
          <input
            type="range"
            className="compact-filter-slider"
            min={0}
            max={categories.length - 1}
            step={1}
            value={safeIdx}
            // In Hebrew, mirror the rendered slider so the thumb's visual
            // position matches the reversed tick labels. The internal value
            // semantics (and therefore the SQL) are unchanged.
            style={reverse ? { transform: 'scaleX(-1)' } : undefined}
            onChange={e => onChange(categories[Number(e.target.value)])}
          />
        </div>
        {/* Custom labelled tick row beneath the slider. Each label is
            absolutely positioned so its centre sits directly under the
            corresponding slider thumb position. The thumb (14 px wide)
            travels from x = 7 px to x = width - 7 px, so we compute
            `calc(7px + (100% - 14px) * i / (N-1))` for each tick. */}
        <div className="compact-filter-tick-row" aria-hidden="true">
          {tickLabels.map((lbl, i) => {
            const denom = tickLabels.length - 1
            const left = denom === 0
              ? '50%'
              : `calc(7px + (100% - 14px) * ${i} / ${denom})`
            return (
              <span
                key={i}
                className={`compact-filter-tick ${i === safeIdx ? 'active' : ''}`}
                style={{ left }}
              >
                {lbl}
              </span>
            )
          })}
        </div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>
          {t(locale, readoutKey, { p: tickLabels[safeIdx] })}
        </div>
      </div>
    )
  }
  const breaks = def.breaks
  if (breaks && breaks.length > 1) {
    const closestIdx = breaks.reduce((best, b, i) =>
      Math.abs(b - value) < Math.abs(breaks[best] - value) ? i : best, 0)
    const displayVal = Math.round(breaks[closestIdx]).toLocaleString()
    return (
      <div>
        <div className="compact-filter-slider-row">
          <span className="compact-filter-value" style={{ minWidth: 30 }}>{t(locale, 'low')}</span>
          <input type="range" className="compact-filter-slider"
            min={0} max={breaks.length - 1} step={1} value={closestIdx}
            onChange={e => onChange(breaks[Number(e.target.value)])} />
          <span className="compact-filter-value" style={{ minWidth: 30 }}>{t(locale, 'high')}</span>
        </div>
        <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
          {def.operator === '<' ? t(locale, 'lessThan') : t(locale, 'greaterThan')} {displayVal}{def.unit || ''}
        </div>
        <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>
          {t(locale, 'jenksClass', { n: closestIdx + 1, m: breaks.length })}
        </div>
      </div>
    )
  }
  const displayVal = def.step < 1 ? value.toFixed(2) : String(value)
  return (
    <div>
      <div className="compact-filter-slider-row">
        <span className="compact-filter-value">{def.min}</span>
        <input type="range" className="compact-filter-slider"
          min={def.min} max={def.max} step={def.step} value={value}
          onChange={e => onChange(Number(e.target.value))} />
        <span className="compact-filter-value">{displayVal}{def.unit || ''}</span>
      </div>
      <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
        {def.operator === '<' ? t(locale, 'lessThan') : t(locale, 'greaterThan')} {displayVal}{def.unit || ''}
      </div>
    </div>
  )
}

function RangeSliderContent ({ def, value, onChange, locale }: {
  def: FilterDef & { type: 'range-slider' }; value: [number, number]; onChange: (v: [number, number]) => void; locale: Locale
}) {
  const [lo, hi] = value
  return (
    <div>
      <div className="compact-filter-range-row">
        <span className="compact-filter-value">{lo}{def.unit || ''}</span>
        <span style={{ color: '#888' }}>-</span>
        <span className="compact-filter-value">{hi}{def.unit || ''}</span>
      </div>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{t(locale, 'min')}</div>
        <input type="range" className="compact-filter-slider"
          min={def.min} max={def.max} step={def.step} value={lo}
          onChange={e => { const v = Number(e.target.value); onChange([Math.min(v, hi), hi]) }} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{t(locale, 'max')}</div>
        <input type="range" className="compact-filter-slider"
          min={def.min} max={def.max} step={def.step} value={hi}
          onChange={e => { const v = Number(e.target.value); onChange([lo, Math.max(v, lo)]) }} />
      </div>
    </div>
  )
}

interface Props {
  filters: FiltersMap
  locale: Locale
  onUpdateValue: (field: string, value: number | [number, number]) => void
  onToggle: (field: string) => void
  onReset: () => void
}

export default function FilterBar ({ filters, locale, onUpdateValue, onToggle, onReset }: Props) {
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const iconRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const openPopoverFor = (field: string) => {
    const el = iconRefs.current[field]
    if (el) {
      const r = el.getBoundingClientRect()
      setPopoverPos({ top: r.bottom + 6, left: Math.max(r.right - 220, 10) })
    }
    setOpenPopover(field)
  }

  const handleIconClick = (field: string) => {
    const wasActive = filters[field]?.active
    onToggle(field)
    if (wasActive) {
      setOpenPopover(null); setPopoverPos(null)
    } else {
      openPopoverFor(field)
    }
  }

  const closePopover = () => { setOpenPopover(null); setPopoverPos(null) }

  const handleMouseEnter = (field: string) => {
    setHoveredIcon(field)
    const el = iconRefs.current[field]
    if (el) {
      const r = el.getBoundingClientRect()
      setTooltipPos({ top: r.bottom + 4, left: r.left + r.width / 2 })
    }
  }
  const handleMouseLeave = () => { setHoveredIcon(null); setTooltipPos(null) }

  const openDef = openPopover ? FILTER_DEFINITIONS.find(d => d.field === openPopover) : null
  const hoveredDef = hoveredIcon ? FILTER_DEFINITIONS.find(d => d.field === hoveredIcon) : null

  const portalContent = (
    <>
      {hoveredIcon && !openPopover && hoveredDef && tooltipPos && (
        <div className="compact-filter-tooltip" dir={locale === 'he' ? 'rtl' : 'ltr'}
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: 'translateX(-50%)', textAlign: locale === 'he' ? 'right' : 'left' }}>
          {t(locale, hoveredDef.nameKey)}
          {hoveredDef.unavailable && (
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, fontStyle: 'italic' }}>
              {t(locale, 'filterNotAvailable')}
            </div>
          )}
        </div>
      )}
      {openPopover && openDef && popoverPos && (
        <>
          <div className="compact-filter-backdrop" onClick={closePopover} />
          <div className="compact-filter-popover" dir={locale === 'he' ? 'rtl' : 'ltr'}
            style={{ top: popoverPos.top, left: popoverPos.left, textAlign: locale === 'he' ? 'right' : 'left' }}
            onClick={e => e.stopPropagation()}>
            <div className="compact-filter-popover-title">{t(locale, openDef.nameKey)}</div>
            <div style={{ fontSize: 10, color: '#999', marginBottom: 6, lineHeight: 1.3, fontStyle: 'italic', wordWrap: 'break-word', whiteSpace: 'normal', maxWidth: 200 }}>
              {t(locale, openDef.descKey)}
            </div>
            {openDef.type === 'slider' && (
              <SliderContent def={openDef} value={filters[openPopover].value as number}
                onChange={v => onUpdateValue(openPopover, v)} locale={locale} />
            )}
            {openDef.type === 'range-slider' && (
              <RangeSliderContent def={openDef} value={filters[openPopover].value as [number, number]}
                onChange={v => onUpdateValue(openPopover, v)} locale={locale} />
            )}
          </div>
        </>
      )}
    </>
  )

  return (
    <>
      <div className="compact-filter-bar" style={{ margin: 0, borderRadius: 0 }}>
        {FILTER_DEFINITIONS.map(def => {
          const state = filters[def.field]
          const unavailable = !!def.unavailable
          return (
            <div key={def.field}
              ref={el => { iconRefs.current[def.field] = el }}
              className={`compact-filter-icon ${state?.active ? 'active' : ''} ${unavailable ? 'unavailable' : ''}`}
              onClick={e => {
                e.stopPropagation()
                if (unavailable) return
                handleIconClick(def.field)
              }}
              onMouseEnter={() => handleMouseEnter(def.field)}
              onMouseLeave={handleMouseLeave}>
              <FilterIconImg def={def} label={t(locale, def.nameKey)} />
            </div>
          )
        })}
      </div>
      <div style={{ textAlign: 'center', padding: '4px 10px 0' }}>
        <button onClick={onReset}
          style={{ fontSize: 10, color: '#aaa', background: 'none', border: '1px solid #555', borderRadius: 3, padding: '2px 10px', cursor: 'pointer' }}>
          {t(locale, 'resetFilters')}
        </button>
      </div>
      {createPortal(portalContent, document.body)}
    </>
  )
}
