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
import { useAuthSession } from "@/features/auth/AuthSession";
import {
  modeLabels,
  rankDestinations,
  type ExploreResult,
  type ExploreSearch,
} from "@/features/explore/search";
import { TrailMap } from "@/features/maps/TrailMap";
import { useTripStore } from "@/features/trips/TripStore";

const origin: [number, number] = [9.922, 57.048];

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

  const routeLine = selectedResult
    ? [
        origin,
        [origin[0] - 1.4, origin[1] + 1.2] as [number, number],
        [
          (origin[0] + selectedResult.destination.coordinates[0]) / 2,
          (origin[1] + selectedResult.destination.coordinates[1]) / 2 + 1.4,
        ] as [number, number],
        selectedResult.destination.coordinates,
      ]
    : [];

  return (
    <AppShell fullHeight>
      <main className="explore-stage">
        <TrailMap
          className="explore-map"
          lines={routeLine.length ? [{ id: "journey", coordinates: routeLine }] : []}
          markers={results.map((result, index) => ({
            id: result.destination.id,
            label: `${result.destination.name}, ${result.destination.country}`,
            coordinates: result.destination.coordinates,
            badge: String(index + 1),
          }))}
          mode={search.details ? "detail" : "explore"}
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
            search={search}
            onDetailsChange={(details) => onSearchChange({ ...search, details }, true)}
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
    onChange({ ...search, [key]: value }, true);
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
            <label>Maximum flight layovers</label>
            <select value={search.maxLayovers} onChange={(event) => update("maxLayovers", Number(event.target.value))}>
              {[0, 1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div className="filter-row">
            <label>Months outside ideal season</label>
            <select value={search.seasonTolerance} onChange={(event) => update("seasonTolerance", Number(event.target.value))}>
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
      <span className="destination-copy">
        <strong>{result.destination.name}</strong>
        <small>{result.destination.region} · {result.destination.country}</small>
        <span className="season-line">Best {result.destination.recommendedMonths.map((month) => monthNames[month - 1].slice(0, 3)).join("–")}</span>
      </span>
      <span className="destination-best">
        {modeIcon(result.best.mode)}
        <strong>{formatHours(result.best.hours)}</strong>
        <small>{formatMoney(result.best.costPerPersonDkk * search.participants)} total</small>
      </span>
    </button>
  );
}

function SelectedDestinationCard({
  result,
  search,
  onPlan,
  onDetailsChange,
}: {
  result: ExploreResult;
  search: ExploreSearch;
  onPlan: () => void;
  onDetailsChange: (open: boolean) => void;
}) {
  const destination = result.destination;
  return (
    <article className="selected-destination">
      <div className="selected-destination__top">
        <div>
          <p className="step-label">{destination.country}</p>
          <h2>{destination.name}</h2>
          <p>{destination.summary}</p>
        </div>
        <Badge variant="secondary">Ideal in {monthNames[search.month - 1]}</Badge>
      </div>
      <div className="travel-strip">
        {destination.travel.map((estimate) => (
          <TravelSummary estimate={estimate} key={estimate.mode} participants={search.participants} viable={result.viable.includes(estimate)} />
        ))}
      </div>
      <div className="selected-destination__actions">
        <DestinationDetails destination={destination} search={search} onDetailsChange={onDetailsChange} onPlan={onPlan} />
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
          <><strong>{formatHours(estimate.hours)}</strong><em>{formatMoney(estimate.costPerPersonDkk * participants)}</em></>
        ) : <strong>Unavailable</strong>}
      </span>
    </div>
  );
}

function DestinationDetails({ destination, search, onPlan, onDetailsChange }: { destination: Destination; search: ExploreSearch; onPlan: () => void; onDetailsChange: (open: boolean) => void }) {
  return (
    <Sheet onOpenChange={onDetailsChange}>
      <SheetTrigger asChild><Button variant="outline">View area details</Button></SheetTrigger>
      <SheetContent className="destination-sheet paper-sheet sm:max-w-xl" side="right">
        <SheetHeader>
          <p className="step-label">{destination.region}, {destination.country}</p>
          <SheetTitle>{destination.name}</SheetTitle>
          <SheetDescription>{destination.character}</SheetDescription>
        </SheetHeader>
        <div className="destination-sheet__body">
          <section>
            <h3>Available travel</h3>
            <div className="detail-travel-list">
              {destination.travel.map((estimate) => (
                <div key={estimate.mode}>
                  {modeIcon(estimate.mode)}
                  <span><strong>{modeLabels[estimate.mode]}</strong><small>{estimate.note}</small></span>
                  <span>{estimate.available ? `${formatHours(estimate.hours)} · ${formatMoney(estimate.costPerPersonDkk * search.participants)}` : "Unavailable"}</span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3>Routes in the area</h3>
            <div className="route-preview-list">
              {destination.hikes.map((hike) => (
                <article key={hike.id}>
                  <Route />
                  <div><strong>{hike.name}</strong><p>{hike.description}</p><small>{hike.durationDays} day · {hike.distanceKm} km · {hike.ascentM} m ascent · {hike.difficulty}</small></div>
                </article>
              ))}
            </div>
          </section>
        </div>
        <SheetFooter><Button onClick={onPlan}>Plan {destination.name} <ArrowRight /></Button></SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function modeIcon(mode: TravelMode) {
  return mode === "car" ? <CarFront /> : mode === "train" ? <BusFront /> : <Plane />;
}
