# Trail Planner Data Source Research

See [CATALOG_INGESTION_CHECKLIST.md](CATALOG_INGESTION_CHECKLIST.md) for the publication gate covering provenance, route geometry, lodging, and licensed media.

This document lists the external information Trail Planner needs in order to prove the product vision in `VISION.md`. It is written as an experiment reference: for each data type, we should test whether candidate sources provide enough coverage, accuracy, cost visibility, legal clarity, and operational reliability before relying on them in the product.

## Evaluation Criteria

- Coverage: Does the source cover Aalborg-origin trips into Norway, Sweden, Scotland, the Alps, Dolomites, Pyrenees, and Iceland?
- Access model: Is there a public API, bulk data, hosted SaaS API, partner program, or only manual/user-supplied import?
- Legal fit: Can we store, transform, cache, and show derived results with attribution?
- Freshness: Is the source live, scheduled, historical, or static?
- Confidence: Can we expose enough metadata to say whether a plan is based on live data, cached data, estimates, or manual assumptions?
- Experiment shape: Can we quickly test the source against Besseggen, Trolltunga, Romsdalseggen, Laugavegur, Ben Nevis CMD, and one Alps/Dolomites route?

## 1. Route Geometry And Trail Inventory

Needed for: candidate hikes, route maps, distance, route type, route completeness, surface/terrain hints, named trails, trailhead coordinates, links back to evidence.

### OpenStreetMap via Overpass API

- Source: <https://wiki.openstreetmap.org/wiki/Overpass_API>
- Useful data: `route=hiking` relations, `highway=path/footway/track`, `sac_scale`, `trail_visibility`, `surface`, `incline`, bridges, shelters, toilets, parking, ferry piers, bus stops, huts, campsites.
- Technical details: Query with Overpass QL around a bounding box or named area. Good for targeted prototype lookups, not as an unlimited production backend. Cache responses and store OSM object IDs, timestamps, and attribution.
- Risks: Route relations can be incomplete or absent. OSM tells us where paths are, but not whether a route is a great hike. Public Overpass instances have operational limits and social expectations even where strict rate limits are not advertised.
- Experiment: Query all hiking relations and path segments around Besseggen, Trolltunga, Romsdalseggen, and Ben Nevis. Verify whether we can reconstruct complete route geometry and identify route type.

### OSM Extracts From Geofabrik / Planet-Derived Data

- Source: <https://download.geofabrik.de/>
- Useful data: Same as OSM, but from regional extracts suitable for batch indexing.
- Technical details: Download PBF extracts for Denmark, Norway, Sweden, Great Britain, Alps countries, Iceland, and relevant regions. Process with `osmium`, `osm2pgsql`, `pyosmium`, or a custom import pipeline. Enables repeatable candidate generation and local scoring.
- Risks: More infrastructure work. Need an update process and ODbL attribution/compliance.
- Experiment: Build a local trail index for Norway from extract data and compare results to Overpass queries.

### Waymarked Trails

- Source: <https://hiking.waymarkedtrails.org/>
- Useful data: OSM-derived visualization of signed hiking routes.
- Technical details: Good as a reference to validate that our OSM route extraction matches an established hiking-route renderer. The public site is not primarily a bulk API for our backend.
- Risks: Should not depend on scraping. Use as validation or investigate whether data/products can be consumed under acceptable terms.
- Experiment: Compare Waymarked Trails' visible hiking-route coverage against our OSM extraction for early test destinations.

### User GPX Uploads

- Source: User-owned GPX files from AllTrails, Komoot, national park sites, blogs, route planners, GPS devices, or manual drawing.
- Useful data: Exact route geometry, route distance, elevation profile after DEM sampling, user-provided source URL.
- Technical details: Parse GPX locally, normalize tracks/routes, simplify geometry for display, preserve original file metadata and source link. This is likely the cleanest MVP route-import path.
- Risks: Uploaded GPX may include detours, recording noise, private tracks, or missing route semantics.
- Experiment: Import GPX files for Besseggen, Laugavegur, Trolltunga, and Ben Nevis CMD. Compare computed distance/elevation against public route descriptions.

### AllTrails Export / Link As User-Supplied Evidence

- Source: <https://support.alltrails.com/hc/en-us/articles/37230403315476-Downloading-files-from-AllTrails>
- Useful data: GPX/KML/FIT/TCX exports, verified route names, difficulty, ratings, photos, reviews if viewed by the user.
- Technical details: Treat as manual import or user-provided link. Do not build on unofficial scraping or hidden API access unless terms are explicitly confirmed.
- Risks: Direct automated extraction is legally and operationally risky. Ratings/reviews/photos are not cleanly reusable.
- Experiment: Confirm what a normal AllTrails account can export for target routes and whether imported GPX contains enough geometry for our dossier.

### Official Park, Tourism, And Mountain Club Route Pages

