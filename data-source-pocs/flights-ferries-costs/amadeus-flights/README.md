# Amadeus Flight Offers POC

Credentialed script only. Copy `.env.example`, set credentials, then run:

```bash
set -a; source data-source-pocs/flights-ferries-costs/amadeus-flights/.env; set +a
python3 data-source-pocs/flights-ferries-costs/amadeus-flights/poc.py
```

The script samples `AAL` to `BGO` about 60 days out and writes raw and normalized offers if credentials are present.

Docs:

- https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search
- https://developers.amadeus.com/pricing
