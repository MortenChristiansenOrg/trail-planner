# Routing And Transit POCs

Scope: road routing, public transport, and local shuttle/boat sources from `DATA_SOURCE_RESEARCH.md`.

Evaluated on 2026-07-05. These folders are intentionally small POCs, not production integrations.

## Verdict Summary

| Source | Verdict | POC status | Notes |
| --- | --- | --- | --- |
| Entur Journey Planner | viable_with_limits | Live samples saved | Strong Norway public transport API. Last-mile tourist shuttles/boats are incomplete or absent in tested cases. |
| OSRM | viable_with_limits | Public demo samples saved | Good self-host candidate for cheap road routing/matrices. Public demo is not production infrastructure. |
| openrouteservice | blocked | Script/env example only | API key required. Good hosted candidate for car routing, matrices, isochrones. |
| GraphHopper | blocked | Script/env example only | API key required. Free package is non-commercial per current terms. |
| Valhalla | viable_with_limits | Self-host plan only | Good engine candidate, but requires local OSM/transit build. |
| Rejseplanen Labs | blocked | Access notes only | Registration/API access needed for Danish journey planning. |
| Transitland | blocked | Access notes only | API key needed; useful feed discovery rather than journey planning. |
| Navitia | blocked | Access notes only | API key needed; coverage must be verified by region. |
| OpenTripPlanner | viable_with_limits | Self-host plan only | Strong future control path, but needs graph build and feed maintenance. |
| Local shuttles/boats | manual_only | Manual samples saved | Official pages are required for Besseggen boat, Trolltunga shuttle, and Romsdalseggen bus. |

## Reproduction

Run public samples:

```bash
python3 data-source-pocs/routing-transit/entur-journey-planner/poc.py
python3 data-source-pocs/routing-transit/osrm/poc.py
```

Run key-gated samples after setting environment variables:

```bash
ORS_API_KEY=... python3 data-source-pocs/routing-transit/openrouteservice/poc.py
GRAPHHOPPER_API_KEY=... python3 data-source-pocs/routing-transit/graphhopper/poc.py
```
