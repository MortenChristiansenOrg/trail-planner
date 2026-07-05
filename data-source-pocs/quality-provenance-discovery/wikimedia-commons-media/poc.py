#!/usr/bin/env python3
import html
import json
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"
API_URL = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "TrailPlannerDataSourcePOC/0.1 (local evaluation; contact unavailable)"

CASES = {
    "besseggen": {"name": "Besseggen", "category": "Category:Besseggen"},
    "trolltunga": {"name": "Trolltunga", "category": "Category:Trolltunga"},
    "ben-nevis": {"name": "Ben Nevis", "category": "Category:Ben Nevis"},
}


def retrieved_at() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def api(params: dict) -> dict:
    params = {"format": "json", "formatversion": "2", **params}
    url = API_URL + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as response:
        payload = json.load(response)
    payload["_trail_planner_query"] = {
        "endpoint": API_URL,
        "retrieved_at": retrieved_at(),
        "params": params,
        "url": url,
    }
    return payload


def strip_html(value):
    if not value:
        return None
    value = re.sub(r"<[^>]+>", " ", value)
    value = html.unescape(value)
    return " ".join(value.split())


def ext(meta: dict, key: str):
    item = meta.get(key) or {}
    return strip_html(item.get("value"))


def normalize(case_slug: str, case: dict, raw: dict) -> dict:
    pages = raw.get("query", {}).get("pages", [])
    media = []
    for page in pages:
        info = (page.get("imageinfo") or [{}])[0]
        metadata = info.get("extmetadata") or {}
        media.append(
            {
                "title": page["title"],
                "pageid": page.get("pageid"),
                "page_url": info.get("descriptionurl"),
                "thumb_url": info.get("thumburl"),
                "original_url": info.get("url"),
                "width": info.get("width"),
                "height": info.get("height"),
                "uploaded_by": info.get("user"),
                "artist": ext(metadata, "Artist"),
                "credit": ext(metadata, "Credit"),
                "license_short_name": ext(metadata, "LicenseShortName"),
                "license_url": ext(metadata, "LicenseUrl"),
                "usage_terms": ext(metadata, "UsageTerms"),
                "attribution_required": ext(metadata, "AttributionRequired"),
                "copyrighted": ext(metadata, "Copyrighted"),
            }
        )
    return {
        "id": f"{case_slug}-wikimedia-commons-media",
        "case": case_slug,
        "source": "wikimedia_commons_mediawiki_api",
        "retrieved_at": raw["_trail_planner_query"]["retrieved_at"],
        "query": {
            "endpoint": API_URL,
            "category": case["category"],
            "limit": 5,
        },
        "license_or_terms_url": "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia",
        "freshness": "current_category_membership_at_request_time",
        "confidence": "sample",
        "media_count": len(media),
        "media": media,
    }


def fetch_case(case: dict) -> dict:
    members = api(
        {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": case["category"],
            "cmtype": "file",
            "cmlimit": "5",
        }
    )
    titles = [item["title"] for item in members.get("query", {}).get("categorymembers", [])]
    if not titles:
        return members
    details = api(
        {
            "action": "query",
            "prop": "imageinfo",
            "titles": "|".join(titles),
            "iiprop": "url|user|dimensions|extmetadata",
            "iiurlwidth": "400",
        }
    )
    details["_trail_planner_categorymembers"] = members
    return details


def main():
    RAW.mkdir(exist_ok=True)
    NORMALIZED.mkdir(exist_ok=True)
    for index, (slug, case) in enumerate(CASES.items()):
        raw = fetch_case(case)
        (RAW / f"sample-{slug}.json").write_text(json.dumps(raw, indent=2, sort_keys=True) + "\n")
        normalized = normalize(slug, case, raw)
        (NORMALIZED / f"sample-{slug}.json").write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n")
        if index < len(CASES) - 1:
            time.sleep(1)


if __name__ == "__main__":
    main()
