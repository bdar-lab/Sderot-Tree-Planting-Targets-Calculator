import { type Locale } from './locale'

// ─────────────────────────────────────────────────────────────────────────
// Calculator + filter-bar strings (ported from tree_potential_v2/i18n.ts)
// ─────────────────────────────────────────────────────────────────────────

export type StringKey =
  // Slider/popover labels
  | 'low' | 'high' | 'min' | 'max'
  | 'lessThan' | 'greaterThan'
  | 'jenksClass'
  | 'topPercentSelected'
  | 'allStreetsSelected'
  | 'filterNotAvailable'
  // Filter bar
  | 'resetFilters'
  // Calculator section
  | 'instruction'
  | 'calculationMethod' | 'calculationParameters'
  | 'method1' | 'method1aGlobal' | 'method1bByWidth' | 'method2'
  | 'crownDiameter' | 'globalTccr' | 'tccrTargetsByWidth' | 'desiredSpacing'
  | 'calculate' | 'processing'
  // Status messages
  | 'streetSegmentsSelected' | 'fetchingRecords' | 'layerNotAvailable'
  | 'noRecordsFound' | 'calculatedSegments' | 'errorFetching'
  | 'manualSelection' | 'allSegments'
  // Results section
  | 'results' | 'selectedSegments' | 'totalStreetLength'
  | 'idealTrees' | 'existingShadeTrees' | 'underdevelopedTrees'
  | 'newTreesToPlant' | 'weightedTccr' | 'avgSpacing'
  | 'exportCsv' | 'printPdf'
  | 'analysisByWidth' | 'addTrees' | 'tccrLabel' | 'spacingLabel' | 'lengthLabel'
  | 'classLabel'
  // PDF report
  | 'pdfTitle' | 'pdfAppliedAssumptions' | 'pdfChosenMethod' | 'pdfParameters'
  | 'pdfTotalSegments' | 'pdfTotalLength'
  | 'pdfResultsSummary' | 'pdfMetric' | 'pdfValue'
  | 'pdfIdealTrees' | 'pdfExistingShade' | 'pdfExistingUnder'
  | 'pdfNewTrees' | 'pdfAvgTccr' | 'pdfAvgSpacing'
  | 'pdfResultsByWidth' | 'pdfWidth' | 'pdfTreesToAdd'
  | 'pdfFooter'
  | 'pdfMethod1Global' | 'pdfMethod1ByWidth' | 'pdfMethod2' | 'pdfTargetsPerWidth'
  // Filter descriptions (popover text)
  | 'filter_summer_SI_name' | 'filter_summer_SI_desc'
  | 'filter_ABw2k_max_name' | 'filter_ABw2k_max_desc'
  | 'filter_ABw5k_max_name' | 'filter_ABw5k_max_desc'
  | 'filter_AIw1kH_mea_name' | 'filter_AIw1kH_mea_desc'
  | 'filter_FSI500_mea_name' | 'filter_FSI500_mea_desc'
  | 'filter_ARw500lm_1_name' | 'filter_ARw500lm_1_desc'
  | 'filter_ADws_mean_name' | 'filter_ADws_mean_desc'
  | 'filter_ADwm_mean_name' | 'filter_ADwm_mean_desc'
  | 'filter_ADwbu_mean_name' | 'filter_ADwbu_mean_desc'
  | 'filter_width_name' | 'filter_width_desc'
  // SQL→text translations for "Applied assumptions"
  | 'sql_summer_SI' | 'sql_ABw2k_max' | 'sql_ABw5k_max' | 'sql_AIw1kH_mea'
  | 'sql_FSI500_mea' | 'sql_ARw500lm_1' | 'sql_ADws_mean' | 'sql_ADwm_mean'
  | 'sql_ADwbu_mean' | 'sql_width'
  | 'sql_isBetween' | 'sql_lessThan' | 'sql_greaterThan'
  | 'sql_lessOrEqual' | 'sql_greaterOrEqual' | 'sql_equalTo' | 'sql_and'
  // App shell (header buttons, map tools) — merged from filter-layer-sync
  // and map-tools i18n files
  | 'instructions' | 'about'
  | 'toggleBasemap' | 'toggleFullscreen'

