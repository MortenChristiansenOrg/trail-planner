# Data Source Evaluation Summary

This file is the cross-source rollup for the POCs in this directory. Source-specific evidence lives in each source folder.

## Current Status

Evaluation started on 2026-07-05. The first pass is complete: public/open sources have runnable POCs where practical, key-gated sources have access verdicts and scaffolds where useful, and manual-only sources have fallback data shapes.

| Area | Status | Notes |
| --- | --- | --- |
| Route geometry and trail inventory | done | Overpass live samples, GPX/manual import analysis, and official/manual evidence paths. |
| Elevation and terrain | done | Open-Meteo elevation and AWS Terrain Tiles live samples; DEM access paths documented. |
| Maps and geocoding | done | MapLibre viable; Nominatim/Photon samples saved; hosted/self-hosted map options documented. |
| Road routing | done | OSRM demo samples saved; ORS/GraphHopper scaffolds; Valhalla/OTP self-host notes. |
| Public transport | done | Entur live samples saved; key-gated broader transit sources documented; shuttles manual-only. |
| Flights and airports | done | OurAirports samples saved; Amadeus/Duffel scaffolds; OpenSky rejected. |
| Ferries and driving costs | done | Official rates/fuel samples saved; ferry/parking/rental manual or partner-gated. |
| Amenities and bailout points | done | OSM POI samples saved; official stage descriptions remain curated evidence. |
| Lodging and huts | done | OSM lodging samples saved; Booking/DNT/alpine huts mostly blocked or manual. |
| Weather and seasonality | done | Open-Meteo, MET Norway, daylight, and Regobs samples saved. |
| Hiking quality signals | done | Prototype explainable score inputs saved. |
| Provenance and attribution | done | Source registry and provenance schema samples saved. |
| Closures and disruptions | done | Fragmented official-alert/manual model documented. |
| Candidate discovery | done | Curated seed-list sample saved. |
| Cost and currency | done | Official exchange-rate and fuel-price samples saved. |

## Verdict Legend

- `viable`: usable for MVP with clear integration path.
- `viable_with_limits`: useful, but requires constraints, caching, fallback, or confidence labeling.
- `manual_only`: useful only as curated/manual evidence for now.
- `blocked`: cannot complete a POC without account approval, credentials, pricing decision, or legal review.
- `reject`: not suitable for Trail Planner's planning workflow.
- `skip`: intentionally deferred.

## Consolidated Findings

The strongest immediate MVP data stack is open/manual-first:

| Need | Best current source | Verdict | Reason |
| --- | --- | --- | --- |
| Route geometry | User GPX uploads plus Overpass | viable / viable_with_limits | GPX gives controlled route geometry; Overpass adds OSM trail context and POIs. |
| Candidate routes | Curated seed list plus OSM/official source links | viable | Avoids pretending OSM can infer "great hikes" by itself. |
| Elevation/profile | AWS Terrain Tiles, Open-Meteo point elevation, later DEM cache | viable_with_limits | Public samples worked; production needs smoothing, caching, and route densification. |
| Maps | MapLibre with hosted or self-hosted tiles | viable | Renderer is clear; tile provider decision is separate. |
| Geocoding | Photon or Nominatim for low-volume enrichment | viable_with_limits | Photon handled tested trailhead search better; public Nominatim is not for autocomplete. |
| Norway transit | Entur Journey Planner | viable_with_limits | Strong for trunk public transport; weak for tourist shuttles/boats in tested cases. |
| Road routing | OSRM self-host path; ORS/GraphHopper after keys | viable_with_limits / blocked | OSRM demo proves shape; production should not depend on public demo. |
| Weather | Open-Meteo plus MET Norway for Norway cross-checks | viable / viable_with_limits | Forecast/history are easy; mountain-specific confidence must be conservative. |
| Daylight | Sunrise-Sunset or local calculation | viable_with_limits | API works, but local calculation may be simpler and more reliable. |
| Safety observations | Regobs/Varsom for Norway | viable_with_limits | Good evidence source, not a safety guarantee. |
| Amenities/lodging discovery | OSM POIs/lodging | viable_with_limits | Useful candidate discovery; no current price/availability guarantees. |
| Photos | Wikimedia Commons metadata | viable_with_limits | Licensed media is possible, but relevance and attribution need per-file review. |
| Airports | OurAirports | viable | Good static airport seed metadata. |
| Flights | Amadeus first, Duffel comparison later | viable_with_limits | Both need credentials; Amadeus is the simpler planning-first candidate. |
| Currency | Official ECB/Nationalbanken rates | viable | Good daily official conversion basis. |
| Fuel | EU Weekly Oil Bulletin plus manual non-EU defaults | viable_with_limits | Good EU country averages; gaps remain for Norway/UK/Iceland/Switzerland. |
| Provenance | Internal source registry and evidence records | viable | Required before combining sources and showing confidence. |

