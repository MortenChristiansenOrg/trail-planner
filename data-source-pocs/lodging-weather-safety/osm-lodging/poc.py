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
    {"id": "besseggen", "name": "Besseggen / Gjendesheim", "lat": 61.4940, "lon": 8.8120, "radius_m": 15000},
    {"id": "trolltunga", "name": "Trolltunga / Skjeggedal", "lat": 60.1240, "lon": 6.7400, "radius_m": 15000},
    {"id": "ben-nevis", "name": "Ben Nevis / Fort William", "lat": 56.8170, "lon": -5.1060, "radius_m": 12000},
]


def overpass_query(case):
    return f"""
[out:json][timeout:60];
(
  node(around:{case['radius_m']},{case['lat']},{case['lon']})[tourism~"^(alpine_hut|wilderness_hut|camp_site|caravan_site|hostel|hotel|guest_house|chalet)$"];
  way(around:{case['radius_m']},{case['lat']},{case['lon']})[tourism~"^(alpine_hut|wilderness_hut|camp_site|caravan_site|hostel|hotel|guest_house|chalet)$"];
  relation(around:{case['radius_m']},{case['lat']},{case['lon']})[tourism~"^(alpine_hut|wilderness_hut|camp_site|caravan_site|hostel|hotel|guest_house|chalet)$"];
);
out center tags;
""".strip()


def fetch_json(query):
    url = "https://overpass-api.de/api/interpreter?" + urlencode({"data": query})
    request = Request(
        url,
        headers={"User-Agent": "trail-planner-data-source-poc/0.1"},
    )
    try:
        with urlopen(request, timeout=90) as response:
            return {"ok": True, "status_code": response.status, "body": json.loads(response.read().decode("utf-8"))}
    except HTTPError as error:
        return {"ok": False, "status_code": error.code, "body": error.read().decode("utf-8", errors="replace")}
    except URLError as error:
        return {"ok": False, "status_code": None, "body": str(error)}


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def normalize_element(element):
    tags = element.get("tags", {})
    center = element.get("center", {})
    return {
        "osm_type": element.get("type"),
        "osm_id": element.get("id"),
        "name": tags.get("name"),
        "tourism": tags.get("tourism"),
        "operator": tags.get("operator"),
        "website": tags.get("website") or tags.get("contact:website"),
        "phone": tags.get("phone") or tags.get("contact:phone"),
        "email": tags.get("email") or tags.get("contact:email"),
        "reservation": tags.get("reservation"),
        "seasonal": tags.get("seasonal"),
        "capacity": tags.get("capacity"),
        "fee": tags.get("fee"),
        "coordinates": {
            "lat": element.get("lat", center.get("lat")),
            "lon": element.get("lon", center.get("lon")),
        },
        "raw_tags": tags,
    }


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    for case in CASES:
        query = overpass_query(case)
        raw = fetch_json(query)
        write_json(RAW / f"sample-{case['id']}.json", {"endpoint": "https://overpass-api.de/api/interpreter", "query": query, "response": raw})
        body = raw.get("body") if raw.get("ok") else {}
        elements = body.get("elements", []) if isinstance(body, dict) else []
        features = [normalize_element(e) for e in elements]
        write_json(
            NORMALIZED / f"sample-{case['id']}.json",
            {
                "id": f"{case['id']}-osm-lodging",
                "source": "openstreetmap_overpass",
                "retrieved_at": retrieved_at,
                "case": case,
                "query": query,
                "license_or_terms_url": "https://www.openstreetmap.org/copyright",
                "freshness": "osm_snapshot_via_overpass",
                "confidence": "sample",
                "http_status_code": raw.get("status_code"),
                "features": features,
                "limitations": [
                    "Good for finding mapped lodging/campsite candidates.",
                    "Not a live source for price, legal tenting rules, opening status, or availability.",
                ],
            },
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