const en: Record<StringKey, string> = {
  low: 'Low', high: 'High', min: 'Min', max: 'Max',
  lessThan: 'Less than', greaterThan: 'Greater than',
  jenksClass: 'Class {n} of {m} (Jenks natural breaks)',
  topPercentSelected: 'Top {p} of streets selected',
  allStreetsSelected: 'All streets selected',
  filterNotAvailable: 'Not available in Sderot',

  resetFilters: 'Reset Filters',

  instruction: "Using the above buttons, filter out streets that do not require planting (by default, all the city's streets are considered). Next, choose the target calculation method, change the calculation parameters as you wish, and press Calculate.",
  calculationMethod: 'Calculation Method',
  calculationParameters: 'Calculation Parameters',
  method1: 'Method 1: Target Tree Canopy Cover Ratio (TCCR)',
  method1aGlobal: '1a: Global',
  method1bByWidth: '1b: By street width',
  method2: 'Method 2: Fixed Spacing',
  crownDiameter: 'Crown diameter (m)',
  globalTccr: 'Global target TCCR (0.0 - 1.0)',
  tccrTargetsByWidth: 'TCCR targets by street width:',
  desiredSpacing: 'Desired Spacing (m)',
  calculate: 'Calculate',
  processing: 'Processing...',

  streetSegmentsSelected: '{n} street segments selected.',
  fetchingRecords: 'Fetching records...',
  layerNotAvailable: 'Layer not available.',
  noRecordsFound: 'No records found.',
  calculatedSegments: 'Calculated {n} segments.',
  errorFetching: 'Error fetching features.',
  manualSelection: 'Manual selection ({n} segments):',
  allSegments: 'All segments:',

  results: 'Results',
  selectedSegments: 'Selected segments:',
  totalStreetLength: 'Total street length:',
  idealTrees: 'Ideal trees:',
  existingShadeTrees: 'Existing shade trees:',
  underdevelopedTrees: 'Underdeveloped trees:',
  newTreesToPlant: 'New trees to plant:',
  weightedTccr: 'Weighted TCCR:',
  avgSpacing: 'Avg. Spacing:',
  exportCsv: 'Export CSV',
  printPdf: 'Print PDF',
  analysisByWidth: 'Analysis by width:',
  addTrees: 'Add {n} trees',
  tccrLabel: 'TCCR',
  spacingLabel: 'Spacing',
  lengthLabel: 'Length',
  classLabel: 'Class',

  pdfTitle: 'Tree Planting Targets Calculation',
  pdfAppliedAssumptions: 'Applied assumptions:',
  pdfChosenMethod: 'Chosen Method:',
  pdfParameters: 'Parameters',
  pdfTotalSegments: 'Total number of selected streets segments',
  pdfTotalLength: 'Total street length',
  pdfResultsSummary: 'Results Summary',
  pdfMetric: 'Metric',
  pdfValue: 'Value',
  pdfIdealTrees: 'Ideal number of trees',
  pdfExistingShade: 'Existing shade trees',
  pdfExistingUnder: 'Existing underdeveloped trees',
  pdfNewTrees: 'New trees to plant',
  pdfAvgTccr: 'Average TCCR',
  pdfAvgSpacing: 'Average spacing',
  pdfResultsByWidth: 'Results by street width',
  pdfWidth: 'Width',
  pdfTreesToAdd: 'Trees to Add',
  pdfFooter: 'Big Data in Architectural Research Lab, Technion',
  pdfMethod1Global: 'Method 1: Target TCCR (global)',
  pdfMethod1ByWidth: 'Method 1: Target TCCR (by street width)',
  pdfMethod2: 'Method 2: Fixed Spacing',
  pdfTargetsPerWidth: 'Targets: per width class',

  filter_summer_SI_name: 'Shade Index',
  filter_summer_SI_desc: 'Spring/Summer Shade Index',
  filter_ABw2k_max_name: 'Neighbourhood transit',
  filter_ABw2k_max_desc: '2 km betweenness centrality: how often a street lies on shortest paths between other streets within 2 km, indicating local through-movement potential. The slider selects the top % of centrality values.',
  filter_ABw5k_max_name: 'City transit',
  filter_ABw5k_max_desc: '5 km betweenness centrality: how often a street lies on shortest paths between other streets within 5 km, indicating city-scale through-movement potential. The slider selects the top % of centrality values.',
  filter_AIw1kH_mea_name: 'Local centers',
  filter_AIw1kH_mea_desc: '1 km closeness centrality: how close a street is to all other streets within 1 km, indicating accessibility to nearby streets. The slider selects the top % of centrality values.',
  filter_FSI500_mea_name: 'Building density',
  filter_FSI500_mea_desc: 'Floor Space Index within 500 m walking distance',
  filter_ARw500lm_1_name: 'Commercial proximity',
  filter_ARw500lm_1_desc: 'Number of shops and restaurants within 500m walking distance',
  filter_ADws_mean_name: 'School proximity',
  filter_ADws_mean_desc: 'Walking distance to the closest school or preschool',
  filter_ADwm_mean_name: 'Tram/metro proximity',
  filter_ADwm_mean_desc: 'Walking distance to the closest tram, metro or railway station',
  filter_ADwbu_mean_name: 'Bus stop proximity',
  filter_ADwbu_mean_desc: 'Walking distance to the closest bus stop',
  filter_width_name: 'Street width',
  filter_width_desc: 'Street width in meters',

  sql_summer_SI: 'Spring/Summer Shade Index',
  sql_ABw2k_max: 'Neighbourhood transit class (2 km scale)',
  sql_ABw5k_max: 'City transit class (5 km scale)',
  sql_AIw1kH_mea: 'Local centers class (1 km scale)',
  sql_FSI500_mea: 'Floor Space Index within 500 m walking distance',
  sql_ARw500lm_1: 'Number of shops and restaurants within 500 m walking distance',
  sql_ADws_mean: 'Walking distance to the closest school or preschool',
  sql_ADwm_mean: 'Walking distance to the closest tram, metro or railway station',
  sql_ADwbu_mean: 'Walking distance to the closest bus stop',
  sql_width: 'Street width',
  sql_isBetween: 'is between',
  sql_lessThan: 'less than',
  sql_greaterThan: 'greater than',
  sql_lessOrEqual: 'less than or equal to',
  sql_greaterOrEqual: 'greater than or equal to',
  sql_equalTo: 'equal to',
  sql_and: 'and',

  instructions: 'Instructions',
  about: 'About',
  toggleBasemap: 'Toggle basemap',
  toggleFullscreen: 'Toggle fullscreen'
}

