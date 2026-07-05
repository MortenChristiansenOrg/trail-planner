# Transitland Analysis

## Verdict

- Verdict: blocked
- MVP role: Feed discovery for Scotland, Alps regions, Denmark, Norway, Sweden, and Iceland.
- Production role: Feed registry/input discovery for self-hosted OTP/Valhalla/R5, not primary journey planning.
- Confidence: Medium.

## Access

- Access model: REST API with API key.
- Auth required: Yes.
- Cost/pricing: To confirm for required API/download level.
- Rate limits: To confirm by key/plan.
- Terms reviewed: Transitland REST API documentation.
- Storage/cache permission: Feed download/cache terms must be checked per source feed and Transitland plan.
- Attribution: Transitland and feed/operator attribution.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Feed registry | Expected | Feeds endpoint supports browsing feeds. |
| Operators/routes/stops | Expected | REST API covers basic transit entities. |
| Journey planning | No | Not a door-to-door planner. |
| GTFS downloads | Plan-dependent | Must verify authorization. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Norway/Denmark/Scotland feed discovery | Blocked | None | `normalized/access-blocked.json` | API key required. |

## Technical Limitations

- Registry coverage varies by country and operator.
- Feed presence does not guarantee current journey-planner quality.

## Opportunities

- Good source for discovering feeds to load into OTP.
- Can produce a coverage matrix for target regions.

## Integration Notes

- Endpoint/feed: `https://www.transit.land/api/v2/rest/feeds`
- Query shape: Country/region/feed searches.
- Response format: JSON.
- Update cadence: Registry/feed-version dependent.
- Error handling: key, authorization, pagination, stale feed versions.
- Required attribution/provenance: Transitland feed ID, source feed URL, version SHA/date.

## Next Step

- Obtain API key and save feed discovery samples for target regions.
