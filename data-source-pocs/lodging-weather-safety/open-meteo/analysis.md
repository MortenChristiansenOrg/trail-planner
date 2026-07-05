# Open-Meteo Analysis

## Verdict

- Verdict: viable
- MVP role: primary free forecast and historical weather sample source for route dossiers.
- Production role: useful for broad Europe weather, climate windows, and snow/rain screening; paid/commercial endpoint needed for commercial use.
- Confidence: high for API access, medium for mountain-specific interpretation.

## Access

- Access model: public keyless API for free non-commercial use.
- Auth required: no.
- Cost/pricing: free non-commercial tier; commercial/high-volume plans available.
- Rate limits: official terms list free-tier limits.
- Terms reviewed: https://open-meteo.com/en/terms and https://open-meteo.com/en/licence
- Storage/cache permission: API data is CC BY 4.0 per Open-Meteo licence.
- Attribution: required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Forecast temperature/precip/wind | Yes | Hourly and daily point data. |
| Historical daily weather | Yes | Archive/reanalysis sample works back to historical periods. |
| Snowfall/snow depth | Partial | Snow variables are available, but trail snow safety needs specialist sources. |
| Route-wide exposure | No | Requires sampling multiple route points and interpreting terrain. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | OK | `raw/sample-besseggen-high-point-forecast.json` | `normalized/sample-besseggen-high-point-forecast.json` | Forecast and July 2025 archive saved. |
| Trolltunga | OK | `raw/sample-trolltunga-trail-forecast.json` | `normalized/sample-trolltunga-trail-forecast.json` | Forecast and July 2025 archive saved. |
| Ben Nevis CMD | OK | `raw/sample-ben-nevis-cmd-forecast.json` | `normalized/sample-ben-nevis-cmd-forecast.json` | Non-Norway coverage works. |

## Technical Limitations

- Point forecasts can understate ridge wind, wind chill, and localized mountain precipitation.
- Snow depth and snowfall are planning evidence only, not avalanche or passability proof.
- Commercial use needs paid/commercial terms rather than the free endpoint.

## Opportunities

- Sample trailhead, midpoint, and high point to show forecast spread.
- Use archive data to compute seasonal weather windows and wet/cold risk.
- Combine with daylight and official season fields for timing recommendations.

## Integration Notes

- Endpoint/feed: `https://api.open-meteo.com/v1/forecast` and `https://archive-api.open-meteo.com/v1/archive`
- Query shape: latitude, longitude, elevation, timezone, hourly/daily variable lists.
- Response format: JSON.
- Update cadence: live forecast endpoint, historical archive endpoint.
- Error handling: store query, status, retrieved time, and degrade to unavailable weather.
- Required attribution/provenance: Open-Meteo attribution and CC BY 4.0 link.

## Next Step

- Build a route sampler that queries trailhead/high-point coordinates and derives route-level risk bands.
