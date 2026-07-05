#!/usr/bin/env python3
import json
import os
import pathlib
import urllib.request
from datetime import datetime, timezone

BASE_URL = os.environ.get("TOLLGURU_BASE_URL", "https://apis.tollguru.com")


def main() -> None:
    api_key = os.environ["TOLLGURU_API_KEY"]
    payload = {
        "from": {"address": "Aalborg, Denmark"},
        "to": {"address": "Gjendesheim, Norway"},
        "vehicle": {"type": "2AxlesAuto"},
        "fuelOptions": {"fuelCost": {"value": 15.0, "units": "DKK/liter"}, "fuelEfficiency": {"city": 7.0, "hwy": 6.0, "units": "l/100km"}},
    }
    request = urllib.request.Request(
        f"{BASE_URL}/toll/v2/origin-destination-waypoints",
        data=json.dumps(payload).encode(),
        method="POST",
        headers={"Content-Type": "application/json", "x-api-key": api_key},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        data = json.loads(response.read().decode())
    base = pathlib.Path(__file__).resolve().parent
    (base / "raw").mkdir(exist_ok=True)
    (base / "normalized").mkdir(exist_ok=True)
    raw_path = base / "raw" / "sample-aalborg-gjendesheim-costs.json"
    raw_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    normalized = {
        "source": "tollguru",
        "retrieved_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "query": payload,
        "license_or_terms_url": "https://tollguru.com/toll-api-pricing-plans",
        "freshness": "live_route_cost_sample",
        "confidence": "sample_estimate",
        "summary": data.get("summary") or data.get("route") or {},
    }
    out_path = base / "normalized" / "sample-aalborg-gjendesheim-costs.json"
    out_path.write_text(json.dumps(normalized, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {raw_path}")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
