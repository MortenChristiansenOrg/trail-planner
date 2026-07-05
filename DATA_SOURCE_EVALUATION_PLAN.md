# Data Source Evaluation Plan

This plan turns `DATA_SOURCE_RESEARCH.md` into an executable checklist. The goal is not to build the final integration layer. The goal is to quickly prove which sources are viable, exactly what data they provide, what limits they have, and to leave behind small reproducible POCs with saved sample data.

## Success Criteria

Each checked source should produce:

- A verdict: `viable`, `viable_with_limits`, `manual_only`, `blocked`, or `reject`.
- One small POC integration, unless the source is clearly rejected before implementation.
- Saved raw sample data from the source.
- A normalized sample output showing the fields Trail Planner could actually use.
- Notes on access, legal/storage constraints, freshness, coverage, cost, and operational risks.
- A short analysis of technical limitations and opportunities.

## Progress Tracker

Status values:

- `todo`: not started.
- `access_check`: reading docs, checking signup/API key/terms.
- `poc`: building or running the smallest useful integration.
- `analysis`: documenting data shape, limitations, and product fit.
- `done`: verdict recorded and sample data saved.
- `blocked`: waiting on access, approval, account, or unclear terms.
- `skip`: intentionally not evaluated for MVP.

| Area | Sources | Status | Done / Total | Notes |
| --- | --- | --- | ---: | --- |
| Route geometry and trail inventory | Overpass, Geofabrik, Waymarked Trails, User GPX, AllTrails, official route pages | done | 6 / 6 | Overpass and GPX are usable; Waymarked/AllTrails/official pages are evidence/manual inputs. |
| Elevation and terrain | OpenTopography, Copernicus DEM, AWS Terrain Tiles, MapTiler elevation | done | 4 / 4 | AWS Terrain Tiles worked live; MapTiler blocked by key; DEM sources need production cache decisions. |
| Maps and geocoding | MapLibre, MapTiler Cloud, OpenMapTiles, Nominatim, Photon | done | 5 / 5 | MapLibre viable; Photon/Nominatim viable with limits; hosted/self-host map choices remain product decisions. |
| Road routing | openrouteservice, GraphHopper, Valhalla, OSRM | done | 4 / 4 | OSRM public demo worked; ORS/GraphHopper blocked by keys; Valhalla self-host path documented. |
| Public transport | Rejseplanen, Entur, Transitland, Navitia, OTP, national APIs, local shuttles | done | 7 / 7 | Entur works for Norway trunk transit; several APIs are key-gated; local tourist transport is manual-only. |
| Flights and airports | Amadeus, Duffel, Kiwi/Tequila, OpenSky, airport metadata | done | 5 / 5 | Airport metadata works; Amadeus/Duffel need credentials; OpenSky rejected for planning. |
| Ferries and driving costs | Direct Ferries, ferry operators, TollGuru, fuel prices, parking fees, car rental | done | 6 / 6 | Fuel/rates work; ferry/parking/rental mostly manual or partner-gated. |
| Amenities and bailout points | OSM POIs, official route/hut stage descriptions | done | 2 / 2 | OSM amenities work with false-positive limits; official stage details are curated evidence. |
| Lodging and huts | Booking.com, Amadeus Hotels, OSM lodging, DNT cabins, hut associations, campsites/wild camping | done | 6 / 6 | OSM can discover candidates; live availability/prices and hut systems are blocked/manual. |
| Weather and seasonality | Open-Meteo, MET/Frost, Varsom/Regobs, sunrise/sunset, official seasonal pages | done | 5 / 5 | Weather/daylight/hazard samples work; official seasonal pages remain curated source links. |
| Hiking quality signals | derived scoring, OSM tags/POIs, manual ratings, photos | done | 4 / 4 | Explainable quality signals are feasible but prototype-only; no proprietary ranking dependency. |
| Provenance and attribution | source provenance store, license registry | done | 2 / 2 | Minimal registry and provenance schemas created. |
| Closures and disruptions | transit disruptions, road/ferry disruptions, trail/park alerts | done | 3 / 3 | Machine-readable coverage is fragmented; manual official-alert records are required. |
| Candidate discovery | curated seed list, OSM mining, official best-hike lists | done | 3 / 3 | Curated seed list is viable; OSM mining/official lists are supporting signals. |
| Cost and currency | exchange rates, default assumptions | done | 2 / 2 | Official rates and fuel assumptions work; default costs must stay visibly approximate. |

## Repository Output Structure

Create one folder per source:

```text
data-source-pocs/
  <area>/
    <source-slug>/
      README.md
      poc.sh | poc.py | poc.ts
      raw/
        sample-<case>.json
        sample-<case>.xml
        sample-<case>.csv
      normalized/
        sample-<case>.json
      analysis.md
```

Use the smallest implementation that proves integration. Prefer direct HTTP requests and standard parsers. Do not build a reusable abstraction until multiple POCs prove a shared shape.

Do not commit API keys, account credentials, tokens, or paid-provider responses that terms prohibit storing. For key-gated sources, commit the script, `.env.example`, response schema notes, and a small redacted sample if allowed.

