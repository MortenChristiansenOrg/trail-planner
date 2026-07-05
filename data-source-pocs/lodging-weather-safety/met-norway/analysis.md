# MET Norway Analysis

## Verdict

- Verdict: viable_with_limits
- MVP role: Norway-specific forecast cross-check for Besseggen, Trolltunga, Romsdalseggen.
- Production role: authoritative Nordic forecast source if cache and User-Agent rules are implemented.
- Confidence: high for forecast API, low for historical without Frost credentials.

## Access

- Access model: public API.
- Auth required: no for Locationforecast; Frost historical observations require registration/client ID.
- Cost/pricing: open service with no SLA for public API.
- Rate limits: avoid unnecessary traffic; over 20 requests/second requires agreement.
- Terms reviewed: https://api.met.no/doc/TermsOfService
- Storage/cache permission: cache according to response headers; use `If-Modified-Since`.
- Attribution: CC BY 4.0 attribution required.

## Data We Can Get

| Field | Available? | Notes |
| --- | --- | --- |
| Norway forecast | Yes | Compact JSON returned for both Besseggen and Trolltunga. |
| Cache metadata | Yes | Response headers include cache hints. |
| Historical station observations | Blocked | Frost requires client ID. |
| Above-ground forecast | No | API docs say altitude is ground surface height, not above-ground forecast level. |

## Test Cases

| Case | Result | Raw sample | Normalized sample | Notes |
| --- | --- | --- | --- | --- |
| Besseggen | OK | `raw/sample-besseggen-high-point.json` | `normalized/sample-besseggen-high-point.json` | 16 compact forecast points saved. |
| Trolltunga | OK | `raw/sample-trolltunga-trail.json` | `normalized/sample-trolltunga-trail.json` | 16 compact forecast points saved. |

## Technical Limitations

- Requires a unique identifying User-Agent; generic clients may receive 403.
- Coordinates should be truncated to four decimals.
- Historical model data is not as simple as the forecast API; Frost is separate and key-gated.

## Opportunities

- Use MET as a Norway confidence booster next to Open-Meteo.
- Expose forecast model disagreement when Open-Meteo and MET diverge.

## Integration Notes

- Endpoint/feed: `https://api.met.no/weatherapi/locationforecast/2.0/compact`
- Query shape: `lat`, `lon`, optional `altitude`.
- Response format: JSON timeseries.
- Update cadence: live forecast; cache using headers.
- Error handling: handle 203 deprecation, 304 cache validation, 403 User-Agent errors.
- Required attribution/provenance: MET Norway / CC BY 4.0 attribution.

## Next Step

- Add a backend proxy/cache layer before any browser or mobile client integration.
