# Official Alerts Analysis

## Verdict

- Verdict: manual_only
- MVP role: route-specific official alert links and manually checked warning fields.
- Production role: adapter per route authority where machine-readable feeds exist.
- Confidence: medium.

## Access

- Access model: fragmented official websites/APIs by park, road, ferry, transit, and hazard authority.
- Auth required: varies.
- Cost/pricing: varies, usually public for official alerts.
- Rate limits: varies.
- Terms reviewed: Regobs/Varsom docs for Norway hazard observations; other official alert sources need route-specific checks.
- Storage/cache permission: source-specific.
- Attribution: source-specific.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Norway hazard observations | Yes | See Regobs POC. |
| Avalanche/flood/landslide warning links | Manual/likely API | Needs Varsom bulletin POC next. |
| Trail closures | Manual | Official park/municipality/tourism pages vary. |
| Transit/road/ferry disruptions | Separate sources | Belongs to transport adapters, not one unified alert feed. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen/Trolltunga/Romsdalseggen/Ben Nevis/Laugavegur/Dolomites | Manual schema only | `raw/access-check.md` | `normalized/route-alert-template.json` | Needs route-source mapping. |

## Technical Limitations

- No single closure/disruption feed covers all target regions and transport modes.
- Alert text may be copyrighted or not designed for caching.
- Trail Planner must distinguish source freshness from actual safety.

## Opportunities

- Store one official alert source per seed route.
- Add `last_checked_at`, `machine_readable`, and `requires_manual_review` fields.
- Use warnings as confidence reducers and do-not-finalize gates.

## Integration Notes

- Endpoint/feed: route authority, park, municipality, road/ferry/transit/hazard APIs.
- Query shape: per-source.
- Response format: per-source or manual.
- Update cadence: before trip and during active trip planning.
- Error handling: show alert status unknown when source cannot be checked.
- Required attribution/provenance: source-specific.

## Next Step

- For each seed route, identify the official closure/warning page and whether it has RSS/API/structured data.