## Standard Test Cases

Use the same cases across sources where possible:

| Case | Purpose | Coordinates / Route |
| --- | --- | --- |
| Besseggen | Norway route geometry, ferry/boat, bus, weather, huts | Gjendesheim / Jotunheimen |
| Trolltunga | Parking, shuttle, high-demand route, weather, road access | Skjeggedal / Odda |
| Romsdalseggen | Point-to-point logistics and local shuttle | Andalsnes / Romsdalen |
| Laugavegur | Multi-day route, huts, weather, buses, water/resupply | Iceland highlands |
| Ben Nevis CMD | Scotland routing, transit, weather, route geometry | Fort William |
| Dolomites sample | Alps huts, transit, seasonality, route quality | Pick one route during evaluation |
| Aalborg origin | Common home origin for travel-time and cost comparisons | Aalborg, Denmark |

## Per-Source Workflow

1. **Access check**
   - Read official docs and terms.
   - Record whether access is public, key-gated, partner-gated, paid, self-hosted, or manual-only.
   - Record storage/cache permissions, attribution needs, rate limits, and commercial restrictions.

2. **Minimal query**
   - Run one request for one standard test case.
   - Save the raw response in `raw/`.
   - Record the exact command, endpoint, query parameters, date, and source version where available.

3. **Normalize**
   - Convert the useful fields into `normalized/sample-<case>.json`.
   - Include provenance fields: `source`, `retrieved_at`, `query`, `license_or_terms_url`, `freshness`, and `confidence`.

4. **Compare**
   - Run the same query for at least two more cases if the first query works.
   - Compare coverage, completeness, precision, and obvious errors.

5. **Analyze**
   - Write `analysis.md`.
   - Assign a verdict and explain why.
   - List product opportunities and limitations.
   - List the next production step only if the source is viable.

## Analysis Template

Use this in each source `analysis.md`:

```markdown
# <Source Name> Analysis

## Verdict

- Verdict:
- MVP role:
- Production role:
- Confidence:

## Access

- Access model:
- Auth required:
- Cost/pricing:
- Rate limits:
- Terms reviewed:
- Storage/cache permission:
- Attribution:

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
|  |  |  |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Technical Limitations

- 

## Opportunities

- 

## Integration Notes

- Endpoint/feed:
- Query shape:
- Response format:
- Update cadence:
- Error handling:
- Required attribution/provenance:

## Next Step

- 
```

## Source Evaluation Queue

Work in passes. Each pass should leave the tracker updated and at least one complete POC folder where possible.

### Pass 1: Core Open Sources

These are most likely to produce immediate useful POCs without commercial approval.

| Source | Status | POC target | Expected output |
| --- | --- | --- | --- |
| User GPX uploads | todo | Parse 2-3 GPX files into route geometry and stats. | Normalized route geometry, distance, basic metadata. |
| OpenStreetMap Overpass | todo | Query route relations, paths, parking, huts, water, transit stops around Besseggen/Trolltunga/Ben Nevis. | Raw Overpass JSON and normalized OSM features. |
| AWS Terrain Tiles | todo | Sample elevation along one GPX route. | Elevation profile and ascent/descent estimate. |
| Open-Meteo | todo | Fetch forecast and historical weather for trailhead and high point. | Daily/hourly weather summary with confidence notes. |
| Sunrise/sunset or local calculation | todo | Calculate daylight for long-route dates. | Daylight window by route/date. |
| Airport metadata | todo | Build candidate airport table for Aalborg and target regions. | CSV/JSON airport seed data. |
| Exchange rates | todo | Fetch official EUR/NOK/SEK/GBP/CHF/ISK to DKK rates. | Currency conversion sample with date. |

### Pass 2: High-Value API Sources

These need keys, accounts, or stricter policy review, but may be central to the product.

| Source | Status | POC target | Expected output |
| --- | --- | --- | --- |
| openrouteservice | todo | Aalborg to Norway trailheads by car. | Route duration, distance, geometry, ferry handling notes. |
| GraphHopper | todo | Same routes as openrouteservice. | Comparison of duration, distance, ferries, and limits. |
| Entur Journey Planner | todo | Bergen/Odda/Skjeggedal and Andalsnes logistics. | Transit itineraries, service dates, alerts if available. |
| Rejseplanen Labs | todo | Aalborg to airports/ferry terminals. | Danish transit itineraries and access constraints. |
| Amadeus Flights | todo | Aalborg/Billund/Copenhagen/Hamburg to selected target airports. | Flight offers, prices, segments, terms notes. |
| Amadeus Hotels | todo | Trailhead-adjacent lodging searches. | Hotel coverage and price/availability sample. |
| MET Norway / Frost | todo | Compare Norway forecast/history against Open-Meteo. | Weather quality comparison and API constraints. |
| Varsom / Regobs | todo | Query hazards/observations around Norwegian test routes. | Hazard sample and safety-disclaimer requirements. |

### Pass 3: Partner-Gated Or Uncertain Sources

These may be important, but should not block the first product proof.

