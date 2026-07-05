#!/usr/bin/env python3
import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API_KEY = os.environ.get("ORS_API_KEY")
ENDPOINT = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
ROOT = Path(__file__).resolve().parent

CASES = {
    "aalborg-to-gjendesheim": {
        "origin": {"name": "Aalborg", "coordinates": [9.9217, 57.0488]},
        "destination": {"name": "Gjendesheim", "coordinates": [8.8125, 61.4944]},
    },
    "aalborg-to-odda": {
        "origin": {"name": "Aalborg", "coordinates": [9.9217, 57.0488]},
        "destination": {"name": "Odda", "coordinates": [6.5456, 60.0691]},
    },
}


def main():
    if not API_KEY:
        raise SystemExit("Set ORS_API_KEY. See .env.example.")
    ROOT.joinpath("raw").mkdir(exist_ok=True)
    ROOT.joinpath("normalized").mkdir(exist_ok=True)
    for case_id, case in CASES.items():
        payload = json.dumps({"coordinates": [case["origin"]["coordinates"], case["destination"]["coordinates"]]}).encode()
        request = urllib.request.Request(
            ENDPOINT,
            data=payload,
            headers={"Authorization": API_KEY, "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = json.loads(response.read().decode("utf-8"))
        ROOT.joinpath("raw", f"sample-{case_id}.json").write_text(json.dumps(raw, indent=2) + "\n")
        summary = raw["features"][0]["properties"]["summary"]
        normalized = {
            "id": f"{case_id}-ors",
            "source": "openrouteservice",
            "retrieved_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "query": {"endpoint": ENDPOINT, "case": case_id, "profile": "driving-car", **case},
            "license_or_terms_url": "https://openrouteservice.org/restrictions/",
            "freshness": "osm_based_hosted_route",
            "confidence": "api_key_required_sample",
            "origin": case["origin"]["name"],
            "destination": case["destination"]["name"],
            "mode": "car",
            "duration_minutes": round(summary["duration"] / 60, 1),
            "distance_km": round(summary["distance"] / 1000, 2),
            "segments": [],
            "cost": None,
        }
        ROOT.joinpath("normalized", f"sample-{case_id}.json").write_text(json.dumps(normalized, indent=2) + "\n")
        print(f"wrote {case_id}")


if __name__ == "__main__":
    main()
