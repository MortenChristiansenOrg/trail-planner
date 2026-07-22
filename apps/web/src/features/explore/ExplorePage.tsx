import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BusFront,
  CalendarDays,
  CarFront,
  Check,
  Clock3,
  Coins,
  Filter,
  MapPin,
  Plane,
  Route,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { AppShell } from "@/components/layout/AppShell";
import { CatalogMediaFigure } from "@/features/catalog/CatalogMediaFigure";
import {
  countryOptions,
  destinations,
  formatHours,
  formatMoney,
  monthNames,
  type Destination,
  type TravelEstimate,
  type TravelMode,
} from "@/features/catalog/catalog";
import { TravelOptionDetails } from "@/features/catalog/TravelOptionDetails";
import { useAuthSession } from "@/features/auth/AuthSession";
import {
  modeLabels,
  rankDestinations,
  reconcileExploreSelection,
  type ExploreResult,
  type ExploreSearch,
} from "@/features/explore/search";
import { TrailMap } from "@/features/maps/TrailMap";
import { useDrivingRoute } from "@/features/maps/useDrivingRoute";
import { useTripStore } from "@/features/trips/TripStore";

export function ExplorePage({
  search,
  onSearchChange,
}: {
  search: ExploreSearch;
  onSearchChange: (next: ExploreSearch, replace?: boolean) => void;
}) {
  const navigate = useNavigate();
  const auth = useAuthSession();
  const tripStore = useTripStore();
  const results = rankDestinations(destinations, search);
  const selectedResult =
    results.find((result) => result.destination.id === search.selected) ?? results[0];
  const drivingRoute = useDrivingRoute(
    selectedResult?.destination.id,
    selectedResult?.destination.coordinates,
    selectedResult?.destination.countryCode !== "NO",
  );

  const selectDestination = (destinationId: string) => {
    onSearchChange({ ...search, selected: destinationId }, true);
  };

  const planTrip = async (result: ExploreResult) => {
    if (auth.configured && !auth.signedIn) {
      auth.signIn();
      return;
    }
    const trip = await tripStore.create({
      destinationId: result.destination.id,
      destinationName: result.destination.name,
      search,
      travel: result.destination.travel,
    });
    void navigate({ to: "/trips/$tripId", params: { tripId: trip.id } });
  };

  return (
    <AppShell fullHeight>
      <main className="explore-stage">
        <TrailMap
          className="explore-map"
          lines={drivingRoute.lines}
          markers={results.map((result, index) => ({
            id: result.destination.id,
            label: `${result.destination.name}, ${result.destination.country}`,
            coordinates: result.destination.coordinates,
            badge: String(index + 1),
          }))}
          mode="explore"
          onSelect={selectDestination}
          selectedId={selectedResult?.destination.id}
        />
        <div className="map-paper-wash" />

        <SearchSummary search={search} resultCount={results.length} onChange={onSearchChange} />

        <section className="results-panel" aria-label="Matching destinations">
          <div className="results-panel__header">
            <div>
              <p className="step-label">From Aalborg</p>
              <h1>{results.length} destinations fit</h1>
            </div>
            <span className="result-sort"><Sparkles /> Best overall</span>
          </div>
          <p className="rank-explanation">Numbers show overall fit rank; 1 is the strongest match.</p>
          <div className="results-list">
            {results.length ? (
              results.map((result, index) => (
                <DestinationCard
                  index={index + 1}
                  key={result.destination.id}
                  result={result}
                  search={search}
                  selected={result.destination.id === selectedResult?.destination.id}
                  onSelect={() => selectDestination(result.destination.id)}
                />
              ))
            ) : (
              <div className="empty-results">
                <MapPin />
                <h2>No destination fits every limit</h2>
                <p>Try allowing one month outside the ideal season, another layover, or a larger drive-time limit.</p>
              </div>
            )}
          </div>
        </section>

        {selectedResult ? (
          <SelectedDestinationCard
            result={selectedResult}
            drivingRouteLabel={drivingRoute.lines.length ? drivingRoute.label : undefined}
            search={search}
            onPlan={() => void planTrip(selectedResult)}
          />
        ) : null}
      </main>
    </AppShell>
  );
}

