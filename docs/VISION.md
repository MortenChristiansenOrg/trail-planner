# Trail Planner Vision

## Product Vision

Trail Planner helps plan mountain and rough-terrain hiking trips from Aalborg by answering one practical question:

> Which great hikes can I realistically reach, how long will the whole trip take, and what will it roughly cost?

The app is not a booking site, a social network, or a generic travel search engine. It is a planning workspace for turning a hiking idea into a comparable, shareable travel plan. Its main value is combining hiking quality with door-to-trailhead logistics: driving, flying, public transport, overnight stays, seasonal availability, and the full route back home.

The product should be optimized first for one primary user planning from Aalborg, Denmark, while keeping the model general enough that other hikers could later use their own home base.

## Who It Is For

The first user is an Aalborg-based hiker who prefers mountain hikes, rugged terrain, elevation, views, and remote-feeling routes over flat road walks. The user is interested in both:

- Multiple one-day hikes where the route starts and ends near the car.
- Multi-day hikes, including hut-to-hut routes and tent-based routes.

The app should assume that hiking quality matters as much as logistics. A trip that is cheap and fast but mostly flat road walking is usually not a good recommendation.

## Core Promise

For any candidate hike or destination, Trail Planner should show:

- How to get from home to the start of the hike.
- How to get back home from the hike.
- How long the full trip takes door to door.
- A realistic ballpark cost for transport and lodging.
- What the hike is like: terrain, elevation, distance, expected duration, difficulty, seasonality, weather risk, and route style.
- A complete plan that can be shared with a travel mate so both people can discuss the same facts outside the app.

## Primary User Journeys

### 1. Evaluate A Specific Hike

The user already has a hike in mind, perhaps from AllTrails, a GPX file, a national park website, a blog post, or a map pin.

The user wants to know:

- Can I get there from Aalborg without the logistics becoming unreasonable?
- Should I drive, fly, or use public transport?
- How many nights do I need?
- What is the estimated total travel time?
- What is the estimated transport and lodging cost?
- Does the difficulty and season make sense for me?
- Is this a weekend trip, a long weekend trip, or a bigger vacation?

The ideal result is a concise trip dossier:

- Hike overview.
- Route map and elevation profile.
- Recommended outbound travel plan.
- Recommended return travel plan.
- Lodging assumptions.
- Cost estimate.
- Time estimate.
- Main risks and unknowns.
- Links back to original data sources.

### 2. Discover Trips Within A Budget

The user does not have a fixed hike in mind. Instead, they have constraints:

- Maximum travel budget.
- Maximum time away from home.
- Preferred trip length.
- Preferred season or possible dates.
- Interest in mountain or rough-terrain hikes.
- Willingness to drive, fly, or use public transport.

The app should produce a ranked set of candidate trips, such as:

- "Best weekend mountain hikes reachable by car."
- "Cheapest three-day trips with real elevation."
- "Fastest fly-in hiking trips from Aalborg."
- "Good September hut-to-hut options under a given budget."

Each candidate should show enough information to compare options quickly:

- Total travel time.
- Estimated total cost.
- Hiking quality score.
- Difficulty.
- Season suitability.
- Travel complexity.
- Confidence level.

The user should be able to open any candidate and see the full plan.

## Secondary Journey: Share A Plan

Once a trip looks promising, the user can create a shareable view for a travel mate. This does not need in-app chat. The shared plan should make discussion easy by presenting the whole picture:

- Route and travel itinerary.
- Cost and time estimates.
- Lodging assumptions.
- Pros, cons, and unresolved questions.
- Source links.
- Last updated timestamp.

The shared view should be readable without requiring the recipient to understand the planning process.

## What The App Should Optimize For

The app should balance several factors rather than sorting by one number:

- Hiking quality: mountains, rough terrain, elevation, scenery, trail reputation, and route completeness.
- Door-to-door speed: time from leaving home in Aalborg to starting the hike, and time from finishing the hike to arriving home.
- Ballpark cost: transport and lodging first, with optional refinements later.
- Practicality: number of transfers, awkward departure times, long airport waits, late arrivals, and whether the trip requires fragile connections.
- Season fit: whether the route and transport options make sense for the selected dates.
- Confidence: whether the estimate is based on live data, cached data, historical data, or user assumptions.

## Full Trip Model

Every plan should model the full trip, not only travel to the trailhead.

For loop hikes:

