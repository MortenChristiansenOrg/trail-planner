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
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
USER_AGENT = "TrailPlannerDataSourcePOC/0.1 (local evaluation; contact unavailable)"

CASES = {
    "besseggen": {"name": "Besseggen / Gjendesheim", "lat": 61.4947, "lon": 8.8105, "radius_m": 4500},
    "trolltunga": {"name": "Trolltunga / Skjeggedal", "lat": 60.1241, "lon": 6.7394, "radius_m": 4500},
    "ben-nevis-cmd": {"name": "Ben Nevis CMD / North Face car park", "lat": 56.8499, "lon": -5.0444, "radius_m": 4500},
}

POI_BLOCKS = [
    'nwr(around:{radius},{lat},{lon})["amenity"~"^(parking|toilets|drinking_water|shelter|restaurant|cafe|ferry_terminal)$"];',
    'nwr(around:{radius},{lat},{lon})["tourism"~"^(alpine_hut|wilderness_hut|camp_site|viewpoint|information)$"];',
    'nwr(around:{radius},{lat},{lon})["highway"="bus_stop"];',
    'nwr(around:{radius},{lat},{lon})["public_transport"];',
    'nwr(around:{radius},{lat},{lon})["waterway"="water_point"];',
]


def retrieved_at() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def overpass_query(case: dict) -> str:
    body = "\n  ".join(
        block.format(radius=case["radius_m"], lat=case["lat"], lon=case["lon"])
        for block in POI_BLOCKS
    )
    return f"""[out:json][timeout:30];
(
  {body}
);
out center tags meta;"""


def fetch(case_slug: str, case: dict) -> dict:
    query = overpass_query(case)
    data = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(
        OVERPASS_URL,
        data=data,
        headers={"User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=60) as response:
        payload = json.load(response)
    payload["_trail_planner_query"] = {
        "case": case_slug,
        "case_name": case["name"],
        "endpoint": OVERPASS_URL,
        "retrieved_at": retrieved_at(),
        "query": query,
    }
    return payload


def classify(tags: dict) -> str:
    if tags.get("amenity") == "parking":
        return "parking"
    if tags.get("amenity") in {"toilets", "drinking_water", "shelter", "ferry_terminal", "restaurant", "cafe"}:
        return tags["amenity"]
    if tags.get("tourism") in {"alpine_hut", "wilderness_hut", "camp_site", "viewpoint", "information"}:
        return tags["tourism"]
    if tags.get("highway") == "bus_stop" or "public_transport" in tags:
        return "transit_stop"
    if tags.get("waterway") == "water_point":
        return "water"
    return "other"


def coordinates(element: dict):
    if "lat" in element and "lon" in element:
        return [element["lon"], element["lat"]]
    center = element.get("center")
    if center:
        return [center["lon"], center["lat"]]
    return None


def normalize(case_slug: str, raw: dict) -> dict:
    query_info = raw["_trail_planner_query"]
    features = []
    for element in raw.get("elements", []):
        tags = element.get("tags", {})
        coord = coordinates(element)
        if not coord:
            continue
        features.append(
            {
                "id": f"osm-{element['type']}-{element['id']}",
                "name": tags.get("name"),
                "category": classify(tags),
                "osm_type": element["type"],
                "osm_id": element["id"],
                "coordinates": coord,
                "tags": tags,
                "last_osm_timestamp": element.get("timestamp"),
            }
        )
    features.sort(key=lambda item: (item["category"], item["name"] or "", item["id"]))
    return {
        "id": f"{case_slug}-osm-poi-amenities",
        "case": case_slug,
        "source": "openstreetmap_overpass",
        "retrieved_at": query_info["retrieved_at"],
        "query": {
            "endpoint": query_info["endpoint"],
            "radius_m": CASES[case_slug]["radius_m"],
            "center": [CASES[case_slug]["lon"], CASES[case_slug]["lat"]],
            "overpass_ql": query_info["query"],
        },
        "license_or_terms_url": "https://www.openstreetmap.org/copyright",
        "freshness": "osm_element_timestamp_when_available",
        "confidence": "sample",
        "attribution": "© OpenStreetMap contributors",
        "feature_count": len(features),
        "features": features,
    }


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    for index, (slug, case) in enumerate(CASES.items()):
        raw = fetch(slug, case)
        (RAW / f"sample-{slug}.json").write_text(json.dumps(raw, indent=2, sort_keys=True) + "\n")
        normalized = normalize(slug, raw)
        (NORMALIZED / f"sample-{slug}.json").write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n")
        if index < len(CASES) - 1:
            time.sleep(2)


if __name__ == "__main__":
    main()
