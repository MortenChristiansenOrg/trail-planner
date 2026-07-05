#!/usr/bin/env python3
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"

CASES = [
    {"id": "besseggen", "name": "Besseggen / Jotunheimen", "lat": 61.5060, "lon": 8.7980, "radius_m": 10000},
]


def post_json(url, body):
    encoded = json.dumps(body)
    try:
        result = subprocess.run(
            [
                "curl",
                "-sS",
                "--max-time",
                "25",
                "-w",
                "\n%{http_code}",
                "-X",
                "POST",
                url,
                "-H",
                "Content-Type: application/json",
                "-H",
                "Accept: application/json",
                "-d",
                encoded,
            ],
            check=False,
            capture_output=True,
            text=True,
            timeout=30,
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        return {"ok": False, "status_code": None, "headers": {}, "body": str(error)}
    output, _, status_text = result.stdout.rpartition("\n")
    try:
        status_code = int(status_text)
    except ValueError:
        status_code = None
        output = result.stdout
    try:
        body_json = json.loads(output) if output else None
    except json.JSONDecodeError:
        body_json = output
    return {
        "ok": result.returncode == 0 and status_code is not None and 200 <= status_code < 300,
        "status_code": status_code,
        "headers": {},
        "body": body_json,
        "curl_returncode": result.returncode,
        "stderr": result.stderr,
    }


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def normalize_registration(reg):
    loc = reg.get("ObsLocation") or {}
    observer = reg.get("Observer") or {}
    return {
        "reg_id": reg.get("RegId"),
        "geo_hazard_tid": reg.get("GeoHazardTID"),
        "geo_hazard_name": reg.get("GeoHazardName"),
        "observed_at": reg.get("DtObsTime"),
        "registered_at": reg.get("DtRegTime"),
        "changed_at": reg.get("DtChangeTime"),
        "source_name": reg.get("SourceName"),
        "location": {
            "name": loc.get("LocationName") or loc.get("Title") or reg.get("Title"),
            "latitude": loc.get("Latitude", reg.get("Latitude")),
            "longitude": loc.get("Longitude", reg.get("Longitude")),
            "height_m": loc.get("Height"),
            "municipality": loc.get("MunicipalName"),
            "forecast_region": loc.get("ForecastRegionName"),
            "uncertainty_m": loc.get("Uncertainty"),
        },
        "observer": {
            "nickname": observer.get("NickName", reg.get("NickName")),
            "competence_level": observer.get("CompetenceLevelName"),
            "competence_level_tid": observer.get("CompetenceLevelTID", reg.get("CompetenceLevelTID")),
        },
        "summary_types": [s.get("RegistrationName") for s in reg.get("Summaries", []) if s.get("RegistrationName")] or reg.get("FormNames", []),
        "has_attachments": bool(reg.get("Attachments") or reg.get("AttachmentSummaries") or reg.get("AttachmentsCount")),
        "attachments_count": reg.get("AttachmentsCount"),
        "first_attachment_url": reg.get("FirstAttachmentUrl"),
    }


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    url = "https://api.regobs.no/v5/Search/AtAGlance"
    for case in CASES:
        criteria = {
            "LangKey": 2,
            "NumberOfRecords": 5,
            "SelectedGeoHazards": [10],
            "Radius": {
                "Position": {"Latitude": case["lat"], "Longitude": case["lon"]},
                "Radius": case["radius_m"],
            },
            "OrderBy": "DtObsTime",
            "AscendingOrder": False,
        }
        raw_result = post_json(url, criteria)
        raw_body = raw_result.get("body") if raw_result.get("ok") else []
        if not isinstance(raw_body, list):
            raw_body = []
        write_json(RAW / f"sample-{case['id']}.json", {"url": url, "criteria": criteria, "response": raw_result})
        write_json(
            NORMALIZED / f"sample-{case['id']}.json",
            {
                "id": f"{case['id']}-regobs-search",
                "source": "nve_regobs",
                "retrieved_at": retrieved_at,
                "case": case,
                "query": criteria,
                "license_or_terms_url": "https://www.varsom.no/en/about/regobs/regobs-about-data-terms-of-service-and-privacy-policy/",
                "freshness": "user_observations_search",
                "confidence": "sample",
                "http_status_code": raw_result.get("status_code"),
                "observations": [normalize_registration(reg) for reg in raw_body],
                "limitations": [
                    "User observations are fresh but may contain errors, omissions, or later edits/deletions.",
                    "Absence of observations is not evidence of safe conditions.",
                    "Trail Planner must show attribution to Regobs/Varsom and observer/photographer where relevant.",
                ],
            },
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
