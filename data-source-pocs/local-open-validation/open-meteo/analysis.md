# Open-Meteo Analysis

## Verdict

- Verdict: viable
- MVP role: Global forecast and historical/reanalysis weather source for trailhead and route-point weather context.
- Production role: Primary baseline weather provider, with Nordic verification from MET Norway/Frost where needed.
- Confidence: high for API access, medium for mountain-route interpretation.

## Access

- Access model: Public HTTP API.
- Auth required: No for the tested forecast endpoint.
- Cost/pricing: Free access is available, with paid/commercial options to verify before production.
- Rate limits: Must be checked against the current Open-Meteo terms before production load.
- Terms reviewed: Source docs referenced; production terms still require legal review.
- Storage/cache permission: To be confirmed for production; cache retrieved samples with provenance.
- Attribution: Record Open-Meteo as provider.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Coordinates/elevation/timezone | yes | Included in response. |
| Hourly forecast | yes | Temperature, precipitation, wind, and many other variables are available by query. |
| Daily forecast | yes | Useful for dossier summaries. |
| Historical/reanalysis | yes | Separate endpoint should be tested. |
| Mountain-specific risk | partial | Does not replace local warnings, avalanche, closures, or ridge-level judgment. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen/Gjendesheim | success | `raw/besseggen-gjendesheim.json` | `normalized/besseggen-gjendesheim.json` | Forecast sample only. |

## Technical Limitations

- Forecast grid points are not trail-aware and may miss ridge exposure and microclimate.
- Route-level weather needs sampling at several points, not just a trailhead.
- Historical and forecast products have different endpoints and confidence semantics.

## Opportunities

- Good immediate source for weather windows, precipitation risk, wind exposure hints, and historical season summaries.
- Can be combined with MET/Frost and Varsom for Norway-specific confidence labels.

## Integration Notes

- Endpoint/feed: `https://api.open-meteo.com/v1/forecast`
- Query shape: lat/lon plus selected hourly/daily variables.
- Response format: JSON.
- Update cadence: Forecast changes frequently; store retrieval time and expire aggressively.
- Error handling: Validate arrays and units before computing summaries.
- Required attribution/provenance: Provider, endpoint, query, retrieved time, timezone, forecast model metadata when available.

## Next Step

- Add historical weather POC for June-September windows and sample multiple route points per hike.

