# Waymarked Trails Analysis

## Verdict

- Verdict: manual_only
- MVP role: Visual validation/reference.
- Production role: Do not depend on public website scraping.
- Confidence: Medium.

## Access

- Access model: Public website; open-source API frontend code exists.
- Auth required: No for browsing.
- Cost/pricing: Free website.
- Rate limits: Not evaluated.
- Terms reviewed: https://hiking.waymarkedtrails.org/, https://github.com/waymarkedtrails/waymarkedtrails-api
- Storage/cache permission: Underlying map data is OSM/ODbL.
- Attribution: OSM attribution applies.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Rendered hiking routes | Yes | Good human QA reference. |
| Backend route feed | Unclear | Avoid relying on undocumented service behavior. |
| GPX/KML per route | Possible via UI | Treat as manual/user evidence unless terms are confirmed. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen/Trolltunga/Ben Nevis | Access check | raw/access-check.json | normalized/source-verdict.json | No automated sample. |

## Technical Limitations

- The public site is not a product backend contract.
- It is OSM-derived, so it does not solve missing/incomplete OSM data.

## Opportunities

- Fast visual QA for route relation completeness.

## Integration Notes

- Endpoint/feed: Website and open-source API frontend.
- Query shape: Manual map inspection.
- Response format: Rendered map/UI.
- Update cadence: OSM-derived, service-dependent.
- Error handling: Not applicable for MVP automation.
- Required attribution/provenance: OSM attribution.

## Next Step

- Use as a manual checklist beside Overpass relation reconstruction.
