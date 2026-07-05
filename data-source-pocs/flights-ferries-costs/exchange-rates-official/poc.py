#!/usr/bin/env python3
import json
import pathlib
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

NATIONALBANKEN_URL = "https://www.nationalbanken.dk/api/currencyratesxml?lang=en"
NATIONALBANKEN_TERMS_URL = "https://www.nationalbanken.dk/en/news-and-knowledge/data-and-statistics/exchange-rates"
ECB_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
ECB_TERMS_URL = "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html"
TARGETS = ["EUR", "NOK", "SEK", "GBP", "CHF", "ISK"]


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "trail-planner-data-source-poc/0.1"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def parse_nationalbanken(xml_bytes: bytes) -> tuple[str, dict[str, float]]:
    root = ET.fromstring(xml_bytes)
    daily = root.find(".//dailyrates")
    if daily is None:
        raise RuntimeError("No dailyrates element found")
    date = daily.attrib["id"]
    rates: dict[str, float] = {}
    for currency in daily.findall("currency"):
        code = currency.attrib["code"]
        if code in TARGETS:
            rates[code] = float(currency.attrib["rate"].replace(",", "."))
    return date, rates


def parse_ecb(xml_bytes: bytes) -> tuple[str, dict[str, float]]:
    root = ET.fromstring(xml_bytes)
    ns = {"gesmes": "http://www.gesmes.org/xml/2002-08-01", "e": "http://www.ecb.int/vocabulary/2002-08-01/eurofxref"}
    time_cube = root.find(".//e:Cube[@time]", ns)
    if time_cube is None:
        raise RuntimeError("No ECB time cube found")
    date = time_cube.attrib["time"]
    rates = {"EUR": 1.0}
    for cube in time_cube.findall("e:Cube", ns):
        code = cube.attrib["currency"]
        if code in TARGETS or code == "DKK":
            rates[code] = float(cube.attrib["rate"])
    return date, rates


def main() -> None:
    base = pathlib.Path(__file__).resolve().parent
    raw_dir = base / "raw"
    normalized_dir = base / "normalized"
    raw_dir.mkdir(parents=True, exist_ok=True)
    normalized_dir.mkdir(parents=True, exist_ok=True)

    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    nb_xml = fetch(NATIONALBANKEN_URL)
    ecb_xml = fetch(ECB_URL)
    (raw_dir / "sample-nationalbanken-currencyrates.xml").write_bytes(nb_xml)
    (raw_dir / "sample-ecb-eurofxref-daily.xml").write_bytes(ecb_xml)

    nb_date, nb_rates = parse_nationalbanken(nb_xml)
    ecb_date, ecb_rates = parse_ecb(ecb_xml)
    dkk_per_currency = {code: rate / 100 for code, rate in nb_rates.items()}
    ecb_cross_check = {}
    if "DKK" in ecb_rates:
        for code in TARGETS:
            if code in ecb_rates:
                ecb_cross_check[code] = ecb_rates["DKK"] / ecb_rates[code]

    normalized = {
        "source": "danmarks_nationalbank_with_ecb_cross_check",
        "retrieved_at": retrieved_at,
        "query": {
            "nationalbanken_url": NATIONALBANKEN_URL,
            "ecb_url": ECB_URL,
            "target_currencies": TARGETS,
        },
        "license_or_terms_url": NATIONALBANKEN_TERMS_URL,
        "secondary_terms_url": ECB_TERMS_URL,
        "freshness": "daily_on_business_days",
        "confidence": "high_for_reference_conversion_not_transaction_price",
        "rate_date": nb_date,
        "rates": [
            {
                "currency": code,
                "dkk_per_1_unit": dkk_per_currency.get(code),
                "nationalbanken_dkk_per_100_units": nb_rates.get(code),
                "ecb_cross_check_dkk_per_1_unit": ecb_cross_check.get(code),
            }
            for code in TARGETS
        ],
        "notes": [
            "Nationalbanken quotes Danish kroner per 100 units of foreign currency.",
            "ECB reference rates are euro-based and are included only as an official cross-check.",
            "Both providers publish indicative reference rates, not guaranteed transaction rates.",
        ],
    }

    out_path = normalized_dir / "sample-dkk-conversions.json"
    out_path.write_text(json.dumps(normalized, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