- Aalborg home location.
- Drive, flight, public transport, or mixed travel to the trailhead.
- Hike.
- Return to the same vehicle or transport node.
- Travel back to Aalborg.

For point-to-point hikes:

- Aalborg home location.
- Travel to the hike start.
- Hike from start to end.
- Transfer from hike end to lodging, airport, train station, car, or homebound route.
- Travel back to Aalborg.

For multi-day hikes:

- Hike stages.
- Overnight stops: hut, campsite, town lodging, or wild-camping assumption where legal.
- Entry and exit logistics.
- Contingency notes for bailout points where data is available.

## Cost Model

The first version should aim for useful ballpark estimates, not accounting-grade precision.

Transport costs should include:

- Driving distance, fuel estimate, ferry or toll assumptions where available, and parking if known.
- Flights from relevant airports, especially Aalborg, Billund, Aarhus, Copenhagen, and Hamburg when useful.
- Public transport when it keeps cost low or solves last-mile access.
- Airport transfers and trailhead transfers when they materially affect cost or feasibility.

Lodging costs should include:

- Pre-hike overnight stays when arrival timing requires it.
- Post-hike overnight stays when return timing requires it.
- Huts, campsites, or simple town lodging where needed.

The app should expose assumptions rather than pretending the estimate is exact. For example:

- "Flight price sampled from current search."
- "Hotel cost estimated from typical budget lodging near trailhead."
- "Fuel cost estimated from distance and default car profile."

## Hiking Decision Data

The app should collect as much hiking context as possible, but display it in decision-focused form.

Important hike attributes:

- Distance.
- Elevation gain and loss.
- Highest and lowest point.
- Expected hiking time.
- Route type: loop, out-and-back, point-to-point, hut-to-hut, tent route.
- Terrain type.
- Technical difficulty where available.
- Exposure, scrambling, snowfield, glacier, or navigation warnings where available.
- Season and likely snow window.
- Weather forecast and historical climate.
- Water, huts, campsites, and resupply points where available.
- Reviews, photos, and subjective quality signals where legally available.

## Data Sources And Integrations

The app should prefer low-cost, reliable, legally clean sources and keep source confidence visible.

Recommended early sources:

- OpenStreetMap for base geographic data and trail/path geometry. The main OSM editing API is not intended for heavy read-only app usage, so the app should use suitable derived services, extracts, or Overpass carefully rather than treating OSM servers as an unlimited backend.
- Overpass API for targeted OSM queries during prototyping or low-volume use. Public guidance suggests conservative limits, so production use should cache aggressively or use hosted/self-hosted extracts.
- MapLibre GL JS for the browser map renderer, because it is open source and works with vector tiles.
- MapTiler, OpenMapTiles, or another vector tile provider for hosted map tiles. MapTiler is a practical early option with outdoor/topographic styles and a free starting tier.
- openrouteservice or GraphHopper for road routing, travel time, isochrones, and potentially walking approaches.
- Open-Meteo for weather forecasts and historical weather, especially because it has a free non-commercial tier and no API key requirement.
- Rejseplanen Labs for Danish public transport access around the Aalborg-origin part of trips.
- Entur for Norway, especially because Norway is a likely hiking destination and Entur provides national public transport journey planning.
- Transitland or Navitia as broader public transport data sources where direct national APIs are not practical.
- Amadeus Self-Service APIs for flight search and airport data during prototyping.
- AllTrails as an import/reference source through user-owned exports, shared links, or GPX files if available. Treat direct scraping or unofficial access as a risk unless terms and technical access are confirmed.

Potential later sources:

- GPX uploads from any source.
- National park, tourism board, hut association, and mountain club route pages.
- Hut systems such as DNT in Norway, Alpenverein-related hut data, or country-specific cabin networks where access allows it.
- Avalanche, snow, wildfire, and trail closure data for relevant regions.
- Accommodation search providers or affiliate APIs if planning accuracy requires it.

## Product Shape

The app should feel like a planning cockpit, not a marketing site.

The first screen should help the user choose one of two actions:

- Evaluate a hike.
- Explore trips within constraints.

The core interface should revolve around comparison and evidence:

- A map.
- A timeline from Aalborg to trailhead to hike to home.
- A cost/time summary.
- A ranked list of alternatives.
- A confidence and assumptions panel.
- Source links for verification.

## MVP Scope

The first useful version should support:

