# TollGuru POC

Credentialed script only. Copy `.env.example`, set `TOLLGURU_API_KEY`, then run:

```bash
set -a; source data-source-pocs/flights-ferries-costs/tollguru/.env; set +a
python3 data-source-pocs/flights-ferries-costs/tollguru/poc.py
```

Docs:

- https://tollguru.com/toll-api-docs
- https://tollguru.com/toll-api-pricing-plans
