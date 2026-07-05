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
ENDPOINT = "https://photon.komoot.io/api/"
TERMS_URL = "https://github.com/komoot/photon"

CASES = [
    {"id": "gjendesheim", "query": "Gjendesheim", "case": "besseggen", "lat": 61.4947, "lon": 8.8124},
    {"id": "skjeggedal", "query": "Skjeggedal", "case": "trolltunga", "lat": 60.1308, "lon": 6.6250},
    {"id": "fort-william", "query": "Fort William", "case": "ben-nevis-cmd", "lat": 56.8198, "lon": -5.1052},
]


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    normalized_results = []
    for case in CASES:
        params = {"q": case["query"], "limit": 5, "lat": case["lat"], "lon": case["lon"]}
        url = f"{ENDPOINT}?{urllib.parse.urlencode(params)}"
        request = urllib.request.Request(url, headers={"User-Agent": "trail-planner-data-source-poc/0.1"})
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode())
        raw_path = RAW / f"sample-{case['id']}.json"
        raw_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")
        features = payload.get("features", [])
        normalized_results.append({
            "case": case["case"],
            "query": case["query"],
            "result_count": len(features),
            "top_results": [
                {
                    "name": f.get("properties", {}).get("name"),
                    "country": f.get("properties", {}).get("country"),
                    "state": f.get("properties", {}).get("state"),
                    "city": f.get("properties", {}).get("city"),
                    "osm_type": f.get("properties", {}).get("osm_type"),
                    "osm_id": f.get("properties", {}).get("osm_id"),
                    "coordinates": f.get("geometry", {}).get("coordinates"),
                }
                for f in features[:5]
            ],
            "raw_sample": f"raw/{raw_path.name}",
        })
        time.sleep(1.0)

    normalized = {
        "id": "trailhead-place-search-photon",
        "source": "photon_public_demo_komoot",
        "retrieved_at": retrieved_at,
        "query": {"endpoint": ENDPOINT, "cases": CASES},
        "license_or_terms_url": TERMS_URL,
        "freshness": "live_osm_geocoder",
        "confidence": "sample",
        "results": normalized_results,
    }
    (NORMALIZED / "sample-place-search.json").write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n")
    print(json.dumps(normalized_results, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
