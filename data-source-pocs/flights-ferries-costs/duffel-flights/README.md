# Duffel Flights POC

Credentialed script only. Copy `.env.example`, set `DUFFEL_ACCESS_TOKEN`, then run:

```bash
set -a; source data-source-pocs/flights-ferries-costs/duffel-flights/.env; set +a
python3 data-source-pocs/flights-ferries-costs/duffel-flights/poc.py
```

Docs:

- https://duffel.com/docs/api/v2/offers
- https://duffel.com/pricing
