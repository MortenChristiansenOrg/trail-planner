# Trail Planner MVP

## MVP Scope and Goals

This MVP establishes a product that is functional enough to provide meaningful help in exploring hiking options
and finding viable destinations. The focus is on providing high quality data for destinations and travel options.
Data for exploring trails should be as good as we can make it, but here we allow for manual edits to fill the gaps.

The data coverage should not feel like a sample set. You should be able to find all the well known hiking
hubs.

The MVP should look good, like a real product. User experience details are important, such as animations,
transitions, responsive layout, etc.

## Tech Choices

### Stack

- React 19
- React Compiler
- Vite
- TypeScript 7
- TanStack Router
- Tailwind 4
- Shadcn
- MapLibre GL JS
- Convex
- Clerk
- pnpm
- Vercel

### Auth

The user must log in with a Google account. Use Clerk for hosted authentication, user management, session handling,
and auth UI. Convex should validate Clerk-issued tokens with the Clerk/Convex integration and continue to own all
application authorization decisions and application data.

The first auth implementation should be intentionally narrow:

- Configure Clerk with Google sign-in as the required sign-in method.
- Add the Clerk Convex integration and `convex/auth.config.ts` so Convex can validate Clerk tokens.
- Wrap the React app with `ClerkProvider` and `ConvexProviderWithClerk`.
- Use Convex auth readiness for protected Convex-backed UI, not raw Clerk client state alone.
- In every private Convex query or mutation, derive identity server-side with Convex auth and check ownership there.
  Do not trust client-provided user IDs.
- Store only app-level user/profile fields in Convex. Clerk owns auth accounts, sessions, and provider identity data.
  Convex stores references needed to connect Clerk users to trips, uploads, share links, and user preferences.

### Deployment

The default deployment target is Vercel for the web app, Clerk for authentication, and Convex for the backend,
database, scheduled jobs, server functions, and file storage. This keeps the MVP inside the services already planned
and avoids adding another paid data store before the product needs it.

Railway is not needed for the MVP. It is a good future option if the app needs long-running services that do not
fit naturally in Convex actions, such as a self-hosted routing engine, tile server, OSM extract processor, or large
background ingestion worker.

### Package Manager

Use pnpm for the MVP. It is fast, widely supported, workspace-friendly, and less experimental than relying on Bun
as the runtime. Bun can still be revisited later, but the app should not depend on Bun-specific behavior.

Supply chain protection should be enforced by tooling, not left as agent or contributor guidance. Dependency
installs should run with post-install scripts disabled by default, and install tooling should reject package
versions published less than 24 hours ago unless there is a deliberate override for an urgent security fix or a
package we control.

### Observability

Sentry and PostHog are good fits, but they are not required at the start. The MVP should keep a clean integration
point for them so they can be added without touching feature code. The first version can rely on Vercel logs,
Convex logs, and explicit user-facing error states.

### Agent Skills

Agent skills should be treated as part of the repository supply chain. Prefer skills published by the relevant
vendor and available through `skills.sh` so they are easy to inspect and update. Review the installed `SKILL.md`
files before committing them, especially skills that contain shell command directives.

Recommended initial skills:

| Skill | Source | Official status | Popularity signal | MVP role |
| --- | --- | --- | --- | --- |
| `convex`, `convex-quickstart`, `convex-setup-auth`, `convex-create-component`, `convex-migration-helper`, `convex-performance-audit` | `get-convex/agent-skills` | Official Convex | About 332k total installs reported for the Convex skills repo; individual core skills are roughly 58k installs in third-party mirrors, with `convex-migration-helper` showing 78k on `skills.sh` | Core backend, Clerk auth integration, future schema changes, components, and performance work |
| `clerk`, `clerk-setup`, `clerk-react-patterns`, `clerk-testing`, `clerk-webhooks` | `clerk/skills` | Official Clerk | `skills.sh` reports about 20k installs for `clerk-setup`, 18k for `clerk-webhooks`, 17k for `clerk-testing`, and 8k for `clerk-react-patterns` | Clerk auth setup, React/Vite auth patterns, E2E auth testing, and optional user/profile sync via webhooks |
| `shadcn` | `shadcn/ui` | Official shadcn/ui | About 219k installs and 118k GitHub stars | Component installation, registry usage, and consistent shadcn patterns |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` | Official Vercel, not Meta/React | About 525k installs and 29k repository stars | React 19 performance and frontend implementation guidance |
| `vercel-composition-patterns` | `vercel-labs/agent-skills` | Official Vercel | About 236k installs | Component architecture as the Explore and Trip pages grow |
| `deploy-to-vercel` | `vercel-labs/agent-skills` | Official Vercel | About 85k installs | Preview deployment and Vercel project setup |
| `webapp-testing` | `anthropics/skills` | Official Anthropic, not Playwright vendor | About 109k installs and 158k repository stars | Local web-app testing workflow and Playwright-style verification |

Optional later skills:

| Skill | Source | Official status | Popularity signal | Notes |
| --- | --- | --- | --- | --- |
| `web-design-guidelines` | `vercel-labs/agent-skills` | Official Vercel | About 437k installs | Useful for UI review; inspect first because the `skills.sh` security result includes a warning |
| `frontend-design` | `anthropics/skills` | Official Anthropic | About 624k installs | Useful for product polish, but broader than the chosen stack |
| `playwright-cli` | `microsoft/playwright-cli` | Official Microsoft | About 76k installs | Useful browser automation, but inspect first because the `skills.sh` security result includes a Snyk failure |
| `typescript-advanced-types` | `wshobson/agents` | Community | About 51k installs | Useful for complex domain modeling; not an official Microsoft TypeScript skill |
| `tailwind-design-system` | `wshobson/agents` | Community | About 52k installs | Useful if the Tailwind design system becomes complex; not an official Tailwind Labs skill |

No strong `skills.sh` candidates were found for Vite, React Compiler, MapLibre, pnpm, Sentry, or PostHog at this
stage. Revisit this before adding major new integrations.

### Related Libraries

TanStack Router should be part of the MVP stack. The Explore page has URL-backed state that should stay type-safe:
month, participants, budget, days, countries, transport modes, selected destination, and detail drawer state. A
typed router is a better fit for this than ad hoc search parameter handling.

TanStack Form is a likely later addition for Planned Trip Details. The trip editor will eventually have nested
editable state for days, hikes, duration overrides, nights, lodging, dates, custom costs, and validation rules. Add
it when that page becomes complex enough to need a dedicated typed form system.

Do not add TanStack Query as the default data layer for Convex data. Convex already provides reactive queries and
mutations. TanStack Query can be added later for non-Convex server state or external APIs if that need appears.

Do not switch to TanStack Start for the MVP. Vite, Convex, and Vercel are simpler for the first product version.
Revisit TanStack Start if server rendering, streaming, or a more framework-like app shell becomes important.

Effect is not part of the MVP application stack. It may become useful in the future data ingestion and provider
layer, where typed errors, retries, concurrency, rate limits, streams, partial failures, and service composition
can justify the extra model. Do not introduce Effect into UI or ordinary domain code unless the integration layer
has become complex enough to need it.

## Architecture

### Product Shape

Trail Planner should be built as an interactive planning application, not as a collection of disconnected data
source demos. The existing POC code should be treated as throwaway implementation code: useful for inspiration,
interaction patterns, sample data, and source research, but not something the MVP needs to migrate in place. The MVP
can start from a clean implementation that imports proven ideas through typed domain, import, and provider modules.
UI code should only talk to product-level queries and mutations.

The most important architectural boundary is between product data and source data:

- Product data: destinations, travel estimates, hikes, planned trips, itineraries, lodging choices, cost items,
  user overrides, and share links.
- Source data: OSM records, official route pages, flight offers, exchange rates, ferry assumptions, weather
  responses, elevation samples, airport metadata, and manual research notes.

The app should store enough source and provenance data to explain estimates, but the product should not expose raw
provider responses as its main model.

### Data Ownership

Convex owns the MVP application data:

- App user/profile records and Clerk identity references.
- Destination and hike records that are ready to show in the product.
- Travel estimate snapshots and their confidence/provenance metadata.
- Planned trips, itinerary days, lodging nights, custom cost items, and selected travel modes.
- Shareable read-only trip links.
- Small uploaded files such as user GPX files when needed.
- Scheduled refresh metadata and lightweight provider cache records.

Convex should not be treated as the permanent home for very large geospatial assets. Large OSM extracts, routing
graphs, DEM/tile caches, and bulk raw provider archives should be deferred until they are needed. If those become
necessary, the likely future choices are object storage for large files and Railway or another compute host for
long-running processors.

No data migrations are planned for the MVP because the first real implementation is greenfield. After production user
data or curated provider data exists, breaking schema changes should be handled deliberately instead of by destructive
rewrites, but that is a post-MVP operational concern.

### Integration Style

Each external source should be wrapped by a provider module with a typed normalized output. The rest of the app
should not know whether a value came from Amadeus, Entur, Open-Meteo, OSM, an official page, or a manual seed.

Every provider-derived or manually curated claim that affects user decisions should carry:

- Source ID.
- Source URL when available.
- Retrieved or reviewed timestamp.
- Valid month/date range when relevant.
- Confidence level.
- Price type: live, sampled, estimated, manual, or unavailable.
- Attribution/license requirements.
- Refresh policy.

This is especially important for travel time, ticket prices, ferry/shuttle availability, parking fees, lodging
options, recommended season, closures, and safety warnings.

Provider ingestion and refresh should use clear Convex boundaries:

- External API calls, large file parsing, and CPU-heavy normalization belong in actions or external scripts, not in
  Convex queries or mutations.
- Mutations should write normalized product/source records in small, idempotent batches.
- Scheduled refreshes should track source, status, last success, last failure, next refresh, and whether output is
  safe to publish.
- User-facing queries should read product-ready records and provenance summaries, not raw provider responses.
- Manual seed and manual correction flows should produce the same normalized claim/provenance shape as automated
  providers.

### Query and Read Models

The Explore page should be backed by bounded read models, not broad scans over full destination, hike, and source
documents. Start with small destination and travel-estimate projection shapes that answer the list view, then fetch
destination details, map geometry, and full provenance only when the user opens a destination.

The initial schema should include indexes shaped around the real product queries, especially:

- destination country/region and product visibility.
- recommended month or season fit.
- travel estimate lookup by destination, origin assumptions, month, and transport mode.
- planned trips by owner and planned month.
- itinerary records by trip and day order.
- share links by token and status.

Convex reactivity is useful for saved trips and edits, but low-churn catalog/explore data does not need every small
source refresh to invalidate the whole UI. Keep reactive queries narrow, return only the fields the current view
needs, and split list digests from details when records become large.

### Frontend Architecture

The frontend should be organized by product feature rather than by technical type. Shared UI primitives belong in
`components/ui`, but feature-specific components, hooks, and helpers should live with the feature they support.

TanStack Router should preserve the user's explore state in the URL where practical, especially month,
participants, budget, days, travel modes, countries, and selected destination. Saved trips should persist a
snapshot of the explore options that created them so the user can return to the same decision context later.

React Compiler should be enabled early, with code written in a compiler-friendly style: pure rendering, stable
data flow, minimal manual memoization, and no hidden side effects during render.

Frontend performance should be designed into the main flows from the start:

- Lazy-load MapLibre and map-heavy panels so they do not dominate the initial landing or Explore bundle.
- Keep Explore filters URL-backed, but treat expensive result and map updates as non-urgent UI work where appropriate.
- Fetch detail drawer data separately from the results list.
- Defer future analytics and error-reporting SDKs until after hydration.
- Keep the trip editor state behind feature-level providers and domain commands rather than one monolithic page
  component with many boolean modes.

### Trip and Share Semantics

Saving a planned trip should create a durable snapshot of the decision context: explore filters, participant count,
budget, trip length, destination, selected month, visible travel estimates, and the provenance/confidence behind the
selected estimates. Catalog and provider refreshes can improve future Explore results, but they should not silently
rewrite an existing planned trip's budget or travel assumptions. Give the user an explicit refresh/recalculate action
later if live updates become useful.

Share links should expose a sanitized read-only projection of the trip snapshot. They should not expose private owner
data, editable mutation paths, raw provider responses, or unpublished/manual research notes.

### File Layout

The MVP can start as one repository with a Vite app, Convex backend, shared domain code, and data import scripts.
This layout keeps the first version simple while leaving room for more data sources and integrations.

```text
trail-planner/
  apps/
    web/
      src/
        app/
          router.tsx
          routes/
          providers/
        components/
          ui/
          layout/
          feedback/
        features/
          landing/
          explore/
          destinations/
          trips/
          itinerary/
          lodging/
          budget/
          maps/
          auth/
        hooks/
        lib/
        styles/
        main.tsx
      public/
      index.html
      vite.config.ts
      components.json

  convex/
    schema.ts
    auth.config.ts
    crons.ts
    http.ts
    users.ts
    destinations.ts
    travelEstimates.ts
    trips.ts
    shareLinks.ts
    files.ts
    internal/
      scoring.ts
      provenance.ts
      costModel.ts
      geo.ts
      readModels.ts
    providers/
      amadeus.ts
      entur.ts
      openMeteo.ts
      exchangeRates.ts
      overpass.ts
      ourAirports.ts
      manualSources.ts
    ingest/
      importDestinations.ts
      importHikes.ts
      importAirports.ts
      refreshTravelEstimates.ts

  packages/
    domain/
      src/
        destination.ts
        hike.ts
        travel.ts
        trip.ts
        lodging.ts
        budget.ts
        provenance.ts
        geo.ts
        readModels.ts
    data-tools/
      src/
        normalize/
        validate/
        fixtures/

  data/
    seeds/
      destinations/
      hikes/
      manual-sources/
    normalized/
    fixtures/

  scripts/
    ingest/
    validate-data/
    maintenance/

  tests/
    unit/
    integration/
  e2e/
  docs/
    architecture/
    data-sources/
