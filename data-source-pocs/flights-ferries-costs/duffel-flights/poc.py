#!/usr/bin/env python3
import json
import os
import pathlib
import urllib.request
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get("DUFFEL_BASE_URL", "https://api.duffel.com")
VERSION = os.environ.get("DUFFEL_VERSION", "v2")


def main() -> None:
    token = os.environ["DUFFEL_ACCESS_TOKEN"]
    departure_date = (datetime.now(timezone.utc).date() + timedelta(days=60)).isoformat()
    payload = {
        "data": {
            "slices": [{"origin": "AAL", "destination": "BGO", "departure_date": departure_date}],
            "passengers": [{"type": "adult"}],
            "cabin_class": "economy",
        }
    }
    request = urllib.request.Request(
        f"{BASE_URL}/air/offer_requests?return_offers=true",
        data=json.dumps(payload).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Duffel-Version": VERSION,
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        data = json.loads(response.read().decode())

    base = pathlib.Path(__file__).resolve().parent
    (base / "raw").mkdir(exist_ok=True)
    (base / "normalized").mkdir(exist_ok=True)
    raw_path = base / "raw" / "sample-aal-bgo-offer-request.json"
    raw_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    offers = data.get("data", {}).get("offers", []) if isinstance(data.get("data"), dict) else []
    normalized = {
        "source": "duffel_offers",
        "retrieved_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "query": payload["data"],
        "license_or_terms_url": "https://duffel.com/pricing",
        "freshness": "live_offer_sample",
        "confidence": "sample_price_only",
        "offers": [
            {
                "id": offer.get("id"),
                "total_amount": offer.get("total_amount"),
                "total_currency": offer.get("total_currency"),
                "expires_at": offer.get("expires_at"),
                "owner": offer.get("owner", {}).get("name"),
            }
            for offer in offers[:5]
        ],
    }
    out_path = base / "normalized" / "sample-aal-bgo-offers.json"
    out_path.write_text(json.dumps(normalized, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {raw_path}")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
