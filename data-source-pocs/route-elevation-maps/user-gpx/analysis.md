# User GPX Uploads Analysis

## Verdict

- Verdict: viable
- MVP role: Primary route geometry import path.
- Production role: User-supplied evidence with provenance and source URL.
- Confidence: High.

## Access

- Access model: Manual/user-supplied upload.
- Auth required: No external API.
- Cost/pricing: None.
- Rate limits: None.
- Terms reviewed: User owns/provides file; original source terms still need capture.
- Storage/cache permission: Store user-uploaded file only under app terms and source provenance.
- Attribution: Preserve source URL/license if known.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Route geometry | Yes | Tracks/routes in GPX. |
| Distance | Yes | Derived locally. |
| Elevation samples | Partial | GPX may include elevation; DEM resampling still preferred. |
| Route semantics | Partial | GPX metadata often sparse. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Any target route | Not run | raw/access-check.json | normalized/source-verdict.json | No GPX files provided. |

## Technical Limitations

- Uploaded tracks can include detours, recording noise, or private traces.
- Need simplification, dedupe, coordinate validation, and source provenance fields.

## Opportunities

- Fastest path to a complete route dossier when OSM relation geometry is incomplete.

## Integration Notes

- Endpoint/feed: Local file upload.
- Query shape: GPX XML parser.
- Response format: Normalized GeoJSON/LineString plus stats.
- Update cadence: User-supplied.
- Error handling: Reject invalid XML, huge files, bad coordinates.
- Required attribution/provenance: User/source-provided.

## Next Step

- Add parser POC with one known-permissible GPX file.
