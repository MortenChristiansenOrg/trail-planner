# Campsites And Wild-Camping Analysis

## Verdict

- Verdict: manual_only
- MVP role: curated legal/rule assumptions plus OSM campsite candidates.
- Production role: maintained country/region rules with source links and expiry dates.
- Confidence: medium.

## Access

- Access model: official national/regional pages plus OSM campsite tags.
- Auth required: no.
- Cost/pricing: none for official guidance; campsite prices manual.
- Rate limits: not applicable for manual curation.
- Terms reviewed: not exhaustively by country in this pass.
- Storage/cache permission: store structured assumptions and source URLs, not copied guidance text.
- Attribution: official source links.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Mapped campsites | Yes via OSM | See `osm-lodging`. |
| Wild-camping legality | Manual | Country/region-specific. |
| Park/local restrictions | Manual | Often route-specific and seasonal. |
| Prices/booking | Manual | Campsite/operator-specific. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Norway/Scotland/Iceland/Alps | Manual schema only | `raw/access-check.md` | `normalized/legal-assumption-template.json` | Needs official page pass per jurisdiction. |

## Technical Limitations

- Legal nuance cannot be inferred from OSM tags.
- National rights may be overridden by park, landowner, fire, conservation, or seasonal restrictions.

## Opportunities

- Build a visible assumption table with confidence and expiry.
- Combine route buffer with protected-area overlays later.

## Integration Notes

- Endpoint/feed: manual official sources by country/region.
- Query shape: route country/region/protected area.
- Response format: curated JSON rules.
- Update cadence: review seasonally and before trip.
- Error handling: show unknown/restricted when local rule is not sourced.
- Required attribution/provenance: official rule page URL.

## Next Step

- Fill rules for Norway, Sweden, Scotland, Iceland, Italy, Austria, Switzerland, France, and Spain.
