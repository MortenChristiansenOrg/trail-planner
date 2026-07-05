# Entur Journey Planner Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Primary Norway public transport planner for rail, bus, ferry, and mainstream stop-to-stop legs.
- Production role: Norway routing provider, with explicit fallback to operator/manual shuttle records for seasonal tourist services.
- Confidence: High for API access and mainstream transit; medium-low for trailhead last-mile coverage.

## Access

- Access model: Public GraphQL API.
- Auth required: No token, but `ET-Client-Name` header is required.
- Cost/pricing: Open public API under NLOD according to Entur docs.
- Rate limits: Default policy applies without an agreement; unidentified consumers may be strictly rate-limited or blocked.
- Terms reviewed: https://developer.entur.org/pages-journeyplanner-journeyplanner/ and Entur rate-limit policy.
- Storage/cache permission: NLOD/open-data fit appears workable, but production cache duration and attribution should be recorded per response.
- Attribution: Attribute Entur/source operators and preserve provenance.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Trip patterns | Yes | Returned for Bergen to Odda. |
| Segment modes | Yes | Rail, bus, foot, and line metadata. |
| Line/operator identifiers | Yes | Examples include VY and Skyss line IDs. |
| Realtime/situations | Partial | Query includes situations; test cases had none. |
| Tourist shuttle/boat coverage | Partial/no | Trolltunga and Romsdalseggen tested as walk-only; Gjende boat was not resolved. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Bergen to Odda | Success | `raw/sample-bergen-to-odda.json` | `normalized/sample-bergen-to-odda.json` | Returned train+bus and direct bus options. |
| Odda to Skjeggedal | Gap | `raw/sample-odda-to-skjeggedal.json` | `normalized/sample-odda-to-skjeggedal.json` | Walk-only pattern plus `noTransitConnection`; Trolltunga shuttle not modeled as transit. |
| Andalsnes to Venjedalssetra | Gap | `raw/sample-andalsnes-to-venjedalssetra.json` | `normalized/sample-andalsnes-to-venjedalssetra.json` | Walk-only pattern plus `noTransitConnection`; Romsdalseggen bus needs operator fallback. |
| Gjendesheim to Memurubu | Gap | `raw/sample-gjendesheim-to-memurubu.json` | `normalized/sample-gjendesheim-to-memurubu.json` | No patterns; destination/location could not be resolved for the boat segment. |

## Technical Limitations

- Coordinate-to-coordinate trailhead queries can return walk-only plans that are not useful as shuttle evidence.
- Some local operators may exist in ticketing pages but not in the national trip planner graph.
- Need careful distinction between "no transit found" and "service absent from Entur".

## Opportunities

- Use Entur for Norway trunk legs and for validating whether local services are machine-readable.
- Use `routingErrors` as a signal to trigger manual/operator-source fallback.
- Save line IDs and stop names for later booking/deep-link enrichment.

## Integration Notes

- Endpoint/feed: `POST https://api.entur.io/journey-planner/v3/graphql`
- Query shape: `trip(from: Location!, to: Location!, dateTime: DateTime!, numTripPatterns: 3)`
- Response format: GraphQL JSON.
- Update cadence: Scheduled data with realtime where available.
- Error handling: Treat GraphQL errors and `routingErrors` separately from empty trip patterns.
- Required attribution/provenance: Entur docs URL, query coordinates, retrieved timestamp, and line/operator IDs.

## Next Step

- Use Entur as Norway public transport provider, but add a local-shuttle/manual segment table for Besseggen, Trolltunga, and Romsdalseggen.
