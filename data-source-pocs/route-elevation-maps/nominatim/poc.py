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
ENDPOINT = "https://nominatim.openstreetmap.org/search"
POLICY_URL = "https://operations.osmfoundation.org/policies/nominatim/"

CASES = [
    {"id": "gjendesheim", "query": "Gjendesheim, Norway", "case": "besseggen"},
    {"id": "skjeggedal", "query": "Skjeggedal, Odda, Norway", "case": "trolltunga"},
    {"id": "fort-william", "query": "Fort William, Scotland", "case": "ben-nevis-cmd"},
]


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    normalized_results = []
    for case in CASES:
        params = {"q": case["query"], "format": "jsonv2", "limit": 3, "addressdetails": 1}
        url = f"{ENDPOINT}?{urllib.parse.urlencode(params)}"
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "trail-planner-data-source-poc/0.1 (local evaluation; contact unavailable)"},
        )
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode())
        raw_path = RAW / f"sample-{case['id']}.json"
        raw_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
        normalized_results.append({
            "case": case["case"],
            "query": case["query"],
            "result_count": len(payload),
            "top_results": [
                {
                    "osm_type": item.get("osm_type"),
                    "osm_id": item.get("osm_id"),
                    "display_name": item.get("display_name"),
                    "lat": float(item["lat"]),
                    "lon": float(item["lon"]),
                    "class": item.get("class"),
                    "type": item.get("type"),
                    "importance": item.get("importance"),
                }
                for item in payload[:3]
            ],
            "raw_sample": f"raw/{raw_path.name}",
        })
        time.sleep(1.2)

    normalized = {
        "id": "trailhead-place-search-nominatim",
        "source": "nominatim_public_osm",
        "retrieved_at": retrieved_at,
        "query": {"endpoint": ENDPOINT, "cases": CASES},
        "license_or_terms_url": POLICY_URL,
        "freshness": "live_osm_geocoder",
        "confidence": "sample",
        "results": normalized_results,
    }
    (NORMALIZED / "sample-place-search.json").write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n")
    print(json.dumps(normalized_results, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
