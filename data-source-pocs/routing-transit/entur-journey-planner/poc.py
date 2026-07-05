#!/usr/bin/env python3
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ENDPOINT = "https://api.entur.io/journey-planner/v3/graphql"
CLIENT_NAME = "trail-planner-routing-transit-poc"
ROOT = Path(__file__).resolve().parent

CASES = {
    "bergen-to-odda": {
        "origin": {"name": "Bergen busstasjon", "coordinates": {"latitude": 60.3894, "longitude": 5.3336}},
        "destination": {"name": "Odda busstasjon", "coordinates": {"latitude": 60.0691, "longitude": 6.5456}},
        "datetime": "2026-07-15T09:00:00+02:00",
    },
    "odda-to-skjeggedal": {
        "origin": {"name": "Odda busstasjon", "coordinates": {"latitude": 60.0691, "longitude": 6.5456}},
        "destination": {"name": "Skjeggedal", "coordinates": {"latitude": 60.1327, "longitude": 6.6270}},
        "datetime": "2026-07-15T09:00:00+02:00",
    },
    "andalsnes-to-venjedalssetra": {
        "origin": {"name": "Andalsnes stasjon", "coordinates": {"latitude": 62.5670, "longitude": 7.6871}},
        "destination": {"name": "Venjedalssetra", "coordinates": {"latitude": 62.5351, "longitude": 7.8283}},
        "datetime": "2026-07-15T08:00:00+02:00",
    },
    "gjendesheim-to-memurubu": {
        "origin": {"name": "Gjendesheim", "coordinates": {"latitude": 61.4944, "longitude": 8.8125}},
        "destination": {"name": "Memurubu", "coordinates": {"latitude": 61.4826, "longitude": 8.6729}},
        "datetime": "2026-07-15T08:00:00+02:00",
    },
}

QUERY = """
query Trip($from: Location!, $to: Location!, $dateTime: DateTime!) {
  trip(
    from: $from
    to: $to
    dateTime: $dateTime
    numTripPatterns: 3
    walkSpeed: 1.2
  ) {
    dateTime
    tripPatterns {
      duration
      walkDistance
      startTime
      endTime
      legs {
        mode
        distance
        duration
        expectedStartTime
        expectedEndTime
        fromPlace { name latitude longitude }
        toPlace { name latitude longitude }
        line {
          id
          publicCode
          name
          transportMode
          transportSubmode
        }
        situations {
          id
          summary { value language }
          description { value language }
        }
      }
    }
    routingErrors {
      code
      description
    }
  }
}
"""


def post_graphql(case):
    payload = json.dumps(
        {
            "query": QUERY,
            "variables": {
                "from": case["origin"],
                "to": case["destination"],
                "dateTime": case["datetime"],
            },
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        ENDPOINT,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "ET-Client-Name": CLIENT_NAME,
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def normalize(case_id, case, raw):
    trip = raw.get("data", {}).get("trip", {})
    patterns = trip.get("tripPatterns") or []
    normalized_patterns = []
    for index, pattern in enumerate(patterns):
        segments = []
        for leg in pattern.get("legs") or []:
            line = leg.get("line") or {}
            segments.append(
                {
                    "mode": leg.get("mode"),
                    "line": {
                        "id": line.get("id"),
                        "public_code": line.get("publicCode"),
                        "name": line.get("name"),
                        "transport_mode": line.get("transportMode"),
                        "transport_submode": line.get("transportSubmode"),
                    }
                    if line
                    else None,
                    "from": leg.get("fromPlace"),
                    "to": leg.get("toPlace"),
                    "start": leg.get("expectedStartTime"),
                    "end": leg.get("expectedEndTime"),
                    "duration_minutes": round((leg.get("duration") or 0) / 60, 1),
                    "distance_km": round((leg.get("distance") or 0) / 1000, 2),
                    "situations": leg.get("situations") or [],
                }
            )
        normalized_patterns.append(
            {
                "rank": index + 1,
                "duration_minutes": round((pattern.get("duration") or 0) / 60, 1),
                "walk_distance_km": round((pattern.get("walkDistance") or 0) / 1000, 2),
                "start": pattern.get("startTime"),
                "end": pattern.get("endTime"),
                "segments": segments,
            }
        )
    return {
        "id": f"{case_id}-entur",
        "source": "entur_journey_planner",
        "retrieved_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "query": {
            "endpoint": ENDPOINT,
            "case": case_id,
            "origin": case["origin"],
            "destination": case["destination"],
            "dateTime": case["datetime"],
        },
        "license_or_terms_url": "https://developer.entur.org/pages-journeyplanner-journeyplanner/",
        "freshness": "scheduled_with_realtime_when_available",
        "confidence": "live_api_sample",
        "origin": case["origin"]["name"],
        "destination": case["destination"]["name"],
        "mode": "public_transport",
        "patterns": normalized_patterns,
        "routing_errors": trip.get("routingErrors") or [],
    }


def main():
    case_ids = sys.argv[1:] or list(CASES)
    for case_id in case_ids:
        if case_id not in CASES:
            raise SystemExit(f"Unknown case '{case_id}'. Known cases: {', '.join(CASES)}")
        case = CASES[case_id]
        raw = post_graphql(case)
        (ROOT / "raw").mkdir(exist_ok=True)
        (ROOT / "normalized").mkdir(exist_ok=True)
        (ROOT / "raw" / f"sample-{case_id}.json").write_text(json.dumps(raw, indent=2, ensure_ascii=False) + "\n")
        normalized = normalize(case_id, case, raw)
        (ROOT / "normalized" / f"sample-{case_id}.json").write_text(
            json.dumps(normalized, indent=2, ensure_ascii=False) + "\n"
        )
        print(f"wrote {case_id}: {len(normalized['patterns'])} pattern(s)")


if __name__ == "__main__":
    main()
