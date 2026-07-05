# OpenSky Network Analysis

## Verdict

- Verdict: reject
- MVP role: None.
- Production role: None unless Trail Planner later needs aviation analytics unrelated to user trip planning.
- Confidence: High.

## Access

- Access model: Public/research API with rate limits and account tiers.
- Auth required: Some endpoints can be public; limits vary.
- Cost/pricing: Not evaluated because product fit fails.
- Rate limits: OpenSky documents limits/credits for state, flight, and track endpoints.
- Terms reviewed: https://openskynetwork.github.io/opensky-api/
- Storage/cache permission: Not evaluated for product use.
- Attribution: Not relevant for MVP.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Aircraft state vectors | Yes | Not useful for planning offers. |
| Historical aircraft flights | Yes | Not equivalent to schedules. |
| Prices/availability | No | Required for Trail Planner. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Access check | Rejected | `raw/source-access.json` | `normalized/access-verdict.json` | No code needed. |

## Technical Limitations

- Cannot answer "can I fly from AAL to BGO on date X and what will it cost?"

## Opportunities

- None for MVP.

## Integration Notes

- Endpoint/feed: OpenSky REST API.
- Query shape: Aircraft/flight movement queries.
- Response format: JSON.
- Update cadence: Live or delayed movement data.
- Error handling: Not applicable.
- Required attribution/provenance: Not applicable.

## Next Step

- Do not use for Trail Planner travel-option sourcing.
