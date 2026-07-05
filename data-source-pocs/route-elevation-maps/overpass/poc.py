#!/usr/bin/env python3
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"
ENDPOINT = "https://overpass-api.de/api/interpreter"
TERMS_URL = "https://www.openstreetmap.org/copyright"

CASES = {
    "besseggen": {
        "name": "Besseggen",
        "bbox": [61.47, 8.63, 61.57, 8.83],
    },
    "trolltunga": {
        "name": "Trolltunga",
        "bbox": [60.08, 6.55, 60.18, 6.82],
    },
    "ben-nevis-cmd": {
        "name": "Ben Nevis CMD",
        "bbox": [56.76, -5.05, 56.84, -4.90],
    },
}


def fetch(case_slug, case):
    south, west, north, east = case["bbox"]
    query = f"""
[out:json][timeout:60];
(
  relation["route"="hiking"]({south},{west},{north},{east});
  way["highway"~"^(path|footway|track|bridleway|steps)$"]({south},{west},{north},{east});
  node["amenity"~"^(parking|shelter|toilets|drinking_water)$"]({south},{west},{north},{east});
  node["tourism"~"^(alpine_hut|wilderness_hut|camp_site)$"]({south},{west},{north},{east});
  node["public_transport"]({south},{west},{north},{east});
);
out body geom;
"""
    data = urllib.parse.urlencode({"data": query}).encode()
    request = urllib.request.Request(
        ENDPOINT,
        data=data,
        headers={
            "User-Agent": "trail-planner-data-source-poc/0.1 (local evaluation)",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        payload = json.loads(response.read().decode())

    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    raw_path = RAW / f"sample-{case_slug}.json"
    raw_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")

    elements = payload.get("elements", [])
    route_relations = [e for e in elements if e.get("type") == "relation" and e.get("tags", {}).get("route") == "hiking"]
    ways = [e for e in elements if e.get("type") == "way"]
    pois = [e for e in elements if e.get("type") == "node"]
    first_way = next((w for w in ways if w.get("geometry")), None)
    geometry = {
        "type": "LineString",
        "coordinates": [[p["lon"], p["lat"]] for p in first_way.get("geometry", [])],
    } if first_way else None

    normalized = {
        "id": f"{case_slug}-osm-overpass",
        "name": case["name"],
        "source": "openstreetmap_overpass",
        "retrieved_at": retrieved_at,
        "query": {"endpoint": ENDPOINT, "bbox": case["bbox"]},
        "license_or_terms_url": TERMS_URL,
        "freshness": payload.get("osm3s", {}).get("timestamp_osm_base", "unknown"),
        "confidence": "sample",
        "summary": {
            "route_relation_count": len(route_relations),
            "path_way_count": len(ways),
            "poi_count": len(pois),
        },
        "route_relations": [
            {
                "type": r["type"],
                "id": r["id"],
                "name": r.get("tags", {}).get("name"),
                "tags": r.get("tags", {}),
                "member_count": len(r.get("members", [])),
            }
            for r in route_relations[:20]
        ],
        "sample_geometry": geometry,
        "sample_path_tags": first_way.get("tags", {}) if first_way else {},
    }
    normalized_path = NORMALIZED / f"sample-{case_slug}.json"
    normalized_path.write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n")
    return case_slug, normalized["summary"]


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    results = []
    for slug, case in CASES.items():
        results.append(fetch(slug, case))
        time.sleep(2)
    print(json.dumps(dict(results), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