- Sources: DNT, Visit Norway, national park websites, Mountaineering Scotland, Alpenverein/SAC/CAI/FFCAM, regional tourism boards.
- Useful data: route descriptions, season advice, warnings, hut/camp links, parking, shuttle information, recommended stages.
- Technical details: Likely manual curation or per-source permission/API checks. Best used for seed lists and source links rather than broad automation at MVP stage.
- Risks: Inconsistent formats, localized languages, copyright restrictions, and frequent seasonal updates.
- Experiment: Create a manually curated seed list of 25 candidate routes with source URLs, routehead coordinates, and route quality notes.

## 2. Elevation And Terrain

Needed for: elevation gain/loss, highest/lowest point, slope, ruggedness, route difficulty, profile charts, mountain-quality scoring.

### OpenTopography API

- Source: <https://portal.opentopography.org/apidocs/>
- Useful data: SRTM 30m/90m, NASADEM, Copernicus DEM 30m/90m, ALOS World 3D, and other global DEMs.
- Technical details: REST API for clipping DEM rasters by bounding box. Some datasets require an API key. Good for backend precomputation of elevation profiles.
- Risks: Quotas and dataset-specific restrictions. Need caching because route profiles repeatedly sample the same areas.
- Experiment: Fetch DEM data for each test route and compute ascent/descent. Compare with route-source stated values.

### Copernicus DEM

- Source: <https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM>
- Useful data: GLO-30 and GLO-90 elevation surfaces.
- Technical details: Global DSM, not bare-earth DTM. Available through Copernicus services, AWS Open Data, Google Earth Engine, and OpenTopography.
- Risks: DSM includes buildings/vegetation, which can slightly distort trail profiles; usually acceptable for planning but not navigation-grade.
- Experiment: Compare Copernicus GLO-30 against OpenTopography/SRTM for high-relief routes.

### AWS Terrain Tiles / Mapzen Terrarium

- Source: <https://registry.opendata.aws/terrain-tiles/>
- Useful data: Tiled elevation for fast sampling and browser/backend profile generation.
- Technical details: Terrarium PNG tiles encode elevation as RGB. Can be cached and sampled along polylines.
- Risks: Mixed underlying datasets and attribution requirements. Need careful decoding and tile-edge handling.
- Experiment: Build a small sampler for GPX profiles and compare against OpenTopography output.

### MapTiler Elevation / Terrain Services

- Source: <https://docs.maptiler.com/cloud/api/>
- Useful data: Hosted terrain/elevation tied to map rendering.
- Technical details: Practical if we already use MapTiler for maps. API key and plan limits apply.
- Risks: Vendor dependency and usage costs as route-profile calculations scale.
- Experiment: Test whether MapTiler elevation is accurate enough for trail dossiers and cheaper than maintaining our own DEM cache.

## 3. Base Maps, Vector Tiles, And Geocoding

Needed for: route maps, reachable-region maps, trailhead search, source links, place lookup, static/shareable maps.

### MapLibre GL JS

- Source: <https://maplibre.org/>
- Useful data: Rendering engine rather than data source.
- Technical details: Open-source web map renderer compatible with vector tiles and custom overlays. Use for route, travel, and candidate-region map display.
- Risks: Requires tile provider or self-hosted tiles.
- Experiment: Render OSM-derived route geometry, travel legs, trailhead markers, and confidence overlays.

### MapTiler Cloud

- Source: <https://docs.maptiler.com/cloud/api/>
- Useful data: Hosted vector tiles, outdoor/topographic styles, geocoding, static maps, weather/elevation APIs.
- Technical details: API-key SaaS with MapLibre-compatible styles. Strong early candidate because it reduces infrastructure and has outdoor maps.
- Risks: Plan limits and vendor pricing. Need attribution and key restrictions.
- Experiment: Prototype dossier map and share-page static map for Besseggen using MapTiler Outdoor.

### OpenMapTiles

- Source: <https://openmaptiles.org/>
- Useful data: Self-hostable vector tiles generated from OSM.
- Technical details: Docker-based generation and schema. Good fallback if hosted tile costs or privacy constraints matter.
- Risks: Operationally heavier, especially for broad Europe coverage and updates.
- Experiment: Generate tiles for Norway or Denmark+Norway and test MapLibre rendering performance.

### Nominatim

- Source: <https://operations.osmfoundation.org/policies/nominatim/>
- Useful data: Place search and reverse geocoding from OSM.
- Technical details: Public `nominatim.openstreetmap.org` is for light usage under strict usage policy. For production, use a hosted provider or self-host.
- Risks: Public endpoint is not suitable for autocomplete-heavy app behavior.
- Experiment: Use only for low-volume backend enrichment, or compare hosted Nominatim providers.

### Photon

- Source: <https://github.com/komoot/photon>
- Useful data: Search-as-you-type geocoding from OSM data.
- Technical details: Open-source geocoder built on OpenSearch. Public demo exists, but production should self-host or use a provider.
- Risks: Requires infrastructure and OSM import pipeline if self-hosted.
- Experiment: Self-host a European Photon extract and test trailhead/place search quality.