function SearchSummary({
  search,
  resultCount,
  onChange,
}: {
  search: ExploreSearch;
  resultCount: number;
  onChange: (next: ExploreSearch, replace?: boolean) => void;
}) {
  return (
    <div className="search-summary">
      <div className="search-summary__items">
        <span><CalendarDays /><strong>{monthNames[search.month - 1]}</strong></span>
        <span><UsersRound /><strong>{search.participants}</strong> people</span>
        <span><Clock3 /><strong>{search.days}</strong> days</span>
        <span><Coins /><strong>{formatMoney(search.budget)}</strong></span>
      </div>
      <FilterSheet search={search} resultCount={resultCount} onChange={onChange} />
    </div>
  );
}

function FilterSheet({
  search,
  resultCount,
  onChange,
}: {
  search: ExploreSearch;
  resultCount: number;
  onChange: (next: ExploreSearch, replace?: boolean) => void;
}) {
  const update = <Key extends keyof ExploreSearch>(key: Key, value: ExploreSearch[Key]) => {
    onChange(reconcileExploreSelection(destinations, { ...search, [key]: value }), true);
  };
  const toggleMode = (mode: TravelMode) => {
    const modes = search.modes.includes(mode)
      ? search.modes.filter((item) => item !== mode)
      : [...search.modes, mode];
    if (modes.length) update("modes", modes);
  };
  const toggleCountry = (code: string) => {
    update(
      "countries",
      search.countries.includes(code)
        ? search.countries.filter((item) => item !== code)
        : [...search.countries, code],
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="filter-button" size="sm"><Filter /> Filters</Button>
      </SheetTrigger>
      <SheetContent className="filter-sheet paper-sheet sm:max-w-md" side="right">
        <SheetHeader>
          <SheetTitle>Shape the journey</SheetTitle>
          <SheetDescription>Only destinations meeting every active limit appear on the map.</SheetDescription>
        </SheetHeader>
        <div className="filter-sheet__body">
          <FilterRange label="Travel month" value={monthNames[search.month - 1]} min={1} max={12} step={1} current={search.month} onChange={(value) => update("month", value)} />
          <FilterRange label="Travellers" value={`${search.participants} ${search.participants === 1 ? "person" : "people"}`} min={1} max={12} step={1} current={search.participants} onChange={(value) => update("participants", value)} />
          <FilterRange label="Trip length" value={`${search.days} days`} min={2} max={14} step={1} current={search.days} onChange={(value) => update("days", value)} />
          <FilterRange label="Transport budget" value={formatMoney(search.budget)} min={3_000} max={40_000} step={1_000} current={search.budget} onChange={(value) => update("budget", value)} />
          <FilterRange label="Maximum one-way drive" value={`${search.maxDriveHours} hours`} min={4} max={40} step={1} current={search.maxDriveHours} onChange={(value) => update("maxDriveHours", value)} />
          <FilterRange label="Maximum flight per person" value={formatMoney(search.maxFlightDkk)} min={500} max={10_000} step={250} current={search.maxFlightDkk} onChange={(value) => update("maxFlightDkk", value)} />

          <fieldset className="filter-group">
            <legend>Transport modes</legend>
            <div className="toggle-grid">
              {(["car", "train", "plane"] as TravelMode[]).map((mode) => (
                <button className={search.modes.includes(mode) ? "is-active" : ""} key={mode} onClick={() => toggleMode(mode)} type="button">
                  {mode === "car" ? <CarFront /> : mode === "train" ? <BusFront /> : <Plane />}
                  {modeLabels[mode]}
                  {search.modes.includes(mode) ? <Check className="toggle-check" /> : null}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="filter-row">
            <label htmlFor="maximum-flight-layovers">Maximum flight layovers</label>
            <select id="maximum-flight-layovers" value={search.maxLayovers} onChange={(event) => update("maxLayovers", Number(event.target.value))}>
              {[0, 1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div className="filter-row">
            <label htmlFor="season-tolerance">Months outside ideal season</label>
            <select id="season-tolerance" value={search.seasonTolerance} onChange={(event) => update("seasonTolerance", Number(event.target.value))}>
              {[0, 1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>

          <fieldset className="filter-group">
            <legend>Countries <span>{search.countries.length ? `${search.countries.length} selected` : "All"}</span></legend>
            <div className="country-grid">
              {countryOptions.map((country) => (
                <label key={country.code}>
                  <input checked={search.countries.includes(country.code)} onChange={() => toggleCountry(country.code)} type="checkbox" />
                  {country.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <SheetFooter>
          <div className="filter-result-count"><strong>{resultCount}</strong> destinations currently fit</div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FilterRange({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="filter-range">
      <span><span>{label}</span><strong>{value}</strong></span>
      <Slider aria-label={label} min={min} max={max} step={step} value={[current]} onValueChange={([next]) => onChange(next)} />
    </label>
  );
}

function DestinationCard({
  result,
  index,
  selected,
  search,
  onSelect,
}: {
  result: ExploreResult;
  index: number;
  selected: boolean;
  search: ExploreSearch;
  onSelect: () => void;
}) {
  return (
    <button aria-pressed={selected} className={`destination-row${selected ? " is-selected" : ""}`} onClick={onSelect} type="button">
      <span className="destination-rank">{index}</span>
      <CatalogMediaFigure media={result.destination.media} showAttribution={false} sizes="56px" variant="thumbnail" />
      <span className="destination-copy">
        <strong>{result.destination.name}</strong>
        <small>{result.destination.region} · {result.destination.country}</small>
        <span className="season-line">Best {result.destination.recommendedMonths.map((month) => monthNames[month - 1].slice(0, 3)).join("–")}</span>
      </span>
      <span className="destination-best">
        <span className="destination-best__label">Best match</span>
        {modeIcon(result.best.mode)}
        <strong>{formatHours(result.best.oneWayHours)}</strong>
        <small>{formatMoney(result.best.costPerPersonDkk * search.participants)} total</small>
      </span>
    </button>
  );
}

function SelectedDestinationCard({
  result,
  drivingRouteLabel,
  search,
  onPlan,
}: {
  result: ExploreResult;
  drivingRouteLabel?: string;
  search: ExploreSearch;
  onPlan: () => void;
}) {
  const destination = result.destination;
  const idealSeason = result.seasonDistance === 0;
  return (
    <article className="selected-destination">
      <div className="selected-destination__top">
        <CatalogMediaFigure loading="eager" media={destination.media} sizes="150px" variant="thumbnail" />
        <div>
          <p className="step-label">{destination.country}</p>
          <h2>{destination.name}</h2>
          <p>{destination.summary}</p>
        </div>
        <div className="season-fit">
          <Badge
            title={idealSeason ? "The selected month is within this area's recommended hiking season." : "The selected month is outside this area's recommended hiking season."}
            variant="secondary"
          >
            {idealSeason ? "Ideal in" : "Planning for"} {monthNames[search.month - 1]}
          </Badge>
          <span>{idealSeason ? "Selected month is in the area’s recommended hiking season." : "Season tolerance is keeping this destination in the results."}</span>
        </div>
      </div>
      <div className="travel-strip">
        {destination.travel.map((estimate) => (
          <TravelSummary estimate={estimate} key={estimate.mode} participants={search.participants} viable={result.viable.includes(estimate)} />
        ))}
      </div>
      {drivingRouteLabel ? <p className="journey-map-key"><Route /> Map route: {drivingRouteLabel}</p> : null}
      <div className="selected-destination__actions">
        <DestinationDetails destination={destination} search={search} onPlan={onPlan} />
        <Button onClick={onPlan}>Plan this trip <ArrowRight /></Button>
      </div>
    </article>
  );
}

function TravelSummary({ estimate, participants, viable }: { estimate: TravelEstimate; participants: number; viable: boolean }) {
  return (
    <div className={`travel-summary${!estimate.available ? " is-unavailable" : ""}${viable ? " is-viable" : ""}`}>
      {modeIcon(estimate.mode)}
      <span>
        <small>{modeLabels[estimate.mode]}</small>
        {estimate.available ? (
          <><strong>{formatHours(estimate.oneWayHours)}</strong><em>{formatMoney(estimate.costPerPersonDkk * participants)}</em>{estimate.mode === "plane" ? <small className="travel-layovers">{estimate.layovers ?? 0} layover{estimate.layovers === 1 ? "" : "s"}</small> : null}</>
        ) : <strong>Unavailable</strong>}
      </span>
      <em className="travel-summary__status">{viable ? "Fits your limits" : estimate.available ? "Outside current limits" : "Not available"}</em>
    </div>
  );
}

function DestinationDetails({ destination, search, onPlan }: { destination: Destination; search: ExploreSearch; onPlan: () => void }) {
  return (
    <Sheet>
      <SheetTrigger asChild><Button variant="outline">View area details</Button></SheetTrigger>
      <SheetContent className="destination-sheet paper-sheet sm:max-w-xl" side="right">
        <SheetHeader>
          <p className="step-label">{destination.region}, {destination.country}</p>
          <SheetTitle>{destination.name}</SheetTitle>
          <SheetDescription>{destination.character}</SheetDescription>
        </SheetHeader>
        <div className="destination-sheet__body">
          <CatalogMediaFigure media={destination.media} sizes="(max-width: 640px) 90vw, 540px" />
          <section>
            <h3>Available travel</h3>
            <div className="detail-travel-list">
              {destination.travel.map((estimate) => (
                <div key={estimate.mode}>
                  {modeIcon(estimate.mode)}
                  <span><strong>{modeLabels[estimate.mode]}</strong><small>{estimate.note}</small></span>
                  <div className="detail-travel-actions"><span>{estimate.available ? `${formatHours(estimate.oneWayHours)} · ${formatMoney(estimate.costPerPersonDkk * search.participants)}${estimate.mode === "plane" ? ` · ${estimate.layovers ?? 0} layover${estimate.layovers === 1 ? "" : "s"}` : ""}` : "Unavailable"}</span>{estimate.available ? <TravelOptionDetails optionId={estimate.optionId} /> : null}</div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3>Hikes in the area</h3>
            {destination.hikes.length ? <div className="route-preview-list">
              {destination.hikes.map((hike) => (
                <article className={hike.media ? "has-media" : undefined} key={hike.id}>
                  {hike.media ? <CatalogMediaFigure media={hike.media} sizes="90px" variant="thumbnail" /> : null}
                  <Route />
                  <div><strong>{hike.name}</strong><p>{hike.description}</p><small>{hike.durationDays} day · {hike.distanceKm} km · {hike.ascentM} m ascent · {hike.difficulty}{hike.route.length ? "" : " · route geometry unavailable"}</small></div>
                </article>
              ))}
            </div> : <div className="routes-curating"><Route /><div><strong>Trail geometry unavailable</strong><p>This is a published access and logistics hub, but no route geometry has passed source verification yet. You can still plan travel, lodging, and personal hikes.</p></div></div>}
          </section>
          <p className="catalog-source">Catalog source verified {destination.provenance.verifiedAt}: <a href={destination.provenance.sourceUrl} rel="noreferrer" target="_blank">inspect source</a></p>
        </div>
        <SheetFooter><Button onClick={onPlan}>Plan {destination.name} <ArrowRight /></Button></SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function modeIcon(mode: TravelMode) {
  return mode === "car" ? <CarFront /> : mode === "train" ? <BusFront /> : <Plane />;
}
