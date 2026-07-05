# Provenance And License Registry Analysis

## Verdict

- Verdict: `viable`
- MVP role: Required foundation for mixing OSM, Commons, manual route facts, and later commercial APIs.
- Production role: Central evidence table plus source/license registry referenced by every normalized object.
- Confidence: High for schema usefulness, medium for license interpretations until legal review.

## Access

- Access model: Internal schema and manually maintained registry.
- Auth required: No.
- Cost/pricing: No.
- Rate limits: None.
- Terms reviewed: OSM attribution/copyright, Overpass wiki, Commons API/reuse/User-Agent docs.
- Storage/cache permission: Source-specific.
- Attribution: Source-specific registry fields.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Source ID | Yes | Stable join key for evidence. |
| Terms/license URL | Yes | Per-source and sometimes per-file. |
| Attribution text | Yes | Required for display decisions. |
| Cache policy | Yes | Stored as operational guidance, not legal advice. |
| Transformation lineage | Yes | Raw, normalized, derived, or manual curation. |
| Refresh policy | Yes | Live/daily/weekly/seasonal/manual review. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| License registry | Complete sample | `raw/primary-source-notes.json` | `normalized/license-registry.sample.json` | Covers OSM, Overpass, Commons, manual official pages. |
| Provenance schema | Complete sample | n/a | `normalized/provenance-record.schema.sample.json` | Minimal fields for every future normalized record. |

## Technical Limitations

- The registry is not a substitute for legal review.
- Manual route pages need per-source terms review before copying anything beyond minimal facts and links.
- Commons media requires per-file licensing, not a single source-level license.

## Opportunities

- Enables confidence labels and attribution from the beginning.
- Prevents derived quality scores from losing their evidence chain.
- Gives future paid/key-gated API POCs a consistent place to document cache and display rights.

## Integration Notes

- Endpoint/feed: Internal JSON schema.
- Query shape: Join normalized records by `source_id`.
- Response format: JSON.
- Update cadence: Manual review when a new source is added or terms change.
- Error handling: Block display/export when attribution or terms fields are missing.
- Required attribution/provenance: Mandatory on every normalized record.

## Next Step

- Promote this schema into a shared evaluation convention before adding more POC folders.