const he: Record<StringKey, string> = {
  low: 'נמוך', high: 'גבוה', min: 'מינ׳', max: 'מקס׳',
  lessThan: 'פחות מ־', greaterThan: 'יותר מ־',
  jenksClass: 'קבוצה {n} מתוך {m} (שבירות טבעיות, Jenks)',
  topPercentSelected: 'נבחרו {p} העליונים מהרחובות',
  allStreetsSelected: 'כל הרחובות נבחרו',
  filterNotAvailable: 'לא זמין בשדרות',

  resetFilters: 'אפס מסננים',

  instruction: 'באמצעות הלחצנים שלמעלה, סננו החוצה רחובות שאינם דורשים נטיעה (כברירת מחדל, כל רחובות העיר נכללים בחישוב). לאחר מכן, בחרו את שיטת חישוב היעד, שנו את הפרמטרים לחישוב לפי הצורך ולחצו על "חשב".',
  calculationMethod: 'שיטת חישוב',
  calculationParameters: 'פרמטרים לחישוב',
  method1: 'שיטה 1: יעד המבוסס על שיעור כיסוי חופת עצים (TCCR)',
  method1aGlobal: '1א: גלובלי',
  method1bByWidth: '1ב: לפי רוחב הרחוב',
  method2: 'שיטה 2: מרווח נטיעה קבוע',
  crownDiameter: 'קוטר נוף (מ׳)',
  globalTccr: 'יעד TCCR גלובלי (0.0 - 1.0)',
  tccrTargetsByWidth: 'יעדי TCCR לפי רוחב הרחוב:',
  desiredSpacing: 'מרווח רצוי (מ׳)',
  calculate: 'חשב',
  processing: 'מעבד...',

  streetSegmentsSelected: '{n} מקטעי רחוב נבחרו.',
  fetchingRecords: 'טוען נתונים...',
  layerNotAvailable: 'השכבה אינה זמינה.',
  noRecordsFound: 'לא נמצאו רשומות.',
  calculatedSegments: 'חושבו {n} מקטעים.',
  errorFetching: 'שגיאה בטעינת המקטעים.',
  manualSelection: 'בחירה ידנית ({n} מקטעים):',
  allSegments: 'כל המקטעים:',

  results: 'תוצאות',
  selectedSegments: 'מקטעים נבחרים:',
  totalStreetLength: 'אורך רחוב כולל:',
  idealTrees: 'עצים אידיאליים:',
  existingShadeTrees: 'עצי צל קיימים:',
  underdevelopedTrees: 'עצים לא מפותחים:',
  newTreesToPlant: 'עצים חדשים לנטיעה:',
  weightedTccr: 'TCCR משוקלל:',
  avgSpacing: 'מרווח ממוצע:',
  exportCsv: 'ייצוא כקובץ CSV',
  printPdf: 'הדפסת PDF',
  analysisByWidth: 'ניתוח לפי רוחב:',
  addTrees: 'הוספת {n} עצים',
  tccrLabel: 'TCCR',
  spacingLabel: 'מרווח',
  lengthLabel: 'אורך',
  classLabel: 'קבוצה',

  pdfTitle: 'חישוב יעדי נטיעת עצים',
  pdfAppliedAssumptions: 'הנחות שיושמו:',
  pdfChosenMethod: 'שיטה שנבחרה:',
  pdfParameters: 'פרמטרים',
  pdfTotalSegments: 'מספר מקטעי רחוב נבחרים',
  pdfTotalLength: 'אורך רחוב כולל',
  pdfResultsSummary: 'סיכום תוצאות',
  pdfMetric: 'מדד',
  pdfValue: 'ערך',
  pdfIdealTrees: 'מספר עצים אידיאלי',
  pdfExistingShade: 'עצי צל קיימים',
  pdfExistingUnder: 'עצים לא מפותחים קיימים',
  pdfNewTrees: 'עצים חדשים לנטיעה',
  pdfAvgTccr: 'TCCR ממוצע',
  pdfAvgSpacing: 'מרווח ממוצע',
  pdfResultsByWidth: 'תוצאות לפי רוחב רחוב',
  pdfWidth: 'רוחב',
  pdfTreesToAdd: 'עצים להוספה',
  pdfFooter: 'מעבדת נתוני עתק במחקר אדריכלי, הטכניון',
  pdfMethod1Global: 'שיטה 1: יעד TCCR (גלובלי)',
  pdfMethod1ByWidth: 'שיטה 1: יעד TCCR (לפי רוחב רחוב)',
  pdfMethod2: 'שיטה 2: מרווח נטיעה קבוע',
  pdfTargetsPerWidth: 'יעדים: לפי קבוצת רוחב',

  filter_summer_SI_name: 'מדד הצללה',
  filter_summer_SI_desc: 'מדד ההצללה באביב/בקיץ',
  filter_ABw2k_max_name: 'תנועה שכונתית',
  filter_ABw2k_max_desc: 'מרכזיות בין־קודקודית 2 ק״מ: באיזו תדירות רחוב נמצא על המסלולים הקצרים ביותר בין רחובות אחרים בטווח של 2 ק״מ — מדד לפוטנציאל תנועת מעבר מקומית. הסליידר בוחר את האחוז העליון של ערכי המרכזיות.',
  filter_ABw5k_max_name: 'תנועה עירונית',
  filter_ABw5k_max_desc: 'מרכזיות בין־קודקודית 5 ק״מ: באיזו תדירות רחוב נמצא על המסלולים הקצרים ביותר בין רחובות אחרים בטווח של 5 ק״מ — מדד לפוטנציאל תנועת מעבר ברמה עירונית. הסליידר בוחר את האחוז העליון של ערכי המרכזיות.',
  filter_AIw1kH_mea_name: 'מרכזים מקומיים',
  filter_AIw1kH_mea_desc: 'מרכזיות קרבה 1 ק״מ: עד כמה רחוב קרוב לכל הרחובות האחרים בטווח של 1 ק״מ — מדד לנגישות לרחובות סמוכים. הסליידר בוחר את האחוז העליון של ערכי המרכזיות.',
  filter_FSI500_mea_name: 'צפיפות בנייה',
  filter_FSI500_mea_desc: 'מדד שטח רצפה (FSI) במרחק הליכה של 500 מ׳',
  filter_ARw500lm_1_name: 'קרבה למסחר',
  filter_ARw500lm_1_desc: 'מספר חנויות ומסעדות במרחק הליכה של 500 מ׳',
  filter_ADws_mean_name: 'קרבה לבית ספר',
  filter_ADws_mean_desc: 'מרחק הליכה לבית הספר או לגן הילדים הקרובים ביותר',
  filter_ADwm_mean_name: 'קרבה לרכבת/למטרו',
  filter_ADwm_mean_desc: 'מרחק הליכה לתחנת הרכבת הקלה, המטרו או הרכבת הקרובה ביותר',
  filter_ADwbu_mean_name: 'קרבה לתחנת אוטובוס',
  filter_ADwbu_mean_desc: 'מרחק הליכה לתחנת האוטובוס הקרובה ביותר',
  filter_width_name: 'רוחב רחוב',
  filter_width_desc: 'רוחב הרחוב במטרים',

  sql_summer_SI: 'מדד ההצללה באביב/בקיץ',
  sql_ABw2k_max: 'קטגוריית תנועה שכונתית (2 ק״מ)',
  sql_ABw5k_max: 'קטגוריית תנועה עירונית (5 ק״מ)',
  sql_AIw1kH_mea: 'קטגוריית מרכזים מקומיים (1 ק״מ)',
  sql_FSI500_mea: 'מדד שטח רצפה במרחק הליכה של 500 מ׳',
  sql_ARw500lm_1: 'מספר חנויות ומסעדות במרחק הליכה של 500 מ׳',
  sql_ADws_mean: 'מרחק הליכה לבית ספר או לגן ילדים',
  sql_ADwm_mean: 'מרחק הליכה לתחנת רכבת קלה, מטרו או רכבת',
  sql_ADwbu_mean: 'מרחק הליכה לתחנת אוטובוס',
  sql_width: 'רוחב רחוב',
  sql_isBetween: 'בטווח',
  sql_lessThan: 'פחות מ־',
  sql_greaterThan: 'יותר מ־',
  sql_lessOrEqual: 'קטן או שווה ל־',
  sql_greaterOrEqual: 'גדול או שווה ל־',
  sql_equalTo: 'שווה ל־',
  sql_and: 'ועד',

  instructions: 'הוראות',
  about: 'אודות',
  toggleBasemap: 'שינוי מפת רקע',
  toggleFullscreen: 'שינוי מצב מסך מלא'
}

