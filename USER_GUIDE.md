# User Guide — Tel Aviv-Yafo Tree Planting Targets Calculator

This guide explains how to use the calculator at
**https://bdar-lab.github.io/Tel-Aviv-Tree-Planting-Targets-Calculator_V2/**
to identify streets that need tree planting and to estimate how many trees
should be planted there.

The calculator is intended for municipal planners, urban researchers, and
anyone interested in evidence-based tree-planting strategy in Tel Aviv-Yafo.
No login is required.

---

## Table of contents

1. [What the tool does](#1-what-the-tool-does)
2. [Anatomy of the screen](#2-anatomy-of-the-screen)
3. [Working with the map](#3-working-with-the-map)
4. [Filtering streets — the icon bar](#4-filtering-streets--the-icon-bar)
5. [Choosing a calculation method](#5-choosing-a-calculation-method)
6. [Reading the results](#6-reading-the-results)
7. [Exporting the report (CSV / PDF)](#7-exporting-the-report-csv--pdf)
8. [Language and direction (EN / HE)](#8-language-and-direction-en--he)
9. [Troubleshooting](#9-troubleshooting)
10. [Glossary](#10-glossary)

---

## 1. What the tool does

For every street segment in Tel Aviv-Yafo the tool calculates **how many
trees should be planted** to reach a desired tree-canopy outcome. You do
this in two steps:

1. **Filter the streets** that you want to consider candidates for
   planting (for example: streets with low shade, high pedestrian
   activity, far from a bus stop). The map immediately highlights the
   matching streets and shows a live count.
2. **Choose a calculation method** (target canopy ratio or fixed spacing),
   adjust the parameters, and press **Calculate**. The tool fetches the
   selected streets, runs the math, and shows you the recommended number
   of trees to plant in total and broken down by street width.

You can then export the results as a CSV file or print a PDF report that
includes a snapshot of the map.

---

## 2. Anatomy of the screen

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [BDAR logo]   Tel Aviv-Yafo Tree Planting Targets Calculator   Instructions  About   עב/EN │
├──────────────────────┬─────────────────────────────────────────┬───────────┤
│                      │                                         │           │
│   LAYERS PANEL       │                                         │ FILTER BAR│
│   (visibility +      │                                         │           │
│    legend pop-out)   │            MAP                          │ CALCULATOR│
│                      │                                         │  METHOD   │
│   [basemap]          │                                         │  PARAMS   │
│   [fullscreen]       │                                         │  RESULTS  │
│                      │                                         │           │
└──────────────────────┴─────────────────────────────────────────┴───────────┘
```

- **Header (top):** lab logo (links to the BDAR Lab site), centered title,
  Instructions / About dialogs, language toggle.
- **Layers panel (left):** the 11 layers you can show on the map and their
  legends.
- **Map tools (just right of the layers panel):** two square buttons —
  basemap toggle (satellite ↔ default) and fullscreen toggle.
- **Map (center):** the interactive map. Pan with click-drag, zoom with the
  mouse wheel or pinch.
- **Calculator sidebar (right):** the filter icon bar at the top and the
  calculator below it.

---

## 3. Working with the map

### Showing / hiding a layer
Each row in the **Layers panel** has a checkbox on its left. Click it to
toggle the layer on or off. By default only **Selected streets** is on —
the other layers visualize the metrics that drive the filters and are
useful when you want to *see* a metric, not just filter by it.

### Looking at a layer's legend
Each row has a small **legend button** (▤) on its right. Click it to open
the layer's legend in a floating panel just to the right of the layers
panel. Click again to close. The legend button is disabled when the layer
is hidden.

### Changing the basemap
The square **basemap-toggle** button switches between the default basemap
and **satellite imagery**. Click again to switch back. Useful for matching
what you see in the map with the physical street layout.

### Fullscreen
The **fullscreen** button maximizes the browser window. Press it again, or
press Esc, to exit fullscreen.

---

## 4. Filtering streets — the icon bar

The **icon bar** at the top of the right-hand sidebar contains ten filters.
Each icon represents a different metric:

| Icon | Filter | What it measures |
|---|---|---|
| ☀ Sun | **Shade Index** | Spring/Summer canopy shading (0 = full sun, 1 = full shade). Below 0.4 = insufficient shading. |
| Pedestrian grid | **Neighbourhood transit** | Betweenness centrality at a 2 km scale — how much the street mediates neighbourhood walking. |
| Vehicle grid | **City transit** | Betweenness centrality at a 5 km scale — city-wide movement. |
| Walking person | **Local centers** | Closeness centrality at a 1 km scale — proximity to local centers. |
| Buildings | **Building density** | Accessible Floor Space Index (FSI) within 500 m walking distance. |
| Shopping bag | **Commercial proximity** | Number of shops and restaurants within 500 m walking. |
| Education | **School proximity** | Walking distance to the closest school or preschool. |
| Transport | **Tram/metro proximity** | Walking distance to the closest tram, metro or railway station. |
| Bus | **Bus stop proximity** | Walking distance to the closest bus stop. |
| Ruler | **Street width** | Street width in metres (range filter — from / to). |

### Turning a filter on
1. **Click an icon.** The icon highlights blue and a popover appears with
   a slider for the metric.
2. **Drag the slider.** The map updates live: the "Selected streets"
   layer redraws to show only segments that pass the filter, and the
   small blue text in the sidebar updates the count (e.g.
   *"4,231 street segments selected."*).
3. **Read the popover.** It tells you the current threshold (e.g.
   *"Less than 0.4"*) and, for the more complex metrics, the **Jenks
   class** the value falls into (a coarse classification of the value
   range for that metric). The class number is just a reading aid — the
   underlying numeric threshold is what's applied.

### Turning multiple filters on
You can stack filters: turning on **Shade Index < 0.4** plus
**Bus stop proximity > 300 m** selects streets that are simultaneously
under-shaded and far from public transit. Filters are combined with
logical **AND**.

### Turning a filter off
Click the same icon again. The popover closes, the icon stops glowing,
and the filter is removed from the SQL query.

### Resetting everything
The **Reset Filters** button just under the icon bar turns every filter
off and returns the map to showing all streets.

### Range filter — Street width
The Street-width icon opens a popover with **two** sliders: a minimum and
a maximum width (in metres). Streets are selected if their width falls
between the two values, inclusive.

---

## 5. Choosing a calculation method

Below the segment count is the **Calculation Method** section with two
methods. The one you pick determines the formula used to estimate the
number of trees per segment.

### Method 1 — Target Tree Canopy Cover Ratio (TCCR)

This method asks "how many trees do I need on each segment so that, when
they reach maturity, their crowns together cover X% of the segment's
area?"

Pick one of two sub-modes:

- **1a — Global.** You set one target TCCR value (between 0.0 and 1.0)
  that applies to every selected street. Default 0.6. Use this when you
  want a single uniform shading goal across the city.
- **1b — By street width.** You give a different target TCCR for each of
  the five street-width classes (`<10 m`, `10–20 m`, `20–30 m`, `40 m`,
  `>40 m`). Use this when narrower streets should be more densely planted
  than wider ones (or vice versa).

The number of trees per segment is computed as
*ceil((target_TCCR × segment_area) / canopy_area)*, where canopy area
comes from the crown-diameter parameter (see below).

### Method 2 — Fixed Spacing

This method asks "how many trees do I get on each segment if I plant them
at a fixed distance apart on each side?" You enter the **Desired Spacing**
in metres; the tool plants *2 rows* (one per side) with that spacing along
the segment length. The number of trees per segment is
*2 × (floor(length / spacing) + 1)*.

Method 2 also outputs the **resulting** TCCR as a secondary number — this
is just a check on what spacing would mean in canopy-cover terms.

### Calculation parameters

The **Calculation Parameters** box just below the method picker contains
the inputs that the formulas use:

- **Crown diameter (m)** — the diameter at maturity of a "typical" tree
  you intend to plant. Default 8. This is the only parameter that matters
  for both methods (it sets the canopy area used to compute TCCR).
- **Global target TCCR (0.0 – 1.0)** — shown when Method 1a is active.
- **TCCR targets by street width** — shown when Method 1b is active. One
  text box per width class.
- **Desired Spacing (m)** — shown when Method 2 is active. Default 25.

After you have your filters and your parameters, press the big blue
**Calculate** button.

---

## 6. Reading the results

While the calculation runs you see *"Fetching records…"* and then
*"Calculated N segments."* Once it finishes, a results panel appears
inside the sidebar:

### Headline numbers
- **Selected segments** — how many street segments matched your filters.
- **Total street length** — sum of segment lengths, in metres.
- **Ideal trees** — the number of trees needed to reach the target
  (ignoring trees already on the street).
- **Existing shade trees** — trees already on the segments whose crown
  diameter is **≥ 5 m**, taken from aerial-imagery extraction.
- **Underdeveloped trees** — existing trees with crown diameter **< 5 m**.
  These are *not* subtracted from the target, because they don't yet
  shade much.
- **New trees to plant** *(highlighted)* — what you actually need to
  plant: `Ideal − Existing shade`, never below zero.
- **Weighted TCCR** — the canopy ratio implied by your number of trees,
  weighted by segment area.
- **Avg. Spacing** — the average distance between trees implied by your
  total, assuming 2 rows.

### Analysis by width
Below the headline numbers is a breakdown into the five width classes
(`<10 m` … `>40 m`). For each class you see:
- How many new trees to plant
- The resulting TCCR
- The average spacing and the total length in that class

This breakdown is the most useful piece for planning crews and budgets,
because narrow and wide streets often need different planting strategies.

### Applied assumptions
These show up in the printable PDF (next section). They are a
human-readable version of every filter you turned on — e.g.
*"Spring/Summer Shade Index: less than 0.4."* They are saved with the
report so the assumptions behind a number are never lost.

---

## 7. Exporting the report (CSV / PDF)

Two buttons appear inside the results panel:

### Export CSV
Downloads a file called **`tree_planting_potential_report.csv`** with one
row per street-width class:
```
Category, Ideal number of trees, Existing shade trees, Existing underdeveloped trees,
New trees to plant, Length(m), TCCR, Spacing(m)
```
Open it in Excel or any spreadsheet tool for further analysis.

### Print PDF
Opens a new browser tab with a printable report that contains:
- Title and date
- All the filter assumptions, as a bulleted list
- A screenshot of the current map (with your filters applied)
- The headline numbers
- The per-width breakdown
- A small footer naming the BDAR lab and the date

Use your browser's **Print** dialog to save it as PDF or send it to a
printer. The report is generated in whichever language is currently
active.

> **Tip:** for the cleanest PDF, zoom and pan the map to the area you
> care about *before* pressing **Print PDF** — the screenshot is taken
> from the live map view.

---

## 8. Language and direction (EN / HE)

The toggle on the **far-right of the header** switches between English
and Hebrew. The active language is bright white; the inactive one is
dimmed.

Your choice is **remembered** in your browser (so refreshing keeps you
in the same language). The first time you open the site, the language
is taken from your browser's language setting — Hebrew browsers see
Hebrew, everything else sees English.

Hebrew text is right-aligned inside the calculator panel, the popovers,
the layers panel, the dialogs, and the printable PDF report. The overall
screen layout (logo on the left, calculator on the right) stays the same
in both languages.

---

## 9. Troubleshooting

**"No records found." after pressing Calculate.**
Your filters together select zero streets. Open the Reset Filters button
or relax the most aggressive filter — usually a too-narrow Street width
range or a too-strict Shade Index threshold.

**"Error fetching features."**
The ArcGIS feature service is temporarily unreachable. Wait a moment and
try again. If it persists, refresh the page.

**Map is blank / spinner never stops on first load.**
The browser is still downloading the ArcGIS SDK (≈2 MB). On a slow
connection the first paint can take 10–20 seconds. Subsequent visits use
the browser cache and load almost instantly.

**The "Print PDF" button does nothing.**
Your browser is blocking pop-ups. Allow pop-ups for this site and try
again.

**A filter looks like it isn't doing anything.**
Some filters only affect *some* layers visually (because each layer has
its own renderer). The authoritative effect is always on the
**Selected streets** layer — keep that one visible to be sure of what
your filters select.

**Layers panel is hidden behind the map.**
Resize the browser window — at very small widths the layers panel is
hidden by design to give the map more room.

---

## 10. Glossary

- **TCCR — Tree Canopy Cover Ratio.** The fraction of a street segment's
  area covered by tree crowns at maturity. Used by Method 1.
- **Crown diameter.** The diameter of a tree's canopy at maturity.
  The calculator assumes circular canopies and computes the canopy area
  as π × (crown_diameter / 2)².
- **Street segment.** A short stretch of street between two intersections.
  Every street in the data is split into segments.
- **W_type / width class.** A categorical bucket for segment width
  (1 = `<10 m`, 2 = `10–20 m`, 3 = `20–30 m`, 4 = `40 m`,
  5 = `>40 m`). Width-class targets are set per bucket in Method 1b.
- **Existing shade tree.** An existing tree on a segment with crown
  diameter **≥ 5 m**. These are subtracted from the *Ideal trees* target.
- **Underdeveloped tree.** An existing tree with crown diameter
  **< 5 m**. These are *not* subtracted (they don't yet shade much).
- **Jenks natural breaks.** A statistical method used by some sliders to
  group continuous values into classes that match the data's
  distribution rather than fixed intervals.
- **Betweenness centrality.** Network metric: how often a street appears
  on the shortest path between any two other streets within a given
  radius. High values = streets people pass through a lot.
- **Closeness centrality.** Network metric: how short, on average, the
  distance is from a street to every other street within a given
  radius. High values = streets close to many other places.
- **FSI — Floor Space Index.** Total gross floor area of buildings within
  500 m walking distance, divided by the reachable land area.

---

## Credits and data

Developed by the **Big Data in Architectural Research Lab (BDAR Lab)** at
the Faculty of Architecture and Town Planning, Technion — Israel
Institute of Technology, as part of a research project funded by the
Israeli Ministry of Innovation, Science and Technology.

Research team: Or Aleksandrowicz, Sivan Sharabi, Evgeniya Bobkova,
Daniel Rosenberg.

Data sources: Survey of Israel, Tel Aviv-Yafo Municipality, OpenStreetMap.
All data sources used at runtime are public ArcGIS feature services on
`services1.arcgis.com`.

The methodological background, references, and full algorithm details
are available inside the app — click **Instructions** in the header.
