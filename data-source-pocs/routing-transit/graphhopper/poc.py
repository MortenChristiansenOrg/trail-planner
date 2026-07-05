#!/usr/bin/env python3
import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API_KEY = os.environ.get("GRAPHHOPPER_API_KEY")
ROOT = Path(__file__).resolve().parent

CASES = {
    "aalborg-to-gjendesheim": {
        "origin": {"name": "Aalborg", "point": "57.0488,9.9217"},
        "destination": {"name": "Gjendesheim", "point": "61.4944,8.8125"},
    },
    "aalborg-to-odda": {
        "origin": {"name": "Aalborg", "point": "57.0488,9.9217"},
        "destination": {"name": "Odda", "point": "60.0691,6.5456"},
    },
}


def main():
    if not API_KEY:
        raise SystemExit("Set GRAPHHOPPER_API_KEY. See .env.example.")
    ROOT.joinpath("raw").mkdir(exist_ok=True)
    ROOT.joinpath("normalized").mkdir(exist_ok=True)
    for case_id, case in CASES.items():
        params = urllib.parse.urlencode(
            [
                ("point", case["origin"]["point"]),
                ("point", case["destination"]["point"]),
                ("profile", "car"),
                ("locale", "en"),
                ("points_encoded", "false"),
                ("key", API_KEY),
            ]
        )
        endpoint = f"https://graphhopper.com/api/1/route?{params}"
        with urllib.request.urlopen(endpoint, timeout=60) as response:
            raw = json.loads(response.read().decode("utf-8"))
        ROOT.joinpath("raw", f"sample-{case_id}.json").write_text(json.dumps(raw, indent=2) + "\n")
        path = raw["paths"][0]
        normalized = {
            "id": f"{case_id}-graphhopper",
            "source": "graphhopper",
            "retrieved_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "query": {"endpoint": "https://graphhopper.com/api/1/route", "case": case_id, "profile": "car", **case},
            "license_or_terms_url": "https://www.graphhopper.com/terms/",
            "freshness": "osm_based_hosted_route",
            "confidence": "api_key_required_sample",
            "origin": case["origin"]["name"],
            "destination": case["destination"]["name"],
            "mode": "car",
            "duration_minutes": round(path["time"] / 60000, 1),
            "distance_km": round(path["distance"] / 1000, 2),
            "segments": [],
            "cost": None,
        }
        ROOT.joinpath("normalized", f"sample-{case_id}.json").write_text(json.dumps(normalized, indent=2) + "\n")
        print(f"wrote {case_id}")


if __name__ == "__main__":
    main()
