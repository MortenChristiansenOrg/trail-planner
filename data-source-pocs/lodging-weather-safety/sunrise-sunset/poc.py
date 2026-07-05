#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"

CASES = [
    {"id": "trolltunga-trail", "name": "Trolltunga trail", "lat": 60.1240, "lon": 6.7400, "tzid": "Europe/Oslo"},
    {"id": "ben-nevis-cmd", "name": "Ben Nevis CMD arete", "lat": 56.7970, "lon": -5.0030, "tzid": "Europe/London"},
]
DATES = ["2026-05-15", "2026-06-21", "2026-09-15", "2026-10-15"]


def fetch_json(url):
    request = Request(url, headers={"User-Agent": "trail-planner-data-source-poc/0.1"})
    try:
        with urlopen(request, timeout=30) as response:
            return {"ok": True, "status_code": response.status, "body": json.loads(response.read().decode("utf-8"))}
    except HTTPError as error:
        return {"ok": False, "status_code": error.code, "body": error.read().decode("utf-8", errors="replace")}
    except URLError as error:
        return {"ok": False, "status_code": None, "body": str(error)}


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    for case in CASES:
        normalized_days = []
        raw_days = []
        for date in DATES:
            query = {
                "lat": case["lat"],
                "lng": case["lon"],
                "date": date,
                "formatted": 0,
                "tzid": case["tzid"],
            }
            url = "https://api.sunrise-sunset.org/json?" + urlencode(query)
            raw = fetch_json(url)
            raw_days.append({"url": url, "query": query, "response": raw})
            body = raw.get("body") if raw.get("ok") else {}
            results = body.get("results", {}) if isinstance(body, dict) else {}
            normalized_days.append(
                {
                    "date": date,
                    "sunrise": results.get("sunrise"),
                    "sunset": results.get("sunset"),
                    "day_length_seconds": results.get("day_length"),
                    "civil_twilight_begin": results.get("civil_twilight_begin"),
                    "civil_twilight_end": results.get("civil_twilight_end"),
                    "api_status": body.get("status") if isinstance(body, dict) else "HTTP_ERROR",
                    "http_status_code": raw.get("status_code"),
                    "tzid": body.get("tzid") if isinstance(body, dict) else None,
                }
            )
        write_json(RAW / f"sample-{case['id']}.json", raw_days)
        write_json(
            NORMALIZED / f"sample-{case['id']}.json",
            {
                "id": f"{case['id']}-sunrise-sunset",
                "source": "sunrise_sunset_api",
                "retrieved_at": retrieved_at,
                "case": case,
                "query": {"dates": DATES, "formatted": 0, "tzid": case["tzid"]},
                "license_or_terms_url": "https://sunrise-sunset.org/api",
                "freshness": "astronomical_calculation",
                "confidence": "sample",
                "days": normalized_days,
                "limitations": ["Does not model ridge shape, terrain shadows, cloud, or snow travel speed."],
            },
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
