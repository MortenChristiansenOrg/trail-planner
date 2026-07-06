# Trail Planner Market Analysis

Research date: 2026-07-06

## Summary

Trail Planner's clearest product wedge is not trail navigation itself. The stronger opportunity is helping a user answer:

> Which mountain hikes are actually worth doing, easy to reach, and cheap enough from my origin?

The market is mature for trail discovery, offline maps, route planning, navigation, and activity tracking. It is much weaker at end-to-end access planning: comparing hikes by travel time, transfers, public transport availability, flights, ferries, rental cars, shuttles, parking, lodging, fees, and total estimated trip cost.

I did not find a direct competitor that globally ranks mountain hikes by total access friction and cost from a user's origin. The closest overlaps are Komoot, SwitzerlandMobility, Mapy.com, Outdooractive, and Rome2Rio, but each covers only part of the job.

## Competitive Positioning

Most hiking apps start with one of these questions:

- "What trails are near me?"
- "How do I navigate this route?"
- "What does the terrain look like?"
- "What have other hikers reviewed?"

Trail Planner can instead start with constraints:

- Origin city or airport.
- Travel dates and trip length.
- Budget.
- Car-free, rental car, own car, or any mode.
- Difficulty, elevation gain, exposure, and seasonality.
- Lodging and transfer tolerance.
- "Cheap and simple" versus "best possible hike."

That makes the app closer to a hiking-specific blend of Rome2Rio, Skyscanner, Komoot, and AllTrails than a direct replacement for any one of them.

## App Analysis

### AllTrails

