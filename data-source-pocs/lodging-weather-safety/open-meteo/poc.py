#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"

CASES = [
    {
        "id": "besseggen-high-point",
        "name": "Besseggen high point",
        "lat": 61.5060,
        "lon": 8.7980,
        "elevation_m": 1743,
        "timezone": "Europe/Oslo",
    },
    {
        "id": "trolltunga-trail",
        "name": "Trolltunga trail",
        "lat": 60.1240,
        "lon": 6.7400,
        "elevation_m": 1100,
        "timezone": "Europe/Oslo",
    },
    {
        "id": "ben-nevis-cmd",
        "name": "Ben Nevis CMD arete",
        "lat": 56.7970,
        "lon": -5.0030,
        "elevation_m": 1345,
        "timezone": "Europe/London",
    },
]


def fetch_json(url):
    with urlopen(url, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def summarize_forecast(case, raw, retrieved_at, query):
    daily = raw.get("daily", {})
    hourly = raw.get("hourly", {})
    times = daily.get("time", [])
    days = []
    for i, day in enumerate(times[:7]):
        days.append(
            {
                "date": day,
                "temperature_2m_min_c": daily.get("temperature_2m_min", [None] * len(times))[i],
                "temperature_2m_max_c": daily.get("temperature_2m_max", [None] * len(times))[i],
                "precipitation_sum_mm": daily.get("precipitation_sum", [None] * len(times))[i],
                "rain_sum_mm": daily.get("rain_sum", [None] * len(times))[i],
                "snowfall_sum_cm": daily.get("snowfall_sum", [None] * len(times))[i],
                "wind_speed_10m_max_kmh": daily.get("wind_speed_10m_max", [None] * len(times))[i],
                "weather_code": daily.get("weather_code", [None] * len(times))[i],
            }
        )
    return {
        "id": f"{case['id']}-open-meteo-forecast",
        "source": "open_meteo_forecast",
        "retrieved_at": retrieved_at,
        "case": case,
        "query": query,
        "license_or_terms_url": "https://open-meteo.com/en/terms",
        "freshness": "live_forecast",
        "confidence": "sample",
        "days": days,
        "hourly_fields_present": sorted(k for k in hourly.keys() if k != "time"),
        "limitations": [
            "Point forecast, not route-wide or terrain-shadow aware.",
            "Mountain microclimates and ridge winds require conservative UI confidence.",
        ],
    }


def summarize_archive(case, raw, retrieved_at, query):
    daily = raw.get("daily", {})
    times = daily.get("time", [])
    days = []
    for i, day in enumerate(times):
        days.append(
            {
                "date": day,
                "temperature_2m_mean_c": daily.get("temperature_2m_mean", [None] * len(times))[i],
                "temperature_2m_min_c": daily.get("temperature_2m_min", [None] * len(times))[i],
                "temperature_2m_max_c": daily.get("temperature_2m_max", [None] * len(times))[i],
                "precipitation_sum_mm": daily.get("precipitation_sum", [None] * len(times))[i],
                "rain_sum_mm": daily.get("rain_sum", [None] * len(times))[i],
                "snowfall_sum_cm": daily.get("snowfall_sum", [None] * len(times))[i],
            }
        )
    return {
        "id": f"{case['id']}-open-meteo-archive",
        "source": "open_meteo_historical_weather",
        "retrieved_at": retrieved_at,
        "case": case,
        "query": query,
        "license_or_terms_url": "https://open-meteo.com/en/terms",
        "freshness": "historical_reanalysis_sample",
        "confidence": "sample",
        "days": days,
    }


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    for case in CASES:
        forecast_query = {
            "latitude": case["lat"],
            "longitude": case["lon"],
            "elevation": case["elevation_m"],
            "timezone": case["timezone"],
            "hourly": "temperature_2m,precipitation,wind_speed_10m,snowfall,snow_depth",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum,wind_speed_10m_max",
            "forecast_days": 7,
        }
        forecast_url = "https://api.open-meteo.com/v1/forecast?" + urlencode(forecast_query)
        forecast_raw = fetch_json(forecast_url)
        write_json(RAW / f"sample-{case['id']}-forecast.json", {"url": forecast_url, "response": forecast_raw})
        write_json(
            NORMALIZED / f"sample-{case['id']}-forecast.json",
            summarize_forecast(case, forecast_raw, retrieved_at, forecast_query),
        )

        archive_query = {
            "latitude": case["lat"],
            "longitude": case["lon"],
            "elevation": case["elevation_m"],
            "timezone": case["timezone"],
            "start_date": "2025-07-01",
            "end_date": "2025-07-07",
            "daily": "temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum",
        }
        archive_url = "https://archive-api.open-meteo.com/v1/archive?" + urlencode(archive_query)
        archive_raw = fetch_json(archive_url)
        write_json(RAW / f"sample-{case['id']}-archive.json", {"url": archive_url, "response": archive_raw})
        write_json(
            NORMALIZED / f"sample-{case['id']}-archive.json",
            summarize_archive(case, archive_raw, retrieved_at, archive_query),
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