Sources that should not be MVP dependencies:

| Source | Verdict | Reason |
| --- | --- | --- |
| OpenSky | reject | Aircraft movement data, not itinerary, schedule, or price data. |
| Waymarked Trails | manual_only | Useful validation/reference, but not a backend data source. |
| AllTrails automated extraction | manual_only | Treat as user-supplied GPX/link evidence only. |
| Ferry operator websites | manual_only | Fragmented and dynamic; use source-linked manual assumptions first. |
| DNT/alpine hut systems | manual_only | Useful official links, but no uniform public availability API found. |
| Official alerts/closures | manual_only | High value but fragmented; model as curated source links and warning records. |

## MVP Recommendations

1. Build the first dossier from saved data using Besseggen as the canonical integration case.
2. Use a curated route seed list as the discovery backbone; enrich with Overpass/OSM, Commons, weather, elevation, and routing evidence.
3. Implement route import around GPX first. Use Overpass for context, not as the only source of route truth.
4. Use Open-Meteo globally, MET Norway and Regobs/Varsom for Norway-specific confidence, and clear labels for model/forecast/manual assumptions.
5. Use Entur for Norway public transport, but model Besseggen boat, Trolltunga shuttle, and Romsdalseggen bus as explicit manual/operator-linked segments.
6. Use official exchange rates, fuel assumptions, and manual ferry/parking/rental assumptions before paying for TollGuru, Direct Ferries, Booking, or rental APIs.
7. Require provenance records for every displayed metric from the beginning.

## Blockers

| Blocker | Affected sources | Product impact | Practical fallback |
| --- | --- | --- | --- |
| API credentials/account approval | MapTiler, openrouteservice, GraphHopper, Rejseplanen, Transitland, Navitia, Amadeus, Duffel, Direct Ferries, TollGuru, Booking.com | Cannot prove live hosted/commercial behavior yet. | Keep scaffolds and use open/manual sources for MVP. |
| Partner/commercial terms | Direct Ferries, Booking.com, Kiwi/Tequila, rental APIs | Live prices/availability may not be available for planning-only use. | Manual sampled assumptions with source links. |
| Tourist shuttle/boat coverage gaps | Entur, local operators | Point-to-point trail logistics can be wrong if modeled as ordinary transit. | Per-route manual transport segments with season, timetable URL, and confidence. |
| Hut/lodging availability fragmentation | DNT, alpine huts, Booking.com, Amadeus Hotels | Cannot reliably automate hut-to-hut availability in MVP. | Store hut/campsite candidates and booking links; mark availability unknown. |
| OSM completeness and false positives | Overpass, OSM POIs, OSM lodging, OSM quality signals | Route context can be incomplete or noisy. | Combine curated route truth, OSM enrichment, and manual review. |
| Weather/safety overconfidence | Open-Meteo, MET Norway, Regobs/Varsom | Forecasts and observations cannot determine route safety. | Present as evidence and risk notes, never as binary safety approval. |

## Generated Evidence

- Source analysis files: 57.
- Raw sample/access files: 82.
- Normalized sample/access files: 77.
- Public POCs validated with JSON parsing and script syntax checks.