Sources: [AllTrails](https://www.alltrails.com/), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=com.alltrails.alltrails), [App Store listing](https://apps.apple.com/us/app/alltrails-hike-bike-run/id405075943), [AllTrails Navigate help](https://support.alltrails.com/hc/en-us/articles/360059000272-Navigate-feature-overview)

Good at:

- Large global trail database.
- User reviews, photos, recent condition comments, and social proof.
- Trail filters for difficulty, distance, activity, dog/kid/stroller/wheelchair friendliness, and similar attributes.
- GPS navigation, route recording, downloadable maps, saved lists, and route creation.
- Helping casual hikers quickly choose a known trail.

Less good at:

- Determining whether a hike is cheap or easy to reach from a specific origin.
- Public transport, flights, ferries, shuttles, parking cost, and lodging logistics are not first-class decision criteria.
- Popularity can overweight heavily reviewed trails and underrepresent quieter but logistically excellent options.
- Trail quality and current condition data depend heavily on community input.

Implications for Trail Planner:

- AllTrails is a discovery and validation competitor, not a logistics competitor.
- Trail Planner should not try to out-AllTrails AllTrails at community reviews early.
- Better wedge: "Here are the hikes that fit your budget and travel constraints; open AllTrails for trail photos/reviews."

Integration opportunities:

- Deep link to AllTrails trail pages when a matched hike has a known AllTrails URL.
- Let users import or paste AllTrails links as seed hikes to analyze travel feasibility.
- Use user-provided AllTrails exports or GPX files, where allowed by AllTrails terms, as route geometry inputs.
- Provide browser-level "open details in AllTrails" rather than scraping protected content.
- Affiliate or partnership opportunity is likely difficult but valuable if Trail Planner can drive qualified outbound traffic.

### Komoot

Sources: [Komoot](https://www.komoot.com/), [Komoot route planner help](https://www.komoot.com/help/routeplanner), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=de.komoot.android), [App Store listing](https://apps.apple.com/us/app/komoot-hike-bike-run/id447374873)

Good at:

- Route planning for hiking, biking, running, and other outdoor activities.
- Surface, difficulty, distance, elevation profile, and sport-specific routing.
- Community highlights and inspiration.
- Turn-by-turn navigation and offline maps.
- Public-transport-aware discovery appears increasingly important; Komoot's own site describes filtering by public transport links.
- Strong European mindshare and useful outdoor routing UX.

Less good at:

- Does not appear to rank destinations by total travel cost from an arbitrary origin.
- Public transport is a useful filter, but not a full travel-planning engine covering flights, ferries, hotels, transfers, and trip budget.
- Multi-day travel logistics are secondary to route planning and navigation.
- OSM-dependent routing can be limited where trail data is incomplete or incorrectly tagged.

Implications for Trail Planner:

- Komoot is the closest global competitor in "reachable outdoor inspiration."
- Trail Planner should differentiate on cost, travel feasibility, and cross-region comparison rather than on-device navigation.
- Komoot sets a strong benchmark for route cards: distance, elevation, surface, difficulty, estimated duration, and route preview.

Integration opportunities:

- Deep link to Komoot routes, collections, or region guides for richer route details and navigation.
- Allow users to export planned hikes as GPX for Komoot import.
- Accept Komoot shared route URLs as inputs for feasibility/cost analysis.
- Use Komoot as a navigation handoff: Trail Planner chooses the destination; Komoot guides the user on trail.
- Potential partnership angle: Trail Planner can send users with a high intent to navigate a selected route.

### Outdooractive

Sources: [Outdooractive route planner](https://www.outdooractive.com/en/routeplanner/), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=com.outdooractive.Outdooractive), [App Store listing](https://apps.apple.com/us/app/outdooractive/id1364846172)

Good at:

- Officially approved and professionally curated routes in many areas.
- Broad activity support: hiking, trekking, mountaineering, via ferrata, cycling, ski touring, and more.
- Route planning with distance, duration, elevation profile, terrain, and GPS sync.
- POIs, weather, accommodation, cable cars, and local context in some regions.
- More authority-oriented than purely community-driven apps.

Less good at:

- Product can feel broad and dense compared with simpler consumer hiking apps.
- Travel logistics are map context more than a ranked decision model.
- Does not appear focused on total trip cost or cheapest access.
- Strongest where official partners and regional data are good.

Implications for Trail Planner:

- Good inspiration for combining official routes, region information, weather, and POIs.
- Trail Planner can use official-route trust as a quality signal, while still owning the access/cost ranking layer.

Integration opportunities:

- Deep link to Outdooractive route pages for official descriptions and navigation.
- Export GPX routes for use in Outdooractive.
- Use Outdooractive URLs as user-submitted route seeds.
- Explore partner/content embeds where official tourism boards already publish via Outdooractive.
- Treat Outdooractive presence as one route-quality/provenance signal if user-provided or available through permitted APIs/partnerships.

### HiiKER

Sources: [HiiKER](https://hiiker.app/), [App Store listing](https://apps.apple.com/us/app/hiiker-the-hiking-maps-app/id1470810597), [HiiKER purchases page](https://hiiker.app/purchases)

Good at:

- Hiking-only positioning, which is valuable for mountain users who do not want a bike/run-first product.
- Verified trails, topo maps, offline maps, 3D flyovers, GPX/KML/GeoJSON export, and multi-day trek planning.
- Premium cartography sources such as Ordnance Survey, Harvey Maps, IGN France, USGS Topo, Kompass, and others.
- Strong promise around offline maps and serious hiking use.

Less good at:

- Less focused on access logistics, transportation, and cost.
- Trail discovery and route planning are stronger than trip feasibility planning.
- Premium map coverage and value vary by country.

Implications for Trail Planner:

- Good model for hiking-specific language and trust.
- Trail Planner can position as the pre-hike trip-selection layer that hands off to HiiKER for serious map use.

Integration opportunities:

- Deep link to HiiKER trail pages where available.
- Export selected routes as GPX/KML/GeoJSON for HiiKER import.
- Let users paste HiiKER links or upload exports for travel-cost analysis.
- Potential co-marketing angle for users planning multi-day hikes who need both logistics and serious navigation.

### Gaia GPS

Sources: [Gaia GPS](https://www.gaiagps.com/), [Gaia GPS help](https://help.gaiagps.com/hc/en-us/articles/9067661557399-How-to-Use-Gaia-GPS), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=com.trailbehind.android.gaiagps.pro), [App Store listing](https://apps.apple.com/us/app/gaia-gps-mobile-trail-maps/id1201979492)

Good at:

- Backcountry-grade map layers and offline GPS navigation.
- Topographic maps, weather, steepness layers, campsites, water sources, waypoints, and trail access information.
- Strong for serious hikers, backpackers, off-road users, and winter users.
- Web planning plus mobile execution.

Less good at:

- More expert-oriented and less accessible for casual trip discovery.
- Logistics to the trailhead are not the main user journey.
- Offline and premium layers usually sit behind subscription tiers.
- Does not appear to compare destination options by end-to-end travel cost.

Implications for Trail Planner:

- Gaia is not a destination-cost competitor, but it is a strong navigation and terrain-planning handoff.
- Trail Planner should avoid competing on advanced map-layer depth early.

Integration opportunities:

- Export GPX routes and waypoints for Gaia import.
- Let users upload Gaia-exported GPX/KML files to evaluate access logistics.
- Deep link to Gaia web maps with coordinates where possible.
- Recommend Gaia as a navigation option for remote hikes where offline map reliability matters.

### CalTopo

Sources: [CalTopo](https://caltopo.com/), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=com.caltopo.android)

Good at:

- Advanced backcountry planning.
- Slope angle, snow depth, satellite, water gauge, wind, weather, sun exposure, avalanche-related planning, and stackable map layers.
- Collaborative map building and real-time updates.
- Strong desktop planning workflow.

Less good at:

- Too technical for many casual hikers.
- Weak as a broad hike-discovery product.
- Does not solve travel cost, flight/train/ferry access, or lodging comparison.
- Requires users to know where they want to go and what they are planning.

Implications for Trail Planner:

- CalTopo is a useful safety/planning reference, not a direct competitor.
- Trail Planner can include "open in CalTopo" for advanced users rather than replicating its deep terrain tools.

Integration opportunities:

- Export GPX/KML route files for CalTopo.
- Deep link to CalTopo maps centered on a route or trailhead where URL parameters support it.
- Allow advanced users to import CalTopo exports for travel feasibility analysis.
- Use CalTopo-style derived concepts, such as slope and weather risk, as future quality/risk signals using independent data sources.

### Wikiloc

Sources: [Wikiloc](https://www.wikiloc.com/), [Wikiloc outdoor navigation app](https://www.wikiloc.com/outdoor-navigation-app), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=com.wikiloc.wikilocandroid)

Good at:

- Very large global library of community-created GPS tracks.
- Broad activity coverage and strong international presence.
- Offline maps, trail recording, live tracking, GPS transfer, and route search.
- Useful in countries where Wikiloc has strong community adoption.

Less good at:

- Community trail quality varies.
- Access logistics and total trip cost are not central.
- Route metadata may be inconsistent across regions and users.
- Less authoritative than official route networks.

Implications for Trail Planner:

- Wikiloc can be a useful long-tail route source, especially outside highly commercialized hiking regions.
- Trail Planner should treat community tracks as candidates needing validation, not as final trusted recommendations.

Integration opportunities:

- Deep link to Wikiloc trail pages for GPS track details and community context.
- Let users paste Wikiloc trail links or upload GPX files for access analysis.
- Export Trail Planner-selected hikes to GPX for use in Wikiloc or GPS devices.
- Use Wikiloc presence/counts as an indirect popularity signal only where terms and access permit.

### Trailforks

Sources: [Trailforks mobile app](https://www.trailforks.com/apps/map/), [Trailforks hiking page](https://www.trailforks.com/about/activity/hiking/), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=com.pinkbike.trailforks)

Good at:

- Large trail database, especially strong from mountain biking roots.
- Trail status, conditions, POIs, heat maps, offline maps, and route builder.
- Expanding multi-activity support including hiking, trail running, skiing, and snowboarding.
- Local trail-association curation in some areas.

Less good at:

- Brand and data model are still heavily associated with biking.
- Hiking experience may be uneven by region.
- Does not solve trip cost or multi-modal travel to mountain hikes.

Implications for Trail Planner:

- Relevant in trail networks where current trail status matters.
- Less useful as a primary hiking discovery source unless local hiking coverage is strong.

Integration opportunities:

- Deep link to Trailforks trails/regions for status and condition details.
- Export/import GPX where supported.
- Use Trailforks trail-status pages as a user-facing handoff for regions where closures or trail conditions are important.
- Potential partnership with local trail associations using Trailforks data, subject to licensing.

### Mapy.com

Sources: [Mapy.com](https://mapy.com/en/), [Mapy.com route planning help](https://help.mapy.com/route-planning/), [Mapy.com route planning tools](https://help.mapy.com/route-planning/tools/), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=cz.seznam.mapy)

Good at:

- Outdoor maps, hiking route planning, A-to-B and round routes, elevation, estimated time, weather along route, and itinerary.
- Offline maps and outdoor navigation.
- Public transport planning, car planning, walking, cycling, skiing, and other modes.
- Accommodation-at-destination tooling and POIs.
- Strong Central/Eastern European heritage but global outdoor map coverage.

Less good at:

- More of a comprehensive map/planner than a hike-selection and travel-cost ranking engine.
- Public transport and accommodation exist, but the app does not appear to compare hikes by total trip cost from a user's home.
- Destination discovery is less trail-community-driven than AllTrails/Komoot.

Implications for Trail Planner:

- One of the strongest references for combining outdoor routing with normal transport planning.
- Trail Planner needs to go beyond "plan a route" into "compare many hikes by access friction and cost."

Integration opportunities:

- Deep link to Mapy.com centered on trailheads or routes.
- Export GPX routes to Mapy.com.
- Use Mapy.com as a fallback navigation option where its outdoor map coverage is strong.
- Let users paste Mapy.com route links as candidate hikes.
- Study its UX for showing route weather, elevation, itinerary, public transport, and accommodation in one planning surface.

### Organic Maps

Sources: [Organic Maps](https://organicmaps.app/), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=app.organicmaps), [GitHub repo](https://github.com/organicmaps/organicmaps)

Good at:

- Free, privacy-focused, OSM-based offline maps.
- Hiking, trekking, cycling, driving, route import, route recording, and offline navigation.
- No ads, no tracking, low-friction worldwide map downloads.
- Good utility app for travel and field use.

Less good at:

- Not a curated hike-discovery product.
- No meaningful trip-cost or travel-logistics layer.
- Quality depends on OSM data completeness.
- Less suited to ranking hikes by attractiveness and practicality.

Implications for Trail Planner:

- Useful as an open, privacy-friendly navigation handoff.
- Trail Planner could recommend Organic Maps for budget users who need offline maps.

Integration opportunities:

- Export GPX/KML files users can open in Organic Maps.
- Deep link via geo coordinates or map links where supported by mobile platforms.
- Use OSM-compatible data structures to make handoff simple.
- Consider Organic Maps as a field-navigation recommendation for users avoiding paid subscriptions.

### PeakVisor

Sources: [PeakVisor](https://peakvisor.com/), [PeakVisor app manual](https://peakvisor.com/tutorial_en.html), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=tips.routes.peakvisor), [App Store listing](https://apps.apple.com/us/app/hiking-and-skiing-peakvisor/id1187259191)

Good at:

- Mountain identity and mountain-specific exploration.
- 3D maps, peak identification, augmented reality, trails, ski resort context, and flyover-style route previews.
- Helps users understand terrain visually before and during a mountain trip.

Less good at:

- Not centered on travel logistics or budget planning.
- More useful once a user is already interested in a mountain area.
- Does not appear to compare reachable hikes from an origin.

Implications for Trail Planner:

- Useful inspiration for mountain preview and "why this hike is worth it."
- Trail Planner can combine pragmatic access scoring with emotional/visual mountain appeal.

Integration opportunities:

- Deep link to mountain/peak pages for visual mountain context.
- Add "open peak in PeakVisor" from hike detail pages.
- Use PeakVisor-like concepts, independently sourced, such as peak prominence, 3D preview, and visible-summit context.
- Potential partnership for embedding mountain identity/visualization where licensing allows.

### SwitzerlandMobility

Sources: [SwitzerlandMobility App Store listing](https://apps.apple.com/fr/app/switzerlandmobility/id527194959?l=en-GB), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=ch.schweizmobil), [Switzerland Tourism](https://www.myswitzerland.com/en-us/planning/transport-accommodation/slow-up-switzerlandmobility/), [SwitzerlandMobility FAQ](https://schweizmobil.ch/en/switzerlandmobility-plus-faq)

Good at:

- Excellent official Swiss route network.
- Strong public transport integration, including stops and next departure times.
- Accommodation, local area information, attractions, closures, detours, and high-quality swisstopo maps.
- Routes are coordinated with public transport and Swiss tourism infrastructure.

Less good at:

- Switzerland and Liechtenstein only.
- Does not generalize across countries.
- Not focused on comparing full trip cost from arbitrary international origins.
- Mobile UX has historically received mixed user feedback, though official data quality is strong.

Implications for Trail Planner:

- This is probably the best proof that transport-aware hiking planning is valuable.
- Trail Planner can generalize the concept across countries and add cost comparison.
- SwitzerlandMobility is a strong regional data/source model, not a global replacement.

Integration opportunities:

- Deep link to official SwitzerlandMobility route pages for Swiss hikes.
- Use SwitzerlandMobility route numbers/names as canonical identifiers where allowed.
- Hand off users to SwitzerlandMobility for official maps, closures, public transport stops, and route details.
- Compare Trail Planner's computed access score against SwitzerlandMobility's public-transport-friendly route network.
- Explore official data/licensing or tourism-board partnership paths for Switzerland.

### UT.no

Sources: [DNT UT.no guide](https://www.dnt.no/en/Trips/Tips-and-tricks/articles/Find-your-next-trip-to-Ut/), [App Store listing](https://apps.apple.com/lu/app/ut-no/id510575024), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=no.bouvet.nrkut)

Good at:

- Norway's major trip-planning platform.
- Thousands of route suggestions, cabins, destinations, marked trails, ski tracks, and useful map layers.
- DNT cabins, Statskog rentals/open cabins, private lodging, trip descriptions, offline maps, lists, tracking, and GPX download.
- Strong regional authority and mountain-hiking relevance.

Less good at:

- Norway-specific and Norwegian-context heavy.
- Does not appear to compare trips by total cost from an international origin.
- Access logistics are not the same as full trip planning with flights, trains, ferries, transfers, and lodging budgets.

Implications for Trail Planner:

- Very relevant for Norwegian hiking, especially cabin-based trips.
- Trail Planner can add value by turning UT.no's strong local trail/cabin data into international access recommendations.

Integration opportunities:

- Deep link to UT.no trip and cabin pages.
- Use UT.no as the official-detail handoff for Norway hikes.
- Allow users to paste UT.no links for travel feasibility and budget analysis.
- Export planned route/cabin itinerary summaries for use alongside UT.no.
- Investigate DNT/UT data-sharing or partnership options if Norway becomes a priority region.

### OS Maps

Sources: [OS Maps](https://osmaps.com/), [OS Maps route guide](https://osmaps.com/guide/2/create-route), [App Store listing](https://apps.apple.com/us/app/os-maps-walk-hike-run-bike/id978307846), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=uk.co.ordnancesurvey.osmaps)

Good at:

- Highly trusted UK mapping.
- OS Explorer 1:25,000 and Landranger 1:50,000 mapping via subscription.
- Desktop route planning, mobile following/recording, snap-to-path, printing, offline access, and Apple Watch support.
- Strong for UK hikers who care about map authority.

Less good at:

- Best value is UK-centric.
- More map/navigation product than travel-logistics engine.
- Does not appear to rank hikes by total travel cost or car-free feasibility from arbitrary origins.

Implications for Trail Planner:

- OS Maps is an authority benchmark for UK route confidence.
- Trail Planner can complement it by selecting feasible UK hikes, then handing off to OS Maps for detailed map use.

Integration opportunities:

- Deep link to OS Maps routes or map locations where possible.
- Export GPX for OS Maps import.
- Use OS route/map references as trusted external detail links for UK hikes.
- Explore Ordnance Survey licensing/API options if UK becomes a target region.

### FarOut

Sources: [FarOut features](https://faroutguides.com/features/), [FarOut custom routes](https://faroutguides.com/how-i-use-custom-routes-to-make-thru-hiking-easier/), [FarOut resupply guide](https://faroutguides.com/navigating-resupply-and-zero-days-with-farout/)

Good at:

- Long-distance trail guides.
- Waypoints, side trails, alternates, town guides, resupply, water, campsites, lodging, alerts, comments, and offline maps.
- Strong for thru-hikers and backpackers who already know the trail corridor.
- User comments provide valuable operational details.

Less good at:

- Less useful for broad destination discovery.
- Usually assumes the user has chosen a long trail.
- Does not compare mountain hikes by cost/ease of getting there.
- Coverage depends on available guide products.

Implications for Trail Planner:

- FarOut is excellent inspiration for logistics once the user is on or near the trail.
- Trail Planner's opportunity is before FarOut: "Which trail should I choose, and how do I get there cheaply?"

Integration opportunities:

- Deep link to FarOut trail guides where available.
- Recommend FarOut as a companion for supported long-distance trails.
- Export candidate itineraries and access notes that users can pair with FarOut guide purchases.
- Potential affiliate/partner opportunity for guide sales if Trail Planner recommends specific long trails.

### Rome2Rio

Sources: [Rome2Rio](https://www.rome2rio.com/), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=com.rome2rio.www.rome2rio), [App Store listing](https://apps.apple.com/us/app/rome2rio-trip-planner/id569793256)

Good at:

- Global multimodal transport search.
- Trains, ferries, buses, planes, and cars across many countries and operators.
- Quick comparison of time, mode, and likely route options.
- Useful for rough travel feasibility and origin-to-destination research.

Less good at:

- Not hiking-aware.
- Trailheads, route difficulty, mountain weather, seasonality, closures, and scenic quality are outside scope.
- Landmark/address routing may not understand remote trailhead realities well enough.
- Cost estimates can be rough or incomplete.

Implications for Trail Planner:

- Rome2Rio is the most important adjacent logistics competitor.
- Trail Planner should feel like "Rome2Rio, but the destination candidates are high-quality hikes and the scoring understands hiking."

Integration opportunities:

- Deep link to Rome2Rio searches from origin to trailhead/town.
- Use Rome2Rio as a manual validation path for users who want to inspect transport alternatives.
- Potential affiliate relationships may exist through transport booking flows, but should be validated.
- Avoid depending on Rome2Rio as a primary data source unless API/commercial terms are clear.

### Wanderlog

Sources: [Wanderlog](https://wanderlog.com/), [App Store listing](https://apps.apple.com/us/app/wanderlog-travel-planner/id1476732439), [Google Play listing](https://play.google.com/store/apps/details?hl=en_US&id=com.wanderlog.android)

Good at:

- General itinerary planning, reservations, lodging, flights, route optimization, collaboration, budgeting, maps, and offline trip access.
- Strong for road trips and group travel.
- Helps organize multiple stops and reservations in one place.

Less good at:

- Not hiking-specific.
- Does not understand trail difficulty, elevation, seasonality, route condition, or mountain safety.
- Trip cost and itinerary planning are broad, not optimized around trailhead access.

Implications for Trail Planner:

- Wanderlog is a good UX reference for itinerary, collaboration, reservations, and budgeting.
- Trail Planner can own hike selection and then optionally export/share the broader trip plan.

Integration opportunities:

- Export selected hike trips as calendar files, CSV, or shareable itinerary text that can be pasted into Wanderlog.
- Deep link to Wanderlog trip planning as a downstream organizer.
- Let users copy a Trail Planner itinerary with transport, lodging, trailhead, and hike details.
- Potential future integration through reservation import/export if Wanderlog exposes suitable APIs or partner options.

## Strategic Opportunities

### 1. Own the access score

Create a normalized "Access Score" per hike:

- Total travel time from origin.
- Number of transfers.
- Earliest feasible arrival and latest safe return.
- Car-free viability.
- Rental car need.
- Shuttle/taxi/last-mile uncertainty.
- Parking availability and expected cost.
- Flight/train/ferry/bus availability.
- Lodging availability and approximate cost.
- Total estimated trip cost.
- Risk flags such as seasonal closures or poor public transport frequency.

This is the clearest differentiator versus trail-first apps.

### 2. Treat other apps as detail/navigation handoffs

Trail Planner does not need to replace AllTrails, Komoot, HiiKER, Gaia, CalTopo, Outdooractive, or regional official apps. A strong workflow is:

1. Trail Planner finds and ranks feasible hikes.
2. User inspects cost, access, schedule, and trip constraints.
3. User opens the chosen route in their preferred map/navigation app.

This avoids competing directly with entrenched navigation products.

### 3. Build region-by-region source confidence

The best sources vary by country:

- Switzerland: SwitzerlandMobility, swisstopo, SBB/public transport.
- Norway: UT.no/DNT, Entur, MET Norway, ferries.
- UK: OS Maps, National Rail/bus sources, official park data.
- Alps broadly: Komoot, Outdooractive, official tourism pages, lift/cable-car operators.
- North America: AllTrails, Gaia, CalTopo, official park/forest service data, shuttle operators.

The app should expose provenance and confidence rather than pretending all regions are equally covered.

### 4. Use deep links and exports early

Near-term integrations can avoid formal partnerships:

- Open trail in AllTrails/Komoot/Outdooractive/HiiKER/Wikiloc.
- Open map/route in Gaia/CalTopo/Mapy.com/Organic Maps/OS Maps.
- Open transport search in Rome2Rio or local transit apps.
- Export GPX/KML/GeoJSON.
- Copy itinerary text.
- Export calendar entries.

Formal data/API partnerships can come later for high-priority regions.

## Differentiation Checklist

Trail Planner should be able to answer questions current apps generally do not answer well:

- "What are the best mountain hikes I can reach from Copenhagen for under EUR 350 next weekend?"
- "Which hikes in Norway are possible without renting a car?"
- "Which Alpine hikes have cheap public transport access and lodging nearby?"
- "Is this famous hike actually feasible as a 3-day trip?"
- "Which hikes are cheaper if I fly into a different airport?"
- "What is the total cost difference between train, car, rental car, ferry, and flight options?"
- "Which trailheads are easy to reach, but still feel remote once hiking?"

## Conclusion

The direct market gap still appears valid. Existing apps are strong at finding and navigating trails, and some are excellent in specific regions or planning modes. The under-served job is comparing mountain hikes as travel products: reachable, affordable, seasonally practical, and worth the effort.

Trail Planner should position itself as the decision layer before the map app:

> Find the best mountain hikes you can actually get to, for the time and money you have.

