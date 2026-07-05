# Lodging, Weather, Seasonality, And Safety Data Source POCs

Scope owned for this evaluation:

- Lodging, huts, campsites, and wild-camping assumptions.
- Weather, climate, seasonality, snow, and daylight.
- Closures, disruptions, and safety warnings.

This folder follows `DATA_SOURCE_EVALUATION_PLAN.md`: runnable sources include `poc.py`, saved `raw/` responses, saved `normalized/` samples, and `analysis.md`. Partner-gated or manual-only sources include analysis plus a normalized fallback shape.

## Verdict Summary

| Source | Verdict | Role |
| --- | --- | --- |
| Open-Meteo | viable | Primary MVP forecast, historical/reanalysis, snowfall/snow-depth sample source. |
| MET Norway Locationforecast | viable_with_limits | Norway forecast cross-check; requires strict User-Agent and cache handling. |
| Sunrise-Sunset API | viable_with_limits | Daylight/twilight calculation sample; local calculation may be better in production. |
| NVE Regobs / Varsom observations | viable_with_limits | Norway safety observation evidence; not a route-safety guarantee. |
| OSM lodging via Overpass | viable_with_limits | Lodging/campsite candidate discovery; no live price/availability. |
| Booking.com Demand API | blocked | Managed Affiliate Partner access required. |
| DNT cabins | manual_only | Official cabin links/booking pages useful; no public planning API found. |
| Alpine hut systems | manual_only | Fragmented portals and hut-specific booking systems. |
| Campsites / wild camping | manual_only | Legal assumptions must be curated by country/region. |
| Official alerts | manual_only | High-value but fragmented; store official source links and machine-readability per route. |

## Reproduce Public POCs

Run from each source folder:

```bash
python3 poc.py
```

Public endpoints used in saved samples:

- Open-Meteo forecast/archive APIs.
- MET Norway Locationforecast 2.0 compact API.
- Sunrise-Sunset JSON API.
- Regobs v5 `Search/AtAGlance`.
- Overpass API for OSM lodging/camping tags.

## Key Product Conclusion

Weather and daylight can be automated for MVP with clear confidence labels. Lodging discovery can be partially automated from OSM, but live availability/prices for hotels, DNT cabins, alpine huts, and campsites are mostly partner-gated or manual. Safety warnings should be modeled as evidence and warnings, not binary go/no-go logic.