```

### Initial Domain Modules

The first implementation should define these domain areas before the UI grows too much:

- Destination/hub catalog.
- Hike catalog.
- Travel estimates by mode.
- Explore read models and ranking.
- Recommended season and month fit.
- Provenance and license registry.
- Clerk identity mapping and app user profiles.
- Planned trips.
- Itinerary days and nights.
- Lodging choices.
- Budget and custom cost items.
- Share links.

### Testing Strategy

The early tests should focus on logic that can quietly mislead the user:

- Destination filtering and sorting.
- Month/season fit.
- Travel mode availability.
- Cost calculations and currency conversion.
- Trip-day allocation when adding multi-day hikes.
- Share-link access rules.
- Provider normalization and provenance requirements.
- Clerk-to-Convex authenticated state and protected backend ownership checks.
- Explore URL search parameter parsing.
- Provider refresh idempotency and publish status.

Use unit tests for domain logic and provider normalization. Add Playwright tests for the core user flow: landing
choices, explore results, destination details, save trip, edit itinerary, update budget, and open read-only share
link.

## Views/Pages

### Landing Page

The landing page is a simple page that communicates what this website is about but it does not in itself hold any
travel information - it is just a gateway to start exploring or to access your own data, such as planned trips.

The landing page is where the user makes a choice for how to start exploring trail options - it starts with an
idea for the scope of a trip such as the number of participants and which month it should take place in. The user
makes these initial choices and puts a limit on the number of days and spending for the journey. Then they press
the Explore button which takes them to the Explore view.

### Explore

The Explore page is all about presenting the relevant hiking destinations/hubs without going into details about the actual trails. It is about helping the user figuring out where in the world they can get to within the limits
of their time and money budget. The focus is on transport and not lodging. The destinations are only those relevant for rough terrain hiking and the recommended periods should not include ski/snow seasons.

Based on the selection made in the landing page (which they can also change in this page) it will show the relevant
destinations. The destinations are all locations from which you can start hiking directly or with very limited local transport. You should be able to see a details view for each destination which shows a map of the area and
provides descriptions of the area and the available routes. Viewing should not leave the active exploration search.

Each destination should have a projected travel time and cost for each of the transport options: own car, train/bus, airplane. Options that are not available should be marked as such. For instance, if a flight route is not available during the travel month, it should be marked as unavailable.

There are some additional filters available on this page to narrow down the options:
- Toggle each of the travel types (all enabled by default)
- The maximum number of layovers during flights (default is 0)
- The maximum travel time when driving to the destination (the limit is for one way, not total)
- The maximum cost of plane tickets per person (default 5000DKK)
- Countries (a multiselect list of all the countries with possible results - all enabled by default)
- Recommended period fit (each destination should have a recommended range of months and this option controls how many months outside of this range should be included - default is 0)

From this page you can save a destination as a planned trip. It saves all the options used for the search so
you can easily go back and start exploring some other options. Saving the trip will navigate to the Planned
Trip Details view for the new trip.

### Planned Trips List

This page lists all the planned trips you have saved from the Explore view. They are sorted by planned month.
You can remove trips or click a trip to view details for it.

### Planned Trip Details

This view shows all the information for the destination. It shows all the travel options and you can pick which
option you want to go with. The details page shows an estimated total cost for the trip and selecting a travel mode
updates this value (which was otherwise just 0DKK).

A list is shown with each day of the trip. Initially they don't have calendar dates
but you can pick the specific dates when you are ready to. Otherwise they just remain numbered days. Based on the
travel mode, the travel details are filled into the slots at both ends of the trip. In addition, you can click each
day and select a hike to put in the slot. Some hikes may have longer durations than one day, so they will fill
multiple slots. Before adding a hike, you have the option to override its duration though. It is also possible to
add multiple hikes in the same day, so adding a new hike should not replace the existing one. You can
also name your own hikes (filling out some limited description and setting duration).

Between each of these day slots is a night slot where you can select a lodging option. You can choose either Tent (Free), Tent (Camping - you provide a cost for the camping site),
Other (you give it a name and cost) or search (if available in the region, you can search for known cabins and the like). As lodgings are chosen, the cost of the trip is updated.

On the details page you can add/remove custom cost items to the budget such as estimated food costs and the like.

A map is shown of location for the trip. Each trail is plotted onto the map, including each lodging. Each
trail is assigned a letter in the day plan and this letter is also used in the map view.

You can create a shareable read only link to a specific trip.