const STRINGS: Record<Locale, Record<StringKey, string>> = { en, he }

export function t (locale: Locale, key: StringKey, vars?: Record<string, string | number>): string {
  let s = STRINGS[locale]?.[key] ?? STRINGS.en[key] ?? key
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]))
    }
  }
  return s
}

// Width-class labels
export const CATEGORY_LABELS: Record<Locale, Record<string, string>> = {
  en: { '1': '<10m', '2': '10-20m', '3': '20-30m', '4': '30-40m', '5': '>40m' },
  he: { '1': 'עד 10 מ׳', '2': '20-10 מ׳', '3': '30-20 מ׳', '4': '40-30 מ׳', '5': 'מעל 40 מ׳' }
}

// ─────────────────────────────────────────────────────────────────────────
// Map layer titles (ported from filter-layer-sync/i18n.ts). Keyed by the
// canonical English title published by the ArcGIS web map.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Layer titles are keyed by their canonical English name as published in
 * the Sderot web map, and translated per-locale for the layers panel.
 * Layers not listed here render with whatever title the web map ships.
 */
export const LAYER_TITLES: Record<Locale, Record<string, string>> = {
  en: {
    'SDR street summer shade index': 'Street Shade Index (summer)',
    'SDR extracted street tree locations 2025': 'Existing street trees'
  },
  he: {
    'SDR street summer shade index': 'מדד הצללה ברחובות (קיץ)',
    'SDR extracted street tree locations 2025': 'עצי רחוב קיימים'
  }
}

// Site title shown in the header
export const SITE_TITLE: Record<Locale, string> = {
  en: 'Sderot Tree Planting Targets Calculator',
  he: 'מחשבון יעדי נטיעת עצים בשדרות'
}
