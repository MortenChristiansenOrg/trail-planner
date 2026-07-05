# Official Route Pages Analysis

## Verdict

- Verdict: manual_only
- MVP role: Authoritative evidence links and curated seasonal/route notes.
- Production role: Per-source adapters only when terms permit.
- Confidence: High.

## Access

- Access model: Website/manual curation; varies by source.
- Auth required: Usually no, source-specific.
- Cost/pricing: Usually free website access.
- Rate limits: Source-specific.
- Terms reviewed: Not globally applicable; review per official site.
- Storage/cache permission: Do not copy substantial copyrighted descriptions without permission.
- Attribution: Link to source and preserve retrieval date.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Route description | Yes | Usually copyrighted prose; summarize minimally. |
| Season/warnings | Yes | High product value. |
| Official GPX | Sometimes | Terms vary. |
| Shuttle/parking notes | Often | Manual fields needed. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Target routes | Access check | raw/access-check.json | normalized/source-verdict.json | Per-site review required. |

## Technical Limitations

- Formats and licenses vary.
- Seasonal information changes and needs dated confidence.

## Opportunities

- Highest trust evidence for warnings, seasonality, and local logistics.

## Integration Notes

- Endpoint/feed: Manual URL per route.
- Query shape: Human curation.
- Response format: Structured evidence records.
- Update cadence: Source-specific.
- Error handling: Mark stale pages and unknown season data explicitly.
- Required attribution/provenance: Source URL, date retrieved, title, confidence.

## Next Step

- Build a manual seed dataset for the standard test routes.
