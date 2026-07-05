# Flights, Ferries, And Cost Sources

Evaluation date: 2026-07-05.

This folder evaluates the Trail Planner data sources for flights/airports, ferries/tolls/fuel/parking/car-rental, and currency. It is intentionally scoped to small POCs and access verdicts, not production integrations.

## Summary Verdicts

| Source | Verdict | MVP role |
| --- | --- | --- |
| OurAirports airport metadata | viable | Seed origin/destination airport tables for flight search and transfer planning. |
| Official exchange rates | viable | Convert sampled travel costs to DKK with daily official rates and visible caveats. |
| Amadeus Flight Offers | viable_with_limits | Best first flight-price POC once API credentials are available. |
| Duffel Flights | viable_with_limits | Strong booking-grade comparison source, but likely overkill unless booking becomes a goal. |
| Kiwi/Tequila | blocked | Access model is partner/affiliate-gated enough to avoid MVP dependency. |
| OpenSky Network | reject | Aircraft movement data, not schedule or fare planning data. |
| Direct Ferries Connect | blocked | Useful ferry inventory if accepted as partner; not publicly testable. |
| Ferry operator websites | manual_only | Use manual assumptions and links for MVP; no stable public planning API found. |
| TollGuru | viable_with_limits | Good toll/fuel-cost service after paid API access; do not block MVP. |
| EU Weekly Oil Bulletin | viable_with_limits | Good EU country-average fuel assumptions; gaps for Norway/UK/Iceland/Switzerland. |
| Parking and trailhead fees | manual_only | Official pages are available but fragmented and seasonally changing. |
| Car rental and transfers | manual_only | Live rental pricing is partner/commercial; model as assumptions initially. |

## Folders

- `airports-ourairports/`: working POC that downloads airport metadata and writes a candidate airport seed table.
- `exchange-rates-official/`: working POC that downloads official exchange rates and writes DKK conversion factors.
- `amadeus-flights/`, `duffel-flights/`, `kiwi-tequila/`, `opensky/`: flight source access analysis and request scaffolding where useful.
- `direct-ferries/`, `ferry-operators-manual/`, `tollguru/`, `fuel-prices-eu-weekly-oil-bulletin/`, `parking-trailhead-fees/`, `car-rental-transfers/`: ferry and driving-cost source analysis.

## Product Recommendation

Use public airport metadata plus official exchange rates immediately. For MVP travel estimates, combine flight offer sampling from Amadeus after credentials, manual ferry/parking assumptions with source links, EU fuel defaults for EU countries, and user-configurable rental-car assumptions. Revisit Direct Ferries, TollGuru, Duffel, and car-rental APIs when the product needs live bookable pricing rather than planning-grade estimates.
