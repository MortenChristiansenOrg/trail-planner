#!/usr/bin/env python3
import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"
ENDPOINT = "https://api.open-meteo.com/v1/elevation"
TERMS_URL = "https://open-meteo.com/en/terms"

POINTS = [
    {"id": "besseggen-gjendesheim", "case": "besseggen", "name": "Gjendesheim trailhead", "lat": 61.4947, "lon": 8.8124},
    {"id": "besseggen-ridge", "case": "besseggen", "name": "Besseggen ridge sample", "lat": 61.5076, "lon": 8.7556},
    {"id": "trolltunga-trailhead", "case": "trolltunga", "name": "Skjeggedal trailhead", "lat": 60.1308, "lon": 6.6250},
    {"id": "ben-nevis-summit", "case": "ben-nevis-cmd", "name": "Ben Nevis summit", "lat": 56.7969, "lon": -5.0036},
]


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    latitudes = ",".join(str(p["lat"]) for p in POINTS)
    longitudes = ",".join(str(p["lon"]) for p in POINTS)
    query = {"latitude": latitudes, "longitude": longitudes}
    url = f"{ENDPOINT}?{urllib.parse.urlencode(query)}"
    request = urllib.request.Request(url, headers={"User-Agent": "trail-planner-data-source-poc/0.1"})
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.loads(response.read().decode())

    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    (RAW / "sample-route-points.json").write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")

    samples = []
    for point, elevation in zip(POINTS, payload.get("elevation", [])):
        samples.append({**point, "elevation_m": elevation})

    normalized = {
        "id": "route-point-elevation-open-meteo",
        "source": "open_meteo_elevation",
        "retrieved_at": retrieved_at,
        "query": {"endpoint": ENDPOINT, **query},
        "license_or_terms_url": TERMS_URL,
        "freshness": "static_dem_service",
        "confidence": "sample",
        "elevation_samples": samples,
        "notes": "Point elevations only. Route ascent/descent requires dense sampling and smoothing.",
    }
    (NORMALIZED / "sample-route-points.json").write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n")
    print(json.dumps(normalized["elevation_samples"], indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
