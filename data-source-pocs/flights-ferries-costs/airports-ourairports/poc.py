#!/usr/bin/env python3
import csv
import json
import pathlib
import urllib.request
from datetime import datetime, timezone

SOURCE_URL = "https://ourairports.com/airports.csv"
TERMS_URL = "https://ourairports.com/data/"

CANDIDATE_IATA = {
    "AAL": "origin",
    "AAR": "origin",
    "BLL": "origin",
    "CPH": "origin",
    "HAM": "origin",
    "OSL": "norway",
    "BGO": "norway",
    "TRD": "norway",
    "SVG": "norway",
    "KEF": "iceland",
    "EDI": "scotland",
    "GLA": "scotland",
    "INV": "scotland",
    "INN": "alps",
    "VCE": "dolomites",
    "VRN": "dolomites",
    "MXP": "alps",
    "BGY": "alps",
    "GVA": "alps",
    "ZRH": "alps",
    "LYS": "alps_pyrenees",
    "TLS": "pyrenees",
    "BCN": "pyrenees",
}


def main() -> None:
    base = pathlib.Path(__file__).resolve().parent
    raw_dir = base / "raw"
    normalized_dir = base / "normalized"
    raw_dir.mkdir(parents=True, exist_ok=True)
    normalized_dir.mkdir(parents=True, exist_ok=True)

    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    with urllib.request.urlopen(SOURCE_URL, timeout=30) as response:
        text = response.read().decode("utf-8-sig")

    rows = list(csv.DictReader(text.splitlines()))
    candidates = [
        row for row in rows if row.get("iata_code") in CANDIDATE_IATA
    ]
    candidates.sort(key=lambda row: (CANDIDATE_IATA[row["iata_code"]], row["iata_code"]))

    raw_path = raw_dir / "sample-candidate-airports.csv"
    with raw_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(candidates)

    normalized = {
        "source": "ourairports",
        "retrieved_at": retrieved_at,
        "query": {
            "source_url": SOURCE_URL,
            "iata_codes": sorted(CANDIDATE_IATA),
        },
        "license_or_terms_url": TERMS_URL,
        "freshness": "nightly_static_dump",
        "confidence": "high_for_static_airport_metadata",
        "airports": [
            {
                "iata": row["iata_code"],
                "icao": row["ident"] if row["ident"] and len(row["ident"]) == 4 else None,
                "name": row["name"],
                "type": row["type"],
                "country": row["iso_country"],
                "region": row["iso_region"],
                "municipality": row["municipality"] or None,
                "latitude": float(row["latitude_deg"]),
                "longitude": float(row["longitude_deg"]),
                "elevation_ft": int(float(row["elevation_ft"])) if row["elevation_ft"] else None,
                "scheduled_service": row["scheduled_service"] == "yes",
                "trail_planner_region": CANDIDATE_IATA[row["iata_code"]],
                "source_url": row["home_link"] or row["wikipedia_link"] or None,
            }
            for row in candidates
        ],
    }

    out_path = normalized_dir / "sample-candidate-airports.json"
    out_path.write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {raw_path}")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