## 4. Road Routing, Driving Time, Walking Approaches, Matrices, Isochrones

Needed for: door-to-door driving, trailhead access, reachable-region discovery, route alternatives, time estimates, fuel distance, toll/ferry handoff.

### openrouteservice

- Source: <https://openrouteservice.org/> and <https://openrouteservice.org/restrictions/>
- Useful data: driving, walking, cycling directions, distance/time matrices, isochrones, geocoding, elevation endpoints.
- Technical details: REST API from HeiGIT, OSM-based. Published restrictions include matrix and isochrone limits. Supports avoid options and multiple profiles.
- Risks: Free tier limits may be enough for experiments but not broad candidate discovery. Long-distance car routes may need chunking or paid/self-hosted options.
- Experiment: Compare Aalborg-to-Hirtshals-to-Gjendesheim and Aalborg-to-Odda driving times against Google/Apple manual checks.

### GraphHopper Directions API

- Source: <https://docs.graphhopper.com/> and <https://www.graphhopper.com/pricing/>
- Useful data: routing, matrix, isochrone, map matching, route optimization.
- Technical details: Hosted API with credit/rate limits by plan; open-source engine can also be self-hosted.
- Risks: Free plan has no production guarantees. More advanced profiles may require tuning/self-hosting.
- Experiment: Run identical test routes through GraphHopper and openrouteservice and compare duration, distance, ferry handling, and route geometry.

### Valhalla

- Source: <https://valhalla.github.io/valhalla/>
- Useful data: multimodal routing engine, driving/walking/biking/transit support if data is loaded.
- Technical details: Open-source and self-hostable on OSM plus elevation/transit datasets. Can support custom costing.
- Risks: More setup work than hosted APIs. Transit support depends on GTFS ingestion.
- Experiment: Evaluate whether Valhalla gives better custom hiking/trailhead routing once we have OSM extracts.

### OSRM

- Source: <https://project-osrm.org/>
- Useful data: fast OSM-based driving routing and matrices.
- Technical details: Open-source and self-hostable. Strong for road routing; weaker for nuanced walking/hiking unless profiles are customized.
- Risks: Less suitable for multimodal or trail-specific planning out of the box.
- Experiment: Use OSRM as a cheap high-volume road-matrix engine for candidate screening.

## 5. Public Transport And Last-Mile Transit

Needed for: Danish origin access, Norway/Sweden/Scotland/Alps last mile, train/bus/ferry chains, point-to-point returns, seasonal service confidence.

### Rejseplanen Labs

- Source: <https://help.rejseplanen.dk/hc/da/articles/115001346669-Rejseplanen-Labs-API-GTFS-mm>
- Useful data: Danish public transport journey planning, GTFS, stops, schedules.
- Technical details: Labs access requires registration. Useful for Aalborg to Danish airports, ferry terminals, and rail/bus stations.
- Risks: Coverage and terms must be confirmed. Danish-only data does not solve international last mile.
- Experiment: Query Aalborg home-area to AAL, BLL, AAR, CPH, Hirtshals ferry terminal, and Hamburg Hbf/airport.

### Entur Journey Planner

- Source: <https://developer.entur.org/pages-journeyplanner-journeyplanner/>
- Useful data: Norway national public transport journey planning, including point-to-point trips and real-time information across modes/operators.
- Technical details: GraphQL endpoint at `https://api.entur.io/journey-planner/v3/graphql`. Built on OpenTripPlanner and national NeTEx/SIRI data.
- Risks: Need rate-limit policy review and a proper user-agent/contact. Some tourist shuttles may be private and absent.
- Experiment: Query Bergen to Odda, Odda to Skjeggedal, Gjendesheim/Gjendesheim area, Andalsnes to Romsdalseggen logistics, and return legs.

### Transitland

- Source: <https://www.transit.land/documentation/rest-api/>
- Useful data: Feed registry, GTFS/GTFS-RT feeds, operators, routes, stops, schedules, downloadable feed versions.
- Technical details: REST API with API key. Good for discovering available feeds and building our own OpenTripPlanner/Valhalla/R5 graphs.
- Risks: Feed coverage varies by country and operator; not always a full journey planner.
- Experiment: Search feeds covering Scotland, Alps regions, Denmark, Norway, Sweden, Iceland, and compare to direct national APIs.

### Navitia

- Source: <https://doc.navitia.io/>
- Useful data: Public transport journey planning, stops, schedules, coverage regions.
- Technical details: HATEOAS JSON API, API key required. Can act as broader coverage fallback where regional data is included.
- Risks: Coverage must be verified per region. Commercial/production terms need review.
- Experiment: Test Scottish Highlands and alpine valley access where Entur/Rejseplanen do not apply.

### OpenTripPlanner With GTFS/NeTEx Feeds

