# AllTrails Export / User Link Analysis

## Verdict

- Verdict: manual_only
- MVP role: User-supplied file/link evidence.
- Production role: Manual import only unless explicit partner/API terms are obtained.
- Confidence: Medium.

## Access

- Access model: Manual account export according to official support docs.
- Auth required: User account for export.
- Cost/pricing: Account/subscription behavior must be confirmed by user.
- Rate limits: Not applicable for manual export.
- Terms reviewed: https://support.alltrails.com/hc/en-us/articles/37230403315476-Downloading-files-from-AllTrails
- Storage/cache permission: Only store user-exported files with provenance; do not scrape proprietary ratings/reviews/photos.
- Attribution: Preserve user/source link.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| GPX/KML/FIT/TCX | Yes, via user export | Must be user supplied. |
| Reviews/ratings/photos | No | Not cleanly reusable. |
| Route URL | Yes | Evidence link only. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Target routes | Not run | raw/access-check.json | normalized/source-verdict.json | Requires user export. |

## Technical Limitations

- Automated extraction is legally and operationally risky.
- Export availability may depend on account state and route.

## Opportunities

- Useful user workflow for importing familiar routes without a proprietary integration.

## Integration Notes

- Endpoint/feed: Manual file upload.
- Query shape: None.
- Response format: GPX/KML/FIT/TCX.
- Update cadence: User-provided.
- Error handling: Validate files and strip unrelated personal track data if needed.
- Required attribution/provenance: Source URL and user declaration.

## Next Step

- Build generic GPX import, not an AllTrails-specific scraper.
