# Booking.com Demand API Analysis

## Verdict

- Verdict: blocked
- MVP role: link-out/manual lodging evidence only.
- Production role: possible hotel availability/pricing provider if Managed Affiliate Partner access is approved.
- Confidence: high for access gating.

## Access

- Access model: partner-gated API.
- Auth required: yes.
- Cost/pricing: commercial/partner terms not evaluated.
- Rate limits: not evaluated without access.
- Terms reviewed: https://developers.booking.com/demand
- Storage/cache permission: must be reviewed after partner approval.
- Attribution: must be reviewed after partner approval.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Hotel inventory | Blocked | Demand API requires partner access. |
| Live availability/prices | Blocked | Authentication and partner terms required. |
| Mountain huts/cabins | Unclear | Booking.com may miss DNT/alpine hut systems. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Odda/Gjendesheim/Andalsnes/Fort William/Cortina/Reykjavik | Not run | `raw/access-check.md` | `normalized/manual-fallback.json` | Partner access required. |

## Technical Limitations

- Cannot legally or technically run useful live lodging availability POC without approval.
- Scraping Booking.com should be rejected unless explicit permission is obtained.

## Opportunities

- Use affiliate/deep links manually while API access is pending.
- Compare coverage against OSM lodging and official hut systems after approval.

## Integration Notes

- Endpoint/feed: Booking.com Demand API.
- Query shape: unknown until authenticated docs/testing.
- Response format: JSON per official docs.
- Update cadence: live availability if approved.
- Error handling: treat as optional enrichment.
- Required attribution/provenance: partner terms.

## Next Step

- Apply for/confirm Managed Affiliate Partner access before further technical work.
