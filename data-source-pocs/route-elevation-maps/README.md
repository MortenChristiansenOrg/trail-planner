# Route, Elevation, Maps Data Source POCs

Evaluation date: 2026-07-05.

This folder covers the route geometry, elevation/terrain, base map, and geocoding sources from `DATA_SOURCE_RESEARCH.md` and `DATA_SOURCE_EVALUATION_PLAN.md`. It does not update the global tracker.

## Verdict Summary

| Source | Verdict | POC status | MVP role |
| --- | --- | --- | --- |
| OpenStreetMap Overpass | viable_with_limits | Live samples saved for Besseggen, Trolltunga, Ben Nevis CMD | Primary open route/trail inventory POC |
| Geofabrik extracts | viable_with_limits | Access check only | Batch OSM import path after Overpass |
| Waymarked Trails | manual_only | Access check only | Visual validation/reference, not backend dependency |
| User GPX uploads | viable | Analysis only | Cleanest MVP route geometry import path |
| AllTrails export/link | manual_only | Access check only | User-supplied evidence only |
| Official route pages | manual_only | Analysis only | Curated seed/evidence links |
| Open-Meteo Elevation | viable_with_limits | Live point-elevation sample saved | Fast point elevation sanity checks |
| AWS Terrain Tiles | viable_with_limits | Live Terrarium tiles saved and decoded | Public tiled DEM sampling candidate |
| OpenTopography | viable_with_limits | Access check only | Raster DEM clipping, often key-gated |
| Copernicus DEM | viable_with_limits | Access check only | Source DEM for production terrain cache |
| MapTiler Elevation | blocked | Access check only | Hosted elevation if MapTiler account is chosen |
| MapLibre GL JS | viable | Analysis only | Renderer, not data source |
| MapTiler Cloud | blocked | Access check only | Hosted vector tiles/geocoding/static maps with key |
| OpenMapTiles | viable_with_limits | Access check only | Self-hosted vector tile fallback |
| Nominatim | viable_with_limits | Live place-search samples saved | Low-volume enrichment only |
| Photon | viable_with_limits | Live place-search samples saved | Self-hostable autocomplete candidate |

## Primary Findings

- Overpass returned hiking route relations and path inventory for all sampled areas. It is excellent for targeted prototypes, but production use should move to cached OSM extracts or a hosted/self-hosted OSM database.
- Open-Meteo Elevation is very easy for point elevations, but it is not enough by itself for route ascent/descent unless we densify route geometry and smooth the profile.
- AWS Terrain Tiles are publicly reachable and decodable without credentials. They are a stronger route-profile candidate than point-only elevation APIs, but require tile caching and edge/interpolation handling.
- Nominatim and Photon both work for light geocoding tests. Photon handled the Skjeggedal trailhead query better in this sample; Nominatim public policy makes it unsuitable for app autocomplete.
- MapTiler looks product-friendly for hosted maps/elevation/static maps, but a real POC needs an account key and plan review.

## Official Sources Reviewed

- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
- OSM copyright/attribution: https://www.openstreetmap.org/copyright and https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
- Open-Meteo elevation and terms: https://open-meteo.com/en/docs/elevation-api and https://open-meteo.com/en/terms
- AWS Terrain Tiles: https://registry.opendata.aws/terrain-tiles/
- MapTiler API/terms/attribution: https://docs.maptiler.com/cloud/api/, https://www.maptiler.com/terms/cloud/, https://www.maptiler.com/copyright/
- Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
- Photon: https://github.com/komoot/photon
- MapLibre GL JS: https://maplibre.org/maplibre-gl-js/docs/
- OpenMapTiles: https://openmaptiles.org/docs/
- Geofabrik downloads: https://www.geofabrik.de/data/download.html
- OpenTopography API/terms: https://portal.opentopography.org/apidocs/ and https://opentopography.org/usageterms
- Copernicus DEM: https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM
