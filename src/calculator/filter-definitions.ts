import type { StringKey } from '../i18n/strings'

export type FilterType = 'slider' | 'range-slider' | 'multi-select'

export interface SliderFilterDef {
  type: 'slider'
  field: string
  name: string
  nameKey: StringKey
  descKey: StringKey
  operator: '<' | '>' | '<=' | '>='
  min: number
  max: number
  step: number
  defaultValue: number
  unit?: string
  iconType: 'svg' | 'png'
  iconSvg?: string
  iconPng?: string
  description?: string
  /** When true, the icon is greyed out and not clickable. Used to signal a
   *  metric that's part of the shared UI but not backed by data for the
   *  current city (e.g. no centrality columns in Sderot). */
  unavailable?: boolean
  /** Jenks natural breaks for non-linear slider — slider position maps to a break value. */
  breaks?: number[]
  /**
   * Categorical mode: each integer in `categories` is a discrete value the
   * field can take (e.g. a class id 1..7), listed in slider-position order
   * (so categories[0] = leftmost slider position, regardless of numeric
   * value). `tickLabels` provides the text shown under each tick.
   *
   * `readouts` (optional) supplies a per-position i18n key for the readout
   * line below the slider. When omitted, the default
   * `topPercentSelected` template is used with the tick label.
   */
  categories?: number[]
  tickLabels?: string[]
  readouts?: StringKey[]
}

export interface RangeSliderFilterDef {
  type: 'range-slider'
  field: string
  name: string
  nameKey: StringKey
  descKey: StringKey
  min: number
  max: number
  step: number
  defaultValue: [number, number]
  unit?: string
  iconType: 'svg' | 'png'
  iconSvg?: string
  iconPng?: string
  description?: string
  unavailable?: boolean
}

export interface MultiSelectFilterDef {
  type: 'multi-select'
  field: string
  name: string
  nameKey: StringKey
  descKey: StringKey
  options: number[]
  defaultValue: number[]
  iconType: 'svg' | 'png'
  iconSvg?: string
  iconPng?: string
  description?: string
  unavailable?: boolean
}

export type FilterDef = SliderFilterDef | RangeSliderFilterDef | MultiSelectFilterDef

// --- SVG icons ---

const sunSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 17"><g clip-path="url(#a)"><path fill="currentColor" d="m12.153 6.054-.707-.707 2.2-2.2.708.707zm-9.507 8.092.707.707 2.2-2.2-.706-.707zm8.8-1.493 2.2 2.2.707-.706-2.2-2.2zM5.554 5.347l-2.2-2.2-.707.706 2.2 2.2zM9 1.5H8v3h1zm-1 15h1v-3H8zm8-7v-1h-3v1zm-15 0h3v-1H1zM5 9a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0m1 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 .5h16v16H0z"/></clipPath></defs></svg>'

const pedestrianSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="0.5"/><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="0.5"/><line x1="1" y1="13" x2="15" y2="13" stroke="currentColor" stroke-width="0.5"/><line x1="3" y1="1" x2="3" y2="15" stroke="currentColor" stroke-width="0.5"/><line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" stroke-width="2.2"/><line x1="13" y1="1" x2="13" y2="15" stroke="currentColor" stroke-width="0.5"/></svg>'

const carSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="0.5"/><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="0.5"/><line x1="1" y1="13" x2="15" y2="13" stroke="currentColor" stroke-width="0.5"/><line x1="3" y1="1" x2="3" y2="15" stroke="currentColor" stroke-width="0.5"/><line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" stroke-width="3.5"/><line x1="8" y1="1" x2="8" y2="15" stroke="rgba(0,0,0,0.9)" stroke-width="0.8" stroke-dasharray="2 1.5"/><line x1="13" y1="1" x2="13" y2="15" stroke="currentColor" stroke-width="0.5"/></svg>'

const buildingsSvg = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABRklEQVR4AexV0Q7DIAjc9v//vBqTe/ACUQhEqy6tDnpcPc7Y3+flvytgtoFHOfAv3fbcpSzvOsoBtPFb/ozcBZZ/bemAts+97dT4vPlmHVs6AIXaPsfz3qzVe/Pi+7Z2QFS8WvIoB3qnBsyJxoFXnI9yAB3gUwR5nqNxzF/jIx2oylcZjnSATxnNjGic+B6DA2L99KRFAJ8qHEMM5zm24oAXZ4sAkWB20iKA9zTH0MJ5jq044MXZIkAkmJ30CND2NGuJxjF/jT0CauEqwxUw2wmPA9qpwlqiccxfY4+AWrjKYBHApwrH0MR5jq044MXZIkAkmJ3MEMB7n+NQzRkCQhfYI8sUoO393ppMzzMFmBbiBV8B3s5F1V0Hojrp5clxwLsaR90WArQvJedH414fR3kYB94mv4UD/MWMitExzFG8Dc/rHXgAAAD//8+uSJMAAAAGSURBVAMAIfucYfA8q9wAAAAASUVORK5CYII=" style="width:18px;height:18px;filter:brightness(0) invert(0.8);" />'

const shoppingSvg = '<img src="data:image/png;base64,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" style="width:18px;height:18px;filter:brightness(0) invert(0.8);" />'

const measureSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="m15.18 3.89-2.85 2.85-.71-.7 1.61-1.65H9v-1h4.32l-1.7-1.69.71-.7zM0 14.39v-6h16v6zm14-3h1v-2H1v4h1v-2h1v2h1v-3h1v3h1v-2h1v2h1v-3h1v3h1v-2h1v2h1v-3h1v3h1zm-7-8H2.68l1.7-1.65-.71-.7L.82 3.89l2.85 2.85.71-.7-1.61-1.65H7z" clip-rule="evenodd"/></svg>'

export const FILTER_DEFINITIONS: FilterDef[] = [
  {
    type: 'slider', field: 'summer_SI', name: 'Shade Index',
    nameKey: 'filter_summer_SI_name', descKey: 'filter_summer_SI_desc',
    operator: '<', min: 0, max: 1, step: 0.05, defaultValue: 0.4,
    iconType: 'svg', iconSvg: sunSvg,
    description: 'Spring/Summer Shade Index'
  },
  {
    type: 'slider', field: 'class_2k', name: 'Neighbourhood transit',
    nameKey: 'filter_ABw2k_max_name', descKey: 'filter_ABw2k_max_desc',
    unavailable: true,
    // Class 1 = lowest, class 7 = highest. The slider position is
    // CUMULATIVE: each tick selects the top X% of most-connected streets.
    // Left (position 0) = strictest (top 1%, only class 7). Right
    // (position 6) = no filter (100%, all classes 1..7). Default sits at
    // position 2 (top 10%, classes 5..7).
    operator: '>=', min: 1, max: 7, step: 1, defaultValue: 5,
    iconType: 'svg', iconSvg: pedestrianSvg,
    description: 'Street centrality class (1 = lowest, 7 = highest). Slider position = top % of streets selected.',
    // categories are listed in slider-position order (left to right).
    // categoriesReversed=false: position 0 → categories[0] (class 7).
    categories: [7, 6, 5, 4, 3, 2, 1],
    tickLabels: ['1%', '3%', '10%', '20%', '35%', '60%', '100%'],
    readouts: [
      'topPercentSelected', 'topPercentSelected', 'topPercentSelected',
      'topPercentSelected', 'topPercentSelected', 'topPercentSelected',
      'allStreetsSelected'
    ]
  },
  {
    type: 'slider', field: 'class_5k', name: 'City transit',
    nameKey: 'filter_ABw5k_max_name', descKey: 'filter_ABw5k_max_desc',
    unavailable: true,
    // Same cumulative scheme as Neighbourhood transit: left = top 1%
    // (class 7 only), right = 100% (no filter). Default = top 10%.
    operator: '>=', min: 1, max: 7, step: 1, defaultValue: 5,
    iconType: 'svg', iconSvg: carSvg,
    description: 'Street centrality class (1 = lowest, 7 = highest). Slider position = top % of streets selected.',
    categories: [7, 6, 5, 4, 3, 2, 1],
    tickLabels: ['1%', '3%', '10%', '20%', '35%', '60%', '100%'],
    readouts: [
      'topPercentSelected', 'topPercentSelected', 'topPercentSelected',
      'topPercentSelected', 'topPercentSelected', 'topPercentSelected',
      'allStreetsSelected'
    ]
  },
  {
    type: 'slider', field: 'class_ai1k', name: 'Local centers',
    nameKey: 'filter_AIw1kH_mea_name', descKey: 'filter_AIw1kH_mea_desc',
    unavailable: true,
    // Cumulative scheme: each tick selects the top X% of most-central
    // streets. Left = top 5% (class 7 only), right = 100% (all classes,
    // no filter). Default = top 15% (classes 5..7).
    operator: '>=', min: 1, max: 7, step: 1, defaultValue: 5,
    iconType: 'png', iconPng: 'walking.png',
    description: 'Local-centrality class (1 = lowest, 7 = highest). Slider position = top % of streets selected.',
    categories: [7, 6, 5, 4, 3, 2, 1],
    tickLabels: ['5%', '10%', '15%', '25%', '50%', '75%', '100%'],
    readouts: [
      'topPercentSelected', 'topPercentSelected', 'topPercentSelected',
      'topPercentSelected', 'topPercentSelected', 'topPercentSelected',
      'allStreetsSelected'
    ]
  },
  {
    type: 'slider', field: 'FSI500_mea', name: 'Building density',
    nameKey: 'filter_FSI500_mea_name', descKey: 'filter_FSI500_mea_desc',
    unavailable: true,
    operator: '>', min: 0, max: 3, step: 0.1, defaultValue: 1.5,
    iconType: 'svg', iconSvg: buildingsSvg,
    description: 'Floor Space Index within 500m walking distance'
  },
  {
    type: 'slider', field: 'ARw500lm_1', name: 'Commercial proximity',
    nameKey: 'filter_ARw500lm_1_name', descKey: 'filter_ARw500lm_1_desc',
    unavailable: true,
    operator: '>', min: 0, max: 200, step: 5, defaultValue: 60,
    iconType: 'svg', iconSvg: shoppingSvg,
    description: 'Number of shops and restaurants within 500m walking distance'
  },
  {
    type: 'slider', field: 'ADws_mean', name: 'School proximity',
    nameKey: 'filter_ADws_mean_name', descKey: 'filter_ADws_mean_desc',
    unavailable: true,
    operator: '<', min: 0, max: 1000, step: 25, defaultValue: 300, unit: 'm',
    iconType: 'png', iconPng: 'education.png',
    description: 'Walking distance to the closest school or preschool'
  },
  {
    type: 'slider', field: 'ADwm_mean', name: 'Tram/metro proximity',
    nameKey: 'filter_ADwm_mean_name', descKey: 'filter_ADwm_mean_desc',
    unavailable: true,
    operator: '<', min: 0, max: 1000, step: 25, defaultValue: 300, unit: 'm',
    iconType: 'png', iconPng: 'transport.png',
    description: 'Walking distance to the closest tram, metro or railway station'
  },
  {
    type: 'slider', field: 'ADwbu_mean', name: 'Bus stop proximity',
    nameKey: 'filter_ADwbu_mean_name', descKey: 'filter_ADwbu_mean_desc',
    unavailable: true,
    operator: '<', min: 0, max: 1000, step: 25, defaultValue: 300, unit: 'm',
    iconType: 'png', iconPng: 'bus.png',
    description: 'Walking distance to the closest bus stop'
  },
  {
    type: 'range-slider', field: 'width', name: 'Street width',
    nameKey: 'filter_width_name', descKey: 'filter_width_desc',
    min: 0, max: 60, step: 1, defaultValue: [20, 30] as [number, number], unit: 'm',
    iconType: 'svg', iconSvg: measureSvg,
    description: 'Street width in meters'
  }
]
