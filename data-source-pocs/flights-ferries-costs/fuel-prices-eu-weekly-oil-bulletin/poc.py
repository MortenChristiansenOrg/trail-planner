#!/usr/bin/env python3
import json
import pathlib
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone

PAGE_URL = "https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en"
TERMS_URL = PAGE_URL
COUNTRIES = {"Denmark", "France", "Germany", "Italy", "Spain", "Sweden"}


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "trail-planner-data-source-poc/0.1"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def first_latest_prices_link(html: str) -> str:
    match = re.search(r'href="([^"]+Weekly%20Oil%20Bulletin%20Weekly%20prices%20with%20Taxes[^"]+)"', html)
    if not match:
        raise RuntimeError("Could not find latest prices-with-taxes XLSX link")
    return urllib.parse.urljoin(PAGE_URL, match.group(1).replace("&amp;", "&"))


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    strings = []
    for si in root.findall("x:si", ns):
        parts = [t.text or "" for t in si.findall(".//x:t", ns)]
        strings.append("".join(parts))
    return strings


def cell_value(cell: ET.Element, shared: list[str]) -> str:
    ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    value = cell.find("x:v", ns)
    if value is None or value.text is None:
        return ""
    if cell.attrib.get("t") == "s":
        return shared[int(value.text)]
    return value.text


def sheet_rows(xlsx_path: pathlib.Path) -> list[list[str]]:
    ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(xlsx_path) as zf:
        shared = read_shared_strings(zf)
        sheet_names = [name for name in zf.namelist() if name.startswith("xl/worksheets/sheet")]
        root = ET.fromstring(zf.read(sheet_names[0]))
        rows = []
        for row in root.findall(".//x:sheetData/x:row", ns):
            rows.append([cell_value(cell, shared) for cell in row.findall("x:c", ns)])
        return rows


def main() -> None:
    base = pathlib.Path(__file__).resolve().parent
    raw_dir = base / "raw"
    normalized_dir = base / "normalized"
    raw_dir.mkdir(parents=True, exist_ok=True)
    normalized_dir.mkdir(parents=True, exist_ok=True)

    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    html = fetch(PAGE_URL).decode("utf-8", "ignore")
    xlsx_url = first_latest_prices_link(html)
    xlsx_bytes = fetch(xlsx_url)
    raw_path = raw_dir / "sample-weekly-oil-bulletin-prices-with-taxes.xlsx"
    raw_path.write_bytes(xlsx_bytes)

    rows = sheet_rows(raw_path)
    selected = []
    products = rows[0] if rows else []
    units = rows[1] if len(rows) > 1 else []
    for row in rows:
        joined = " ".join(row)
        if any(country in joined for country in COUNTRIES):
            prices = []
            for idx, value in enumerate(row[1:], start=1):
                if value == "":
                    continue
                unit = units[idx] if idx < len(units) else None
                eur_value = float(value)
                prices.append(
                    {
                        "product": products[idx] if idx < len(products) else f"column_{idx}",
                        "unit": unit,
                        "eur_per_unit": eur_value,
                        "eur_per_liter": eur_value / 1000 if unit == "1000 l" else None,
                    }
                )
            selected.append({"country": row[0], "prices": prices})

    normalized = {
        "source": "european_commission_weekly_oil_bulletin",
        "retrieved_at": retrieved_at,
        "query": {"page_url": PAGE_URL, "xlsx_url": xlsx_url, "countries": sorted(COUNTRIES)},
        "license_or_terms_url": TERMS_URL,
        "freshness": "weekly",
        "confidence": "medium_until_column_mapping_is_hardened",
        "country_prices": selected,
        "notes": [
            "The bulletin publishes EU country-average consumer prices for petroleum products.",
            "This POC saves the official XLSX and extracts matching country rows only; production should harden sheet and column mapping.",
            "Norway, Iceland, Switzerland, and the UK are outside this EU source and need separate defaults.",
        ],
    }
    out_path = normalized_dir / "sample-eu-fuel-price-rows.json"
    out_path.write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {raw_path}")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
