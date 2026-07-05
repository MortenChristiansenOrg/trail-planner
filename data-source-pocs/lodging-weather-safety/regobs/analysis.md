# NVE Regobs / Varsom Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Norway safety evidence panel for recent observations around route areas.
- Production role: valuable hazard-observation feed, paired with clear disclaimers and official Varsom warning links.
- Confidence: medium; API is public, but query performance is sensitive to radius/record count.

## Access

- Access model: public read API for searches; auth required for posting/private data.
- Auth required: no for simple read/search samples.
- Cost/pricing: public NVE service.
- Rate limits: not fully quantified in this POC.
- Terms reviewed: https://api.nve.no/doc/regobs/ and https://www.varsom.no/en/about/regobs/regobs-about-data-terms-of-service-and-privacy-policy/
- Storage/cache permission: NVE services are under NLOD/CC-compatible terms per docs.
- Attribution: credit Regobs/Varsom and observer/photographer where relevant.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Recent observations | Yes | `Search/AtAGlance` returned avalanche observations around Jotunheimen. |
| Observer competence | Yes | Competence level ID present. |
| Hazard type | Yes | Snow, soil, water, ice IDs are documented. |
| Attachments | Partial | URLs and counts appear in at-a-glance results; image reuse needs attribution. |
| Route closure status | No | Observations are evidence, not official trail closure status. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen/Jotunheimen | OK | `raw/sample-besseggen.json` | `normalized/sample-besseggen.json` | Five snow observations saved. Larger 10-record query timed out. |

## Technical Limitations

- Full `/Search` queries can be slow; `Search/AtAGlance` is more suitable for dossier summaries.
- Query performance changed sharply between five and ten records in the Jotunheimen sample.
- No observations does not mean no hazard.
- Regobs data is user-generated and can contain errors or later edits/deletions.

## Opportunities

- Show recent observation count and links near route regions.
- Add hazard tabs for snow, landslide/soil, flood/water, and ice where relevant.
- Pair Regobs with official Varsom bulletins by forecast region.

## Integration Notes

- Endpoint/feed: `https://api.regobs.no/v5/Search/AtAGlance`
- Query shape: POST JSON with `LangKey`, `SelectedGeoHazards`, `Radius`, `NumberOfRecords`.
- Response format: JSON.
- Update cadence: fresh user/organization observations.
- Error handling: keep small page sizes, backoff, cache, and mark unavailable rather than blocking trip planning.
- Required attribution/provenance: Regobs/Varsom plus observer/photographer attribution for specific records/media.

## Next Step

- Add forecast-region lookup and Varsom bulletin samples; keep observation query sizes small.