| Source | Status | POC target | Expected output |
| --- | --- | --- | --- |
| Direct Ferries | todo | Check partner access for Denmark-Norway ferry routes. | Access verdict, sample if approved, manual fallback if not. |
| Booking.com Demand API | todo | Check affiliate eligibility and trailhead lodging coverage. | Access verdict and sample if approved. |
| Duffel | todo | Compare flight offers against Amadeus. | Coverage/cost comparison. |
| Kiwi / Tequila | todo | Verify current access model. | Access verdict. |
| TollGuru | todo | Estimate driving costs for Aalborg-Norway and Aalborg-Alps. | Toll/fuel output and pricing constraints. |
| Navitia | todo | Test Scotland/Alps transit coverage. | Coverage verdict by region. |
| Transitland | todo | Discover transit feeds for target regions. | Feed availability matrix. |

### Pass 4: Self-Hosted And Batch Sources

These are useful only if hosted APIs are insufficient or too expensive.

| Source | Status | POC target | Expected output |
| --- | --- | --- | --- |
| Geofabrik OSM extracts | todo | Build tiny local extraction for Norway or one region. | Local route/POI query sample and update notes. |
| OpenMapTiles | todo | Render a local tile sample. | Operational cost/complexity notes. |
| Photon | todo | Test self-hosted place search quality. | Trailhead/place search samples. |
| Valhalla | todo | Run routing against local OSM data. | Custom-routing feasibility notes. |
| OSRM | todo | Test road matrix for candidate screening. | Matrix speed/cost comparison. |
| OpenTripPlanner | todo | Build a Norway graph if feed access is clear. | Entur comparison and maintenance estimate. |

### Pass 5: Manual Or Curated Sources

These should become structured manual datasets with source links and confidence fields.

| Source | Status | POC target | Expected output |
| --- | --- | --- | --- |
| Official route pages | todo | Curate 25 seed routes. | Structured seed data with source URLs. |
| Official seasonal pages | todo | Store season windows for seed routes. | `normal_season_start/end` with source confidence. |
| Local shuttles, boats, tourist buses | todo | Check each early route against APIs and official pages. | Manual transport segment schema. |
| Ferry operator websites | todo | Manually sample schedule/cost windows. | Manual ferry assumption schema. |
| Parking and trailhead fees | todo | Check four target routes. | Fee/parking assumption schema. |
| DNT and hut systems | todo | Determine structured access vs manual links. | Hut/lodging manual fallback schema. |
| Wild-camping legality | todo | Create country/region legal assumption table. | Rule table with source links and confidence. |
| Trail closures and park alerts | todo | List official alert source per seed route. | Machine-readability verdict and manual warning fields. |
| Photos and visual evidence | todo | Check Wikimedia/Mapillary for 10 seed routes. | Licensed media metadata and attribution sample. |

## Minimal Normalized Schemas

Keep these deliberately small until a source proves useful.

### Route Geometry

```json
{
  "id": "besseggen-osm-overpass",
  "name": "Besseggen",
  "source": "openstreetmap_overpass",
  "retrieved_at": "2026-07-05T00:00:00Z",
  "geometry": {
    "type": "LineString",
    "coordinates": []
  },
  "distance_m": null,
  "tags": {},
  "confidence": "sample"
}
```

### Travel Option

```json
{
  "id": "aalborg-to-gjendesheim-car-ors",
  "source": "openrouteservice",
  "retrieved_at": "2026-07-05T00:00:00Z",
  "origin": "Aalborg, DK",
  "destination": "Gjendesheim, NO",
  "mode": "car",
  "duration_minutes": null,
  "distance_km": null,
  "segments": [],
  "cost": null,
  "confidence": "sample"
}
```

### Evidence Record

```json
{
  "provider": "openstreetmap",
  "source_url": "https://www.openstreetmap.org/",
  "terms_url": "https://www.openstreetmap.org/copyright",
  "retrieved_at": "2026-07-05T00:00:00Z",
  "query": {},
  "data_freshness": "unknown",
  "cache_policy": "to_be_confirmed",
  "attribution": "to_be_confirmed",
  "confidence": "sample"
}
```

## Definition Of Done For The Whole Evaluation

The evaluation is complete enough for product decisions when:

- Every source in Pass 1 and Pass 2 has a verdict.
- Every highest-risk category has either a working POC or a documented manual fallback.
- At least one full Besseggen dossier can be built from saved POC data.
- At least one non-Norway dossier can be built enough to expose regional gaps.
- The repo contains source-specific POC folders and analysis files.
- The progress tracker shows `done`, `blocked`, `skip`, or `reject` for every source considered for MVP.

## Recommended First Week

1. Create the `data-source-pocs/` folder and the analysis template.
2. Complete Pass 1 for GPX, Overpass, AWS Terrain Tiles, Open-Meteo, daylight, airports, and exchange rates.
3. Complete API key/access checks for openrouteservice, GraphHopper, Entur, Rejseplanen, Amadeus, MET/Frost, and Varsom.
4. Build a saved-data Besseggen POC using route geometry, elevation, weather, driving route, transit if available, and provenance records.
5. Update the progress tracker and write the first cross-source summary: what is viable now, what is blocked, and which manual fallbacks are required.