- Fixed home base: Aalborg, Denmark.
- Manual hike entry by map point, GPX upload, or pasted route link where possible.
- Evaluate one known hike.
- Discover candidate hikes from a curated seed list or imported route set.
- Compare driving versus flying for reachable destinations.
- Include public transport when needed for cost or last-mile logistics.
- Estimate total travel time and transport/lodging cost.
- Display complete outbound and return plans.
- Show route map, elevation profile, and basic difficulty information.
- Create a shareable read-only trip page.

The first version does not need:

- In-app booking.
- Perfect fare accuracy.
- Full global public transport coverage.
- In-app chat.
- A large social trail database.
- Mobile offline navigation.

## Candidate Destinations For Early Testing

The product should be tested against destinations that are plausible from Aalborg and vary by travel mode:

- Norway mountain hikes reachable by ferry, car, flight, or public transport.
- Swedish and Norwegian routes reachable by car.
- Scotland, Alps, Dolomites, Pyrenees, and other fly-in mountain destinations.
- Danish or nearby lowland routes only as controls, not as the main content focus.

These test cases will reveal whether the app can compare slow-cheap, fast-expensive, and awkward-but-worth-it trips.

## Ranking Philosophy

The app should avoid presenting one opaque "best" result. Instead, it should show why a trip ranks well.

Useful labels:

- Fastest.
- Cheapest.
- Best hiking value.
- Lowest logistics friction.
- Best for a long weekend.
- Best for current season.
- High reward, high complexity.

The user should be able to adjust weights, but the default should favor genuinely good mountain hiking within practical logistics.

## Trust And Safety

The app should be careful about outdoor risk. It can help with planning, but it should not imply that a route is safe simply because it found a travel plan.

Plans should highlight:

- Outdated or missing route data.
- Weather uncertainty.
- Seasonal snow or closure risk.
- Long remote sections.
- Late arrivals that could force hiking in the dark.
- Tight transport connections.
- Lodging assumptions that need confirmation.

The app should link to source material and encourage verification for serious routes.

## Long-Term Vision

Trail Planner becomes a personal travel intelligence layer for hiking. It learns the user's preferences, tracks candidate hikes, watches seasonal transport options, and can answer questions like:

- "What is the best mountain hike I can do next weekend under 3,000 DKK?"
- "When is this Norwegian hut-to-hut route easiest and cheapest to reach?"
- "Which Alpine hikes are practical from Aalborg with only four days off?"
- "Is driving to this route cheaper than flying once lodging and transfers are included?"
- "What changed since I last looked at this trip?"

Over time, it should become better at timing: not just where to go, but when a trip makes sense because flights, weather, huts, daylight, snow conditions, and personal availability line up.

## Open Questions

- What car profile should be used for fuel cost, range, ferry preferences, and tolerance for long drives?
- Which nearby airports should be considered by default besides Aalborg?
- How should the app score hiking quality when route reviews are unavailable?
- Should the first route corpus be manually curated, imported from GPX files, or generated from OSM-derived trail data?
- What level of account/login is needed for private saved trips and share links?
- How much uncertainty is acceptable before the app should mark a plan as "needs manual verification"?

## Research Notes

- AllTrails currently documents [AI-assistant integrations](https://support.alltrails.com/hc/en-us/articles/47343827423764-AllTrails-integrations-with-AI-assistants), but a general public trail API is not clearly exposed. GPX export/share-link workflows are likely safer than unofficial scraping.
- OpenStreetMap data is valuable, but public OSM infrastructure has [usage policies](https://operations.osmfoundation.org/policies/api/). Heavy read-only use should rely on appropriate extracts, caches, or third-party services.
- Overpass API is useful for targeted OSM queries, but its public guidance recommends staying within conservative request and data-volume limits: [Overpass commons](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html).
- MapLibre GL JS is an [open-source browser map renderer](https://maplibre.org/projects/gl-js/) for vector-tile maps.
- Open-Meteo advertises [free non-commercial use](https://open-meteo.com/) up to 10,000 calls per day with attribution.
- Amadeus Self-Service offers [test and production environments](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/pricing/) with a monthly free quota and paid usage beyond that.
- Rejseplanen Labs provides access to [Danish public transport data and services](https://labs.rejseplanen.dk/hc/da) after login.
- Entur provides a [national journey planner API](https://developer.entur.org/pages-journeyplanner-journeyplanner/) for Norwegian public transport.
- Transitland offers [open transit APIs and datasets](https://www.transit.land/) for bus, train, subway, and ferry feeds.
