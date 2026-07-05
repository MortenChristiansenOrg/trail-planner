# openrouteservice Analysis

## Verdict

- Verdict: blocked
- MVP role: Hosted road routing comparison candidate.
- Production role: Possible hosted directions, matrix, and isochrone provider, or self-hosted ORS if usage exceeds public limits.
- Confidence: Medium; API access is clear, but no key was available in this workspace.

## Access

- Access model: API key required.
- Auth required: Yes.
- Cost/pricing: Standard/free plan exists with endpoint restrictions; production usage needs plan review.
- Rate limits: Published endpoint restrictions apply.
- Terms reviewed: https://openrouteservice.org/restrictions/
- Storage/cache permission: Needs plan/terms review before storing route geometries at scale.
- Attribution: OSM/openrouteservice attribution expected.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Driving duration/distance | Expected | Script normalizes this from route summary. |
| Geometry | Expected | GeoJSON route response. |
| Matrices | Expected | Restricted by plan limits. |
| Isochrones | Expected | Restricted by endpoint limits. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Aalborg to Gjendesheim | Blocked | None | None | Requires `ORS_API_KEY`. |
| Aalborg to Odda | Blocked | None | None | Requires `ORS_API_KEY`. |

## Technical Limitations

- Hosted limits may be too low for broad candidate discovery.
- Long car trips involving ferries need manual validation against ferry schedules.

## Opportunities

- Quick hosted baseline against GraphHopper and OSRM.
- Isochrones may help early reachable-region discovery.

## Integration Notes

- Endpoint/feed: `https://api.openrouteservice.org/v2/directions/driving-car/geojson`
- Query shape: POST GeoJSON directions request with lon/lat coordinate pairs.
- Response format: GeoJSON.
- Update cadence: Hosted OSM-derived service.
- Error handling: Rate-limit and quota errors must be first-class.
- Required attribution/provenance: API plan, retrieved timestamp, source terms URL.

## Next Step

- Run `poc.py` with a project API key and compare Aalborg-to-Norway route distance/duration against OSRM and GraphHopper.