- Source: <https://docs.opentripplanner.org/>
- Useful data: Self-hosted multimodal trip planning from OSM plus GTFS/NeTEx.
- Technical details: Build graphs per region from OSM extracts and transit feeds. Enables repeatable search, confidence labels, and caching.
- Risks: Significant setup and feed-maintenance work. Real-time disruptions require GTFS-RT/SIRI feeds.
- Experiment: Build a Norway graph using Entur data and compare OTP results to Entur Journey Planner for target routes.

### National / Regional APIs

- Sources to investigate: Trafiklab for Sweden, TransportAPI or Traveline/National Rail for UK, DB/HAFAS-derived providers for Germany, SNCF/Swiss/Italian regional data for Alps.
- Useful data: Local schedules, disruption notices, fares where available.
- Technical details: Country-specific APIs and licenses.
- Risks: Fragmentation. Fare data is often harder than schedule data.
- Experiment: For each early destination region, identify whether a direct national API is better than Transitland/Navitia.

### Local Trail Shuttles, Tourist Buses, And Mountain Boats

- Candidate sources: official route operators and destination pages, e.g. Gjende boat for Besseggen, Trolltunga shuttle/parking operators, Romsdalseggen bus, Iceland highland bus operators, Dolomites valley buses.
- Useful data: first/last departure, seasonal service dates, prices, booking requirements, cancellation/weather constraints.
- Technical details: Often not represented in national transit APIs or GTFS feeds. Treat as per-route adapters or curated source links until API access is proven.
- Risks: This is one of the biggest feasibility risks for point-to-point and seasonal hikes. Automated scraping is likely fragile and may violate terms.
- Experiment: For each early test hike, record whether the local shuttle/boat appears in Entur/Navitia/Transitland; if not, determine the minimum manual fields needed to model it.

## 6. Flights And Airports

Needed for: live flight options, flight duration, layovers, flight price samples, relevant origin airports, fast fly-in trip discovery.

### Amadeus Self-Service Flight Offers Search

- Source: <https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search>
- Useful data: live flight offers and availability across many airlines, prices, routes, carriers, cabin, fare details.
- Technical details: REST API with OAuth token. Search by origin/destination IATA codes and dates. Good prototype source for AAL, BLL, AAR, CPH, HAM to OSL/BGO/TRD/EDI/GLA/INN/VCE/MXP/KEF.
- Risks: Self-service quota/pricing and production approval must be confirmed. Flight prices are volatile and should be stored as sampled evidence, not guarantees.
- Experiment: Price AAL/BLL/CPH/HAM to Bergen, Oslo, Edinburgh/Glasgow, Venice, Milan, Innsbruck, Keflavik for 3-5 day windows.

### Duffel

- Source: <https://duffel.com/docs/api/v2/offers>
- Useful data: purchasable flight offers, segments, prices, baggage/ancillaries, booking flow if ever needed.
- Technical details: Modern JSON API with offer requests and offers. More commerce-oriented than a pure search API.
- Risks: May be overkill for a planning app without booking. Pricing model includes order/search considerations.
- Experiment: Compare route coverage and price realism against Amadeus for the same origin/destination/date pairs.

### Kiwi / Tequila Via Affiliate Or Partner Access

- Source: <https://kiwicom.github.io/margarita/docs/tequila-api> and partner docs
- Useful data: flexible flight search, locations, multi-city/virtual interlining ideas.
- Technical details: API-key access through Kiwi/partner channels. Historically useful for flexible search, but current access terms should be verified directly.
- Risks: Documentation and access model appear less straightforward; permissions can change.
- Experiment: Attempt partner signup and test whether search endpoints are available for non-booking planning use.

### OpenSky Network

- Source: <https://openskynetwork.github.io/opensky-api/>
- Useful data: live/historical aircraft movement data.
- Technical details: Research/non-commercial API; explicitly not a commercial flight schedule/price source.
- Risks: Not suitable for itinerary planning or pricing. Only useful for ancillary research, not MVP.
- Experiment: Do not use for planning unless we later need aviation analytics unrelated to offer search.

### Airport Metadata

