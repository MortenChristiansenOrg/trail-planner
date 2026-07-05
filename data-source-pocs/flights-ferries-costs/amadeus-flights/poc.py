#!/usr/bin/env python3
import json
import os
import pathlib
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get("AMADEUS_BASE_URL", "https://test.api.amadeus.com")


def post_form(url: str, data: dict[str, str]) -> dict:
    body = urllib.parse.urlencode(data).encode()
    request = urllib.request.Request(url, data=body, method="POST")
    request.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode())


def get_json(url: str, token: str) -> dict:
    request = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode())


def main() -> None:
    client_id = os.environ["AMADEUS_CLIENT_ID"]
    client_secret = os.environ["AMADEUS_CLIENT_SECRET"]
    token = post_form(
        f"{BASE_URL}/v1/security/oauth2/token",
        {"grant_type": "client_credentials", "client_id": client_id, "client_secret": client_secret},
    )["access_token"]
    departure_date = (datetime.now(timezone.utc).date() + timedelta(days=60)).isoformat()
    params = urllib.parse.urlencode(
        {
            "originLocationCode": "AAL",
            "destinationLocationCode": "BGO",
            "departureDate": departure_date,
            "adults": "1",
            "currencyCode": "DKK",
            "max": "5",
        }
    )
    data = get_json(f"{BASE_URL}/v2/shopping/flight-offers?{params}", token)
    base = pathlib.Path(__file__).resolve().parent
    (base / "raw").mkdir(exist_ok=True)
    (base / "normalized").mkdir(exist_ok=True)
    raw_path = base / "raw" / "sample-aal-bgo-flight-offers.json"
    raw_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    offers = []
    for offer in data.get("data", []):
        offers.append(
            {
                "id": offer.get("id"),
                "price_total": offer.get("price", {}).get("total"),
                "currency": offer.get("price", {}).get("currency"),
                "itineraries": [
                    {
                        "duration": itinerary.get("duration"),
                        "segments": [
                            {
                                "departure_iata": segment.get("departure", {}).get("iataCode"),
                                "arrival_iata": segment.get("arrival", {}).get("iataCode"),
                                "carrier": segment.get("carrierCode"),
                                "flight_number": segment.get("number"),
                            }
                            for segment in itinerary.get("segments", [])
                        ],
                    }
                    for itinerary in offer.get("itineraries", [])
                ],
            }
        )
    normalized = {
        "source": "amadeus_flight_offers_search",
        "retrieved_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "query": {"origin": "AAL", "destination": "BGO", "departure_date": departure_date, "adults": 1},
        "license_or_terms_url": "https://developers.amadeus.com/pricing",
        "freshness": "live_offer_sample",
        "confidence": "sample_price_only",
        "offers": offers,
    }
    out_path = base / "normalized" / "sample-aal-bgo-flight-offers.json"
    out_path.write_text(json.dumps(normalized, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {raw_path}")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
