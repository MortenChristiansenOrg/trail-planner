#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"
USER_AGENT = "trail-planner-data-source-poc/0.1 github.com/local/trail-planner"

CASES = [
    {"id": "besseggen-high-point", "name": "Besseggen high point", "lat": 61.5060, "lon": 8.7980, "altitude": 1743},
    {"id": "trolltunga-trail", "name": "Trolltunga trail", "lat": 60.1240, "lon": 6.7400, "altitude": 1100},
]


def fetch_json(url):
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urlopen(request, timeout=30) as response:
        headers = dict(response.headers.items())
        return headers, json.loads(response.read().decode("utf-8"))


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def normalize(case, headers, raw, retrieved_at, query):
    timeseries = raw.get("properties", {}).get("timeseries", [])
    points = []
    for item in timeseries[:16]:
        details = item.get("data", {}).get("instant", {}).get("details", {})
        next_1h = item.get("data", {}).get("next_1_hours", {})
        points.append(
            {
                "time": item.get("time"),
                "air_temperature_c": details.get("air_temperature"),
                "wind_speed_mps": details.get("wind_speed"),
                "wind_from_direction_deg": details.get("wind_from_direction"),
                "relative_humidity_percent": details.get("relative_humidity"),
                "symbol_code_next_1h": next_1h.get("summary", {}).get("symbol_code"),
                "precipitation_next_1h_mm": next_1h.get("details", {}).get("precipitation_amount"),
            }
        )
    return {
        "id": f"{case['id']}-met-norway-locationforecast",
        "source": "met_norway_locationforecast",
        "retrieved_at": retrieved_at,
        "case": case,
        "query": query,
        "license_or_terms_url": "https://api.met.no/doc/TermsOfService",
        "freshness": "live_forecast",
        "confidence": "sample",
        "cache_headers": {
            "expires": headers.get("Expires"),
            "last_modified": headers.get("Last-Modified"),
            "etag": headers.get("ETag"),
        },
        "forecast_points": points,
        "limitations": [
            "Forecast API only; historical station observations require Frost registration/client ID.",
            "Altitude is ground surface height and cannot request forecasts above ground level.",
        ],
    }


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    for case in CASES:
        query = {
            "lat": f"{case['lat']:.4f}",
            "lon": f"{case['lon']:.4f}",
            "altitude": case["altitude"],
        }
        url = "https://api.met.no/weatherapi/locationforecast/2.0/compact?" + urlencode(query)
        headers, raw = fetch_json(url)
        write_json(RAW / f"sample-{case['id']}.json", {"url": url, "request_headers": {"User-Agent": USER_AGENT}, "response_headers": headers, "response": raw})
        write_json(NORMALIZED / f"sample-{case['id']}.json", normalize(case, headers, raw, retrieved_at, query))
    return 0


if __name__ == "__main__":
    sys.exit(main())
