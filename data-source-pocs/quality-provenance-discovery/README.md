# Quality, Provenance, And Discovery POCs

Scope: trail amenities, subjective quality signals, licensed photo metadata, provenance/attribution, and candidate discovery seed data.

This folder intentionally does not update the global evaluation tracker. It contains only small proof datasets and source-specific analysis under the task-owned path.

## Contents

| Folder | Verdict | Role |
| --- | --- | --- |
| `osm-poi-amenities/` | `viable_with_limits` | Public OSM POI enrichment for parking, toilets, huts, viewpoints, transit stops, shelters, water, and campsites near route anchors. |
| `wikimedia-commons-media/` | `viable_with_limits` | Licensed visual evidence metadata and attribution candidates from Commons categories. |
| `provenance-license-registry/` | `viable` | Minimal source/license registry and provenance record schema required before mixing evidence. |
| `curated-seed-list/` | `viable` | Manual MVP seed list with route IDs, trailheads, source URLs, quality tags, and logistics gaps. |
| `quality-signals/` | `viable_with_limits` | Explainable non-proprietary quality signals derived from manual seeds, OSM POIs, and Commons media presence. |

## Reproduction

Run public API samples:

```bash
python3 data-source-pocs/quality-provenance-discovery/osm-poi-amenities/poc.py
python3 data-source-pocs/quality-provenance-discovery/wikimedia-commons-media/poc.py
```

Both scripts use only the Python standard library and write `raw/sample-*.json` plus `normalized/sample-*.json`.

## Cross-Source Verdict

These sources are enough for MVP discovery and dossier evidence if they are framed correctly: OSM/Commons/manual seeds can explain why a hike is promising, what amenities/logistics exist nearby, and where each claim came from. They are not enough for authoritative safety, closure, season, live transport, parking availability, or proprietary popularity/review ranking.

The product should store every derived quality claim with a provenance record and distinguish open-data evidence from editorial/manual assertions.
