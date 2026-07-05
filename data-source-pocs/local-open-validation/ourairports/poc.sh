#!/usr/bin/env bash
set -euo pipefail

date="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
mkdir -p raw normalized

curl -sS "https://davidmegginson.github.io/ourairports-data/airports.csv" -o raw/airports.csv

python3 - <<'PY'
import csv, json, datetime

targets = {"AAL", "BLL", "AAR", "CPH", "HAM", "OSL", "BGO", "TRD", "EDI", "GLA", "INN", "VCE", "MXP", "KEF"}
retrieved_at = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
rows = []

with open("raw/airports.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        if row.get("iata_code") in targets:
            rows.append({
                "iata_code": row["iata_code"],
                "name": row["name"],
                "type": row["type"],
                "municipality": row["municipality"],
                "country": row["iso_country"],
                "latitude": float(row["latitude_deg"]),
                "longitude": float(row["longitude_deg"]),
                "elevation_ft": int(row["elevation_ft"]) if row["elevation_ft"] else None,
                "scheduled_service": row["scheduled_service"],
                "home_link": row["home_link"],
                "wikipedia_link": row["wikipedia_link"]
            })

payload = {
    "source": "ourairports",
    "source_url": "https://ourairports.com/data/",
    "retrieved_at": retrieved_at,
    "query": {"iata_codes": sorted(targets)},
    "airports": sorted(rows, key=lambda r: r["iata_code"]),
    "confidence": "static_seed_sample"
}

with open("normalized/candidate-airports.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY

