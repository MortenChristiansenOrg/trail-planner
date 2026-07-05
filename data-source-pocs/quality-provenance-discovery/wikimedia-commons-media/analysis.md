# Wikimedia Commons Media Analysis

## Verdict

- Verdict: `viable_with_limits`
- MVP role: Licensed photo/visual-evidence metadata and attribution candidates for route dossiers.
- Production role: Media evidence registry with per-file license validation, manual curation, and thumbnail caching policy.
- Confidence: Medium for metadata retrieval, low-to-medium for relevance without curation.

## Access

- Access model: Public MediaWiki Action API on Commons.
- Auth required: No for read samples.
- Cost/pricing: No direct API fee.
- Rate limits: Follow Wikimedia API etiquette and User-Agent policy.
- Terms reviewed: https://commons.wikimedia.org/wiki/Commons:API/MediaWiki, https://commons.wikimedia.org/wiki/Commons:Machine-readable_data, https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy
- Storage/cache permission: Metadata cache is feasible; media reuse depends on each file license.
- Attribution: Per file: title, author/artist, source URL, license name, and license URL.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Category file membership | Yes | Works for sampled route categories. |
| Thumbnail/original URL | Yes | Retrieved through `imageinfo`. |
| Author/artist | Yes, variable | HTML-rich metadata normalized to text; quality varies. |
| License name/URL | Yes, variable | Must be preserved per file; not all files have the same reuse terms. |
| Coordinates | Not in this POC | Category-based lookup was more reliable than Commons geosearch for these route samples. |
| Visual relevance | Partial | Category membership is a candidate signal, not enough to auto-display without review. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | 5 media records | `raw/sample-besseggen.json` | `normalized/sample-besseggen.json` | File licenses include CC BY and public-domain/no-restrictions style metadata. |
| Trolltunga | 5 media records | `raw/sample-trolltunga.json` | `normalized/sample-trolltunga.json` | Category has enough image candidates for visual evidence. |
| Ben Nevis | 5 media records | `raw/sample-ben-nevis.json` | `normalized/sample-ben-nevis.json` | Broader category may include nearby mountain context, not necessarily CMD route evidence. |

## Technical Limitations

- Commons categories are human-curated and inconsistent; names can be broad or nested.
- File metadata is not uniformly machine-readable; HTML cleanup is required and still may leave imperfect attribution.
- Relevance needs a manual or ML-assisted review step before using photos as route evidence.
- Do not assume Commons media is free of personality/property/copyright complications just because metadata exists.

## Opportunities

- Quickly attach legally reusable visual evidence candidates to seed routes.
- Use media presence as a soft quality/discovery signal without relying on proprietary reviews.
- Store attribution-ready metadata alongside route evidence records.

## Integration Notes

- Endpoint/feed: `https://commons.wikimedia.org/w/api.php`
- Query shape: `categorymembers` for route category, then `imageinfo` with `url|user|dimensions|extmetadata`.
- Response format: JSON.
- Update cadence: Current wiki state at request time.
- Error handling: Missing categories, empty category members, malformed extmetadata, broad categories.
- Required attribution/provenance: File title, page URL, artist, license, license URL, retrieval time, API params.

## Next Step

- Add curated route-to-category mappings and reject/approve flags per media item before displaying in a user-facing dossier.
