# Entur Journey Planner Analysis

## Verdict

- Verdict: viable
- MVP role: Primary Norway public transport journey planner.
- Production role: Norway national transit, with fallback/manual handling for private tourist shuttles and mountain boats.
- Confidence: high for national public transport access, medium for trail-specific last mile.

## Access

- Access model: Public GraphQL API with required client identification.
- Auth required: No API key for this tested endpoint.
- Cost/pricing: Public developer access; production policy must be reviewed before load.
- Rate limits: Must follow Entur developer guidelines and identify client.
- Terms reviewed: Developer docs referenced; production terms still require legal review.
- Storage/cache permission: Store responses as retrieved evidence with timestamps; confirm cache policy before production.
- Attribution: Entur provider attribution should be recorded.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Trip patterns | yes | Multiple itinerary options. |
| Leg modes | yes | Useful for mixed bus/train/walk/ferry chains. |
| Stops/places | yes | Names and coordinates appear in leg places. |
| Timed departures/arrivals | yes | Aimed times available. |
| Tourist shuttle completeness | partial | Must test per route; private shuttles may be absent. |
| Fare/price | unclear | Not part of this minimal query. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Bergen to Odda | success | `raw/bergen-to-odda.json` | `normalized/bergen-to-odda.json` | Tests Norway regional public transport. |

## Technical Limitations

- Requires careful date/time handling; live trip results vary by requested date.
- Last-mile private tourist buses, boats, and seasonal shuttles may not appear.
- Needs service-alert and realtime-specific tests before disruption confidence can be shown.

## Opportunities

- Strong source for Norway transit chains and schedule confidence.
- GraphQL makes it possible to request exactly the fields needed for dossiers.

## Integration Notes

- Endpoint/feed: `https://api.entur.io/journey-planner/v3/graphql`
- Query shape: GraphQL `trip` from/to coordinates or stop IDs.
- Response format: JSON GraphQL envelope.
- Update cadence: Live schedule query; store request time and requested departure/arrival time.
- Error handling: Handle empty trip patterns and partial GraphQL errors.
- Required attribution/provenance: Provider, query, retrieval time, requested date/time, client name.

## Next Step

- Query Odda-Skjeggedal, Gjendesheim/Gjende area, and Andalsnes/Romsdalseggen to measure trailhead last-mile coverage.

