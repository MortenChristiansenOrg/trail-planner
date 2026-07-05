#!/usr/bin/env python3
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE_URL = "https://router.project-osrm.org"

CASES = {
    "aalborg-to-hirtshals": {
        "origin": {"name": "Aalborg", "coordinates": [9.9217, 57.0488]},
        "destination": {"name": "Hirtshals ferry terminal", "coordinates": [9.9590, 57.5916]},
    },
    "bergen-to-odda": {
        "origin": {"name": "Bergen", "coordinates": [5.3336, 60.3894]},
        "destination": {"name": "Odda", "coordinates": [6.5456, 60.0691]},
    },
}


def main():
    ROOT.joinpath("raw").mkdir(exist_ok=True)
    ROOT.joinpath("normalized").mkdir(exist_ok=True)
    for case_id, case in CASES.items():
        o = case["origin"]["coordinates"]
        d = case["destination"]["coordinates"]
        endpoint = (
            f"{BASE_URL}/route/v1/driving/{o[0]},{o[1]};{d[0]},{d[1]}"
            "?overview=false&alternatives=false&steps=false"
        )
        with urllib.request.urlopen(endpoint, timeout=60) as response:
            raw = json.loads(response.read().decode("utf-8"))
        ROOT.joinpath("raw", f"sample-{case_id}.json").write_text(json.dumps(raw, indent=2) + "\n")
        route = raw.get("routes", [{}])[0]
        normalized = {
            "id": f"{case_id}-osrm",
            "source": "osrm_public_demo",
            "retrieved_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "query": {"endpoint": endpoint, "case": case_id, **case},
            "license_or_terms_url": "https://project-osrm.org/",
            "freshness": "osm_based_demo_route",
            "confidence": "public_demo_sample",
            "origin": case["origin"]["name"],
            "destination": case["destination"]["name"],
            "mode": "car",
            "duration_minutes": round((route.get("duration") or 0) / 60, 1) if route else None,
            "distance_km": round((route.get("distance") or 0) / 1000, 2) if route else None,
            "segments": [],
            "cost": None,
            "status": raw.get("code"),
        }
        ROOT.joinpath("normalized", f"sample-{case_id}.json").write_text(json.dumps(normalized, indent=2) + "\n")
        print(f"wrote {case_id}: {raw.get('code')}")


if __name__ == "__main__":
    main()