- Candidate sources: OurAirports (<https://ourairports.com/data/>), OpenFlights data, Wikidata, Amadeus airport search.
- Useful data: airport coordinates, IATA codes, nearby city/region, country, viable origin/destination set.
- Technical details: Mostly static CSV/open data. Can seed route searches and airport-transfer calculations.
- Risks: Some datasets have stale or community-maintained fields.
- Experiment: Build a fixed candidate-airport table around Aalborg and target regions.

## 7. Ferries, Tolls, Fuel, Parking, And Driving Costs

Needed for: realistic drive/ferry comparisons, Norway routes from Denmark, car-based cost model, route cost confidence.

### Direct Ferries Connect API

- Source: <https://www.directferriesconnect.com/connect>
- Useful data: ferry routes, operators, schedules, live/competitive rates, booking-path inventory.
- Technical details: REST API through a commercial/partner program; claims broad route/operator coverage.
- Risks: Partner approval and commercial terms required. Might be booking-oriented rather than planning-only.
- Experiment: Contact/sign up and test Hirtshals-Larvik, Hirtshals-Kristiansand, Hirtshals-Bergen/Stavanger where relevant.

### Ferry Operator Websites

- Sources: Fjord Line (<https://fjordline.com/en>), Color Line, DFDS, Stena Line, Smyril Line, CalMac, country-specific operators.
- Useful data: schedules, seasonal routes, prices, vehicle/passenger options.
- Technical details: Usually no public planning API. Manual checks or affiliate/partner APIs may be required. Link out as source evidence.
- Risks: Scraping/automation risk. Prices are dynamic and vehicle/passenger dependent.
- Experiment: Manually sample Norway ferry costs and schedules for representative trip windows, then decide whether partner API integration is necessary.

### TollGuru

- Source: <https://tollguru.com/toll-api-docs>
- Useful data: route tolls, fuel expenses, vehicle-class-specific costs, Europe toll calculator.
- Technical details: API can accept route/polyline and return toll/fuel costs. Paid SaaS.
- Risks: Cost and coverage details need confirmation for Denmark/Norway/Sweden/Europe trips. May duplicate some routing-provider distance data.
- Experiment: Compare TollGuru cost output against manual toll/ferry/bridge calculations for Aalborg-Norway and Aalborg-Alps routes.

### Fuel Price Sources

- Candidate sources: European Commission Weekly Oil Bulletin, national fuel-price APIs where available, manual default fuel price per country, user profile override.
- Useful data: petrol/diesel price assumptions by country.
- Technical details: For MVP, a manually maintained country fuel-price table may be enough. Store timestamp and source.
- Risks: Live station-level fuel prices are fragmented and not necessary for ballpark estimates.
- Experiment: Compare simple country-average model against TollGuru and actual trip receipts where available.

### Parking And Trailhead Fees

- Candidate sources: OSM tags (`amenity=parking`, `fee=yes`, `capacity`, `parking=*`), official trail/municipality pages, operator pages.
- Useful data: parking availability, paid parking, trailhead shuttle constraints.
- Technical details: OSM can locate parking but often lacks current prices. Official pages are needed for high-impact destinations like Trolltunga.
- Risks: Prices and rules change seasonally.
- Experiment: For Trolltunga, Besseggen, Romsdalseggen, and Ben Nevis, determine whether parking/shuttle cost is reliably available without manual curation.

### Car Rental And Airport Transfers

- Candidate sources: Amadeus car rental APIs, Rentalcars/Booking partner APIs, airport transfer operators, public transport APIs, manual fare bands.
- Useful data: whether a fly-in route needs a rental car, rental daily cost, one-way rental feasibility, airport-to-trailhead transfer time and cost.
- Technical details: For MVP, it may be enough to model rental car as a configurable assumption per airport/region and prefer public transport where data is reliable.
- Risks: Live rental pricing is commercial and partner-gated; one-way and late-return constraints can materially change feasibility.
- Experiment: Compare fly-in Ben Nevis, Dolomites, and Pyrenees trips with public transport only, rental car, and mixed transfer assumptions.

## 8. Trail Amenities, Water, Resupply, And Bailout Points

Needed for: multi-day practicality, tent routes, hut-to-hut staging, route risk notes, bailout assumptions.

### OSM POIs Around Route Buffers

- Source: <https://wiki.openstreetmap.org/wiki/Map_features>
- Useful data: drinking water, springs, rivers/streams, supermarkets, restaurants, shelters, huts, campsites, bus stops, rail stations, ferry terminals, hospitals/pharmacies, bridges.
- Technical details: Query route buffers from OSM extracts or Overpass. Store distance along route and lateral distance from route. Use tags like `amenity=drinking_water`, `natural=spring`, `shop=supermarket`, `tourism=alpine_hut`, `shelter_type=*`, and transit stop tags.
- Risks: Water and resupply tagging is incomplete and not a safety guarantee. Must display as "mapped points" rather than verified availability.
- Experiment: For Laugavegur and one hut-to-hut Alps route, generate stage-level water/resupply/hut candidates and manually verify completeness.

### Official Route And Hut Stage Descriptions

- Candidate sources: DNT, Icelandic hut operators, Alpenverein/SAC/CAI/FFCAM, national park route pages, guidebooks with permission.
- Useful data: recommended stages, water notes, resupply limitations, bailout points, river crossing warnings.
- Technical details: Likely manual curation with source links; store structured notes and confidence rather than copied text.
- Risks: Copyright and update cadence. Some critical information cannot be inferred from maps.
- Experiment: Build a stage model for Laugavegur and one DNT hut route using only legally reusable structured facts and source links.

## 9. Lodging, Huts, Campsites, And Overnight Assumptions

Needed for: pre/post-hike nights, hut-to-hut stages, campsite/tent assumptions, cost estimates, availability risk.

### Booking.com Demand API

- Source: <https://developers.booking.com/demand>
- Useful data: accommodation inventory, availability, prices, property details.
- Technical details: Requires Managed Affiliate Partner access and authentication. Suitable for live hotel/hostel estimates if accepted.
- Risks: Partner gating. May be booking-oriented and commercially constrained.
- Experiment: Apply for access or verify eligibility; test Odda, Gjendesheim, Andalsnes, Fort William, Cortina, Reykjavik.

### Amadeus Hotel APIs

- Source: <https://developers.amadeus.com/self-service/category/hotels>
- Useful data: hotel list, hotel search, offers, availability/prices from hotel chains.
- Technical details: REST API with OAuth similar to flights. Good if we already use Amadeus.
- Risks: Coverage may skew toward chain hotels and cities, not mountain huts or small lodges.
- Experiment: Compare lodging coverage near trailheads against Booking.com manual searches.

### OSM Accommodation Tags

- Source: <https://wiki.openstreetmap.org/wiki/Tag:tourism%3Dalpine_hut> and <https://wiki.openstreetmap.org/wiki/Tag%3Atourism%3Dcamp_site>
- Useful data: alpine huts, wilderness huts, campsites, hostels, hotels, cabins, contact info, websites, reservation tags where mapped.
- Technical details: Query via Overpass or OSM extracts. Good for locating options and source links, not reliable for current availability or prices.
- Risks: Incomplete metadata and no live availability.
- Experiment: Extract huts/campsites within 5 km of target routes and compare to official lists.

### DNT Cabins

- Source: <https://www.dnt.no/om-dnt/english/about-the-dnt-cabins/>
- Useful data: Norwegian staffed lodges, self-service cabins, no-service cabins, membership assumptions, cabin type, official booking/payment pages.
- Technical details: Public web pages and booking/payment systems. Need to investigate whether DNT has a usable public API or permission for structured use.
- Risks: Availability and pricing may require manual checks or authenticated booking flow. Do not scrape without permission.
- Experiment: For Besseggen/Jotunheimen and Romsdalseggen areas, determine whether cabin location, price, and availability can be extracted or must be linked/manual.

### Hut Association And Regional Systems

- Candidate sources: Alpenverein hut systems, SAC huts, CAI/refugio sites, FFCAM, Scottish hostels/bunkhouses, Icelandic hut operators.
- Useful data: hut location, opening periods, prices, reservations, stage planning.
- Technical details: Highly country/association-specific. Best handled as curated adapters by region.
- Risks: Fragmented access and terms. Availability often not API-friendly.
- Experiment: Pick one Dolomites hut route and one Swiss/Austrian hut route and assess structured availability access.

### Campsites And Wild-Camping Legality

- Candidate sources: OSM campsites, official park pages, national regulations, regional tourism pages.
- Useful data: designated campsites, wild camping constraints, seasonal closures, cost assumptions.
- Technical details: Likely curated legal/rule snippets by country/region plus OSM campsite POIs.
- Risks: Legal nuance and local restrictions; must expose assumptions.
- Experiment: Create a legal-assumption table for Norway, Sweden, Scotland, Iceland, Italy, Austria, Switzerland, France, and Spain.

## 10. Weather, Climate, Seasonality, Snow, And Daylight

Needed for: forecast risk, historical weather windows, likely snow windows, daylight constraints, seasonal recommendations.

### Open-Meteo

- Source: <https://open-meteo.com/en/docs> and <https://open-meteo.com/en/docs/historical-weather-api>
- Useful data: forecast, historical weather, snow depth variables where available, climate/reanalysis, elevation API, multiple weather models.
- Technical details: Free non-commercial-friendly API with no key for many endpoints. Hourly/daily time series by lat/lon. Historical API uses reanalysis datasets back to 1940 in many products.
- Risks: Mountain microclimates are hard; forecast confidence should be conservative. Snow/terrain hazards need specialized sources.
- Experiment: Fetch forecast and historical daily summaries for route high points and trailheads; derive weather-risk windows for June-September.

### MET Norway API / Frost

- Sources: <https://api.met.no/> and <https://frost.met.no/>
- Useful data: Nordic forecasts and quality-controlled historical station observations.
- Technical details: MET Weather API requires proper User-Agent. Frost requires registration/client ID. Excellent for Norway-specific verification.
- Risks: Station data may not represent ridges; API usage conditions must be followed.
- Experiment: Compare Open-Meteo and MET/Frost for Besseggen and Trolltunga historical July-September conditions.

### Varsom / NVE Regobs

- Source: <https://api.nve.no/doc/regobs/> and <https://www.varsom.no/en/about/regobs/>
- Useful data: Norway avalanche, landslide, flood, lake ice warnings, field observations, relevant hazard maps.
- Technical details: API access to Regobs observations and Varsom-platform hazard data. Strong Norway-specific source for risk/confidence panels.
- Risks: Not a substitute for professional safety advice; many warnings are seasonal and regional.
- Experiment: Query warnings/observations around Jotunheimen, Hardanger/Trolltunga, and Romsdalen for sample dates.

### Sunrise-Sunset / Astronomical Calculations

- Source: <https://sunrise-sunset.org/api>
- Useful data: sunrise, sunset, twilight for hike dates and coordinates.
- Technical details: Simple lat/lon/date JSON API with attribution. Could also compute locally with a library to avoid a dependency.
- Risks: Terrain shadows are not fully represented unless using more advanced elevation-aware data.
- Experiment: Calculate usable daylight for long routes like Trolltunga and Ben Nevis CMD in May, June, September, and October.

### Official Seasonal Route Pages

- Candidate sources: official park/route pages, ferry/shuttle schedules, hut opening pages, mountain association warnings.
- Useful data: normal season windows, snow closure advice, shuttle operating periods, boat/ferry route season, hut opening dates.
- Technical details: Manual curation and per-destination evidence links.
- Risks: No uniform API; high value but low automation.
- Experiment: For each seed route, store `normal_season_start`, `normal_season_end`, source URL, and confidence.

## 11. Subjective Hiking Quality Signals

Needed for: ranking "great hikes" rather than merely reachable hikes; scenery, reputation, ruggedness, remoteness, user preference fit.

### Derived Geospatial Scoring

- Sources: OSM paths/routes, DEM/ruggedness, protected-area boundaries, landcover, distance from roads/settlements, viewpoints/peaks/water bodies.
- Useful data: objective proxies for mountain quality, elevation, rough terrain, remoteness, road-walk percentage, views.
- Technical details: Compute from local OSM/DEM/geospatial layers. This avoids dependence on proprietary ratings.
- Risks: Objective proxies miss reputation and subjective beauty.
- Experiment: Score known high-quality and lowland control hikes and see if the ranking matches intuition.

### OSM Tags And POIs

- Source: OSM `sac_scale`, `trail_visibility`, `natural=peak`, `tourism=viewpoint`, `route=hiking`, `network=*`, protected areas.
- Useful data: technical difficulty hints, views, peaks, named routes.
- Technical details: Query from extracts and route buffers.
- Risks: Sparse tagging in many regions.
- Experiment: Measure tag completeness for Norway, Scotland, Alps, and Iceland test routes.

### User-Owned / Manual Ratings

- Sources: AllTrails links, guidebooks, national park lists, tourism pages, blogs, personal notes.
- Useful data: reputation and subjective appeal.
- Technical details: Store as curated evidence links and manual score components, not scraped review text.
- Risks: Manual work and copyright limitations.
- Experiment: Curate initial route list with manual quality labels, then see how much automated scoring can reproduce it.

### Photos And Visual Evidence

- Candidate sources: Wikimedia Commons, Mapillary/KartaView street-level imagery, official tourism pages with permission, user-provided links.
- Useful data: share-page visual context and quality confidence.
- Technical details: Wikimedia has API and open licenses with attribution; Mapillary has API/platform terms. Official tourism photos require license checks.
- Risks: Licensing and relevance. Avoid scraping copyrighted gallery images.
- Experiment: For 10 seed routes, determine whether a legally reusable representative photo exists.

## 12. Shareable Evidence, Attribution, And Source Metadata

Needed for: source links, last-updated timestamps, confidence display, legal attribution, reproducible dossiers.

### Source Provenance Store

- Source: internal data model populated by every integration.
- Useful data: source URL, provider name, license/terms pointer, retrieval timestamp, query parameters, cached response ID, manual-vs-live flag, confidence, expiry policy.
- Technical details: Every computed plan metric should be traceable to one or more source records. This is not optional because the app explicitly promises confidence and assumptions.
- Risks: Retrofitting provenance later will be expensive and unreliable.
- Experiment: For one Besseggen dossier, trace each displayed number to route, DEM, routing, ferry, lodging, weather, and manual assumption sources.

### License And Attribution Registry

- Candidate sources: OSM/ODbL, provider terms pages, Wikimedia license metadata, MapTiler attribution, API agreements.
- Useful data: attribution text, storage/cache permissions, display requirements, commercial restrictions.
- Technical details: Keep provider metadata in code/config so UI and exports can render correct source credits.
- Risks: Mixing data without tracking license obligations can block sharing or commercial use.
- Experiment: Produce an attribution footer for a sample share page using real source combinations.

## 13. Closures, Disruptions, Safety Warnings, And Practical Unknowns

Needed for: "main risks and unknowns", do-not-finalize gates, trip confidence.

### Public Transport Disruptions

- Sources: Entur real-time/SIRI, Rejseplanen Labs, GTFS-RT feeds via Transitland, national/regional APIs.
- Useful data: delays, cancellations, service alerts.
- Technical details: Often separate from static schedules. Store last-updated time and degrade gracefully to schedule-only confidence.
- Risks: Coverage varies and may not include tourist shuttles.
- Experiment: For each transit adapter, verify whether service alerts are available.

### Road And Ferry Disruptions

- Candidate sources: Trafikverket Open API for Sweden, Norwegian Public Roads Administration data, ferry operator pages, national traffic APIs.
- Useful data: road closures, mountain pass closures, road ferry status, incidents.
- Technical details: Country-specific. May need adapters for Norway/Sweden/Denmark first.
- Risks: Fragmented and high operational complexity.
- Experiment: Identify official road status APIs for Norway, Sweden, Denmark, Scotland, Iceland, and Alps countries.

### Trail Closures And Park Alerts

- Candidate sources: national park alert pages, municipality pages, mountain association sites, official route pages.
- Useful data: trail closures, bridge removals, landslides, seasonal restrictions, wildlife/fire restrictions.
- Technical details: Often web pages/RSS/email, not APIs. MVP may use source links and manual warnings.
- Risks: Hard to automate globally.
- Experiment: For Besseggen, Trolltunga, Laugavegur, Ben Nevis CMD, and Dolomites sample route, list official alert source and machine-readability.

## 14. Candidate Discovery Seed Data

Needed for: explore mode before we have a complete route database.

### Curated Seed List

- Source: Manual internal dataset assembled from official sources, OSM, GPX uploads, and route pages.
- Useful data: route name, country, region, route type, trailhead/end coordinates, normal season, GPX/source link, rough difficulty, quality label, likely travel mode.
- Technical details: Store as structured JSON/YAML or database rows with source URLs and confidence fields. This is the most pragmatic MVP discovery base.
- Risks: Manual maintenance and limited coverage.
- Experiment: Build 50-route seed list across Norway, Sweden, Scotland, Iceland, Alps/Dolomites/Pyrenees plus Danish controls.

### OSM-Derived Candidate Mining

- Source: OSM extracts and Overpass.
- Useful data: named hiking route relations and high-elevation path networks.
- Technical details: Filter by mountainous DEM, route length, elevation gain, named relations, trail density, road-walk ratio, proximity to transit/parking.
- Risks: Finds many routes but not necessarily "great" hikes.
- Experiment: Generate top 200 OSM-derived route candidates in Norway and manually label precision.

### Official "Best Hike" Lists As Manual Inputs

- Sources: national park sites, tourism boards, mountain clubs, guidebooks, user-curated notes.
- Useful data: reputation and route names.
- Technical details: Use for inspiration/source links and manual curation, not copied text.
- Risks: Copyright and inconsistent details.
- Experiment: Compare manually curated reputation list against OSM availability.

## 15. Cost And Currency Data

Needed for: ballpark DKK estimates, confidence labels, currency conversion.

### Exchange Rates

- Candidate sources: European Central Bank reference rates, Danmarks Nationalbank, exchangerate.host/commercial APIs.
- Useful data: EUR/NOK/SEK/GBP/CHF/ISK to DKK conversion.
- Technical details: Daily rates are enough; cache by date.
- Risks: Some free exchange APIs have changed terms historically. Prefer central-bank/open official sources where possible.
- Experiment: Build a currency conversion helper from ECB/Nationalbank and compare to paid/free APIs.

### Default Cost Assumptions

- Sources: user profile, national average fuel prices, manual lodging bands, hut/campsite published prices, flight/ferry samples.
- Useful data: assumptions table for fuel consumption, per-km car operating cost, budget lodging bands, camping/hut default costs.
- Technical details: Store every assumption with source, timestamp, and confidence. Let user override car fuel economy and lodging style.
- Risks: Ballpark estimates can look too precise. UI must expose assumptions clearly.
- Experiment: Generate full trip estimates for five known trips and compare against manually planned budgets.

## Recommended MVP Data Strategy

1. Use user GPX uploads plus a curated seed list for hike routes.
2. Use OSM extracts/Overpass for trail context, POIs, trailheads, parking, huts/campsites, and road-walk analysis.
3. Use OpenTopography or Terrain Tiles for elevation profiles and derived hiking metrics.
4. Use openrouteservice and GraphHopper side by side for road/trailhead routing experiments, then pick one primary.
5. Use Rejseplanen Labs for Danish origin logistics and Entur for Norway.
6. Use Amadeus first for flight price sampling; compare Duffel if Amadeus coverage or terms are insufficient.
7. Treat ferries, lodging, huts, and shuttles as the main uncertainty: test Direct Ferries/Booking/Amadeus APIs, but expect manual fallbacks and source links.
8. Use Open-Meteo globally and MET/Frost/Varsom for Norway-specific weather and hazard confidence.
9. Build confidence/provenance into the data model from the start: every number should carry `source`, `retrieved_at`, `freshness`, `method`, and `confidence`.

## Highest-Risk Data Experiments

- Ferry live prices and schedules for Denmark-Norway car trips.
- Hut and mountain lodging availability, especially DNT, Icelandic huts, and Alps/Dolomites refuges.
- Last-mile public transport and private tourist shuttles near trailheads.
- Complete and legally reusable trail geometry for famous routes where OSM is incomplete.
- Flight search access/pricing terms for repeated route sampling.
- Trail closures and seasonal warnings outside Norway.
- Quality ranking: proving that objective geospatial scoring plus curated seed data produces useful recommendations.
