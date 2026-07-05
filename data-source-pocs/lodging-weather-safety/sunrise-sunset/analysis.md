# Sunrise-Sunset Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: quick API proof for sunrise, sunset, twilight, and day length.
- Production role: probably replace with local astronomical calculation to avoid an external dependency.
- Confidence: high for daylight times, low for terrain-shadow implications.

## Access

- Access model: public keyless API.
- Auth required: no.
- Cost/pricing: free public API.
- Rate limits: usage limits/attribution page should be checked before production.
- Terms reviewed: https://sunrise-sunset.org/api
- Storage/cache permission: not explicitly evaluated beyond API docs.
- Attribution: required by API docs.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Sunrise/sunset | Yes | Saved for Trolltunga and Ben Nevis dates. |
| Civil/nautical/astronomical twilight | Yes | Useful for early/late hiking windows. |
| Local timezone | Yes | `tzid` works. |
| Terrain shadows | No | Needs DEM/horizon modeling if required. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Trolltunga | OK | `raw/sample-trolltunga-trail.json` | `normalized/sample-trolltunga-trail.json` | May, June, September, October 2026. |
| Ben Nevis CMD | OK | `raw/sample-ben-nevis-cmd.json` | `normalized/sample-ben-nevis-cmd.json` | Non-Norway case works. |

## Technical Limitations

- API gives astronomical daylight, not terrain-aware usable daylight.
- A local library would remove latency, attribution/dependency concerns, and simplify bulk route scoring.

## Opportunities

- Use civil twilight as a planning field for long day hikes.
- Flag routes where route time consumes too much of daylight window.

## Integration Notes

- Endpoint/feed: `https://api.sunrise-sunset.org/json`
- Query shape: `lat`, `lng`, `date`, `formatted=0`, `tzid`.
- Response format: JSON.
- Update cadence: deterministic by date/location.
- Error handling: handle invalid timezone/date and HTTP failures.
- Required attribution/provenance: Sunrise-Sunset attribution if API remains in production.

## Next Step

- Compare with a local library and prefer local calculation unless API attribution is desirable.
