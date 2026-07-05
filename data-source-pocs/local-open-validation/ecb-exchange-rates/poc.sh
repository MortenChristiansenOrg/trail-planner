#!/usr/bin/env bash
set -euo pipefail

date="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
mkdir -p raw normalized

curl -sS "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml" -o raw/eurofxref-daily.xml

python3 - <<'PY'
import json, datetime
import xml.etree.ElementTree as ET

targets = {"DKK", "NOK", "SEK", "GBP", "CHF", "ISK"}
tree = ET.parse("raw/eurofxref-daily.xml")
root = tree.getroot()
ns = {"gesmes": "http://www.gesmes.org/xml/2002-08-01", "e": "http://www.ecb.int/vocabulary/2002-08-01/eurofxref"}
rates = {}
rate_date = None
for cube in root.findall(".//e:Cube[@time]", ns):
    rate_date = cube.attrib["time"]
    for child in cube.findall("e:Cube", ns):
        if child.attrib.get("currency") in targets:
            rates[child.attrib["currency"]] = float(child.attrib["rate"])

payload = {
    "source": "ecb_eurofxref",
    "source_url": "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
    "retrieved_at": datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    "rate_date": rate_date,
    "base": "EUR",
    "rates": rates,
    "note": "ECB publishes euro reference rates. DKK conversion can be derived through EUR base.",
    "confidence": "official_daily_reference"
}

with open("normalized/euro-reference-rates.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, indent=2, ensure_ascii=False)
    f.write("\n")
PY

