# MapTiler Elevation Analysis

## Verdict

- Verdict: blocked
- MVP role: Hosted elevation/profile convenience if MapTiler Cloud is adopted.
- Production role: Vendor-managed elevation API.
- Confidence: Medium.

## Access

- Access model: API-key SaaS.
- Auth required: Yes.
- Cost/pricing: Plan-dependent.
- Rate limits: Plan-dependent.
- Terms reviewed: https://docs.maptiler.com/cloud/api/elevation/, https://www.maptiler.com/terms/cloud/
- Storage/cache permission: Must be confirmed in MapTiler plan/terms for derived route profiles.
- Attribution: MapTiler/underlying source attribution as required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Point elevation | Yes | Official docs show single point lookup. |
| Batch elevation | Yes | Official client docs show batch lookup. |
| LineString elevation | Yes | Official client docs show LineString enrichment. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | Blocked | raw/access-check.json | normalized/source-verdict.json | Requires API key. |

## Technical Limitations

- Vendor cost/limits need plan review before route-profile batch use.
- Key must be restricted and never committed.

## Opportunities

- Could simplify elevation profiles if MapTiler is also used for base maps.

## Integration Notes

- Endpoint/feed: MapTiler Elevation API.
- Query shape: Point, batch, or LineString.
- Response format: JSON/GeoJSON-like positions via client.
- Update cadence: Vendor-managed.
- Error handling: Key errors, quota, overuse.
- Required attribution/provenance: MapTiler terms and data attribution.

## Next Step

- Add `.env.example` and run a key-gated sample if account approval exists.
