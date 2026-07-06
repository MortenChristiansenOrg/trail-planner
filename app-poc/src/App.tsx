import { type ReactNode, useMemo, useState } from "react";
import {
  AlertTriangle,
  Backpack,
  BedDouble,
  CalendarDays,
  Car,
  Check,
  ChevronRight,
  ClipboardCheck,
  CloudRain,
  Compass,
  Info,
  Map as MapIcon,
  MapPin,
  Mountain,
  Plane,
  Plus,
  Route,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tent,
  Train,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GearCategory,
  GearItem,
  GearTripMode,
  buildGearChecklist,
  estimatePackWeightKg,
} from "@/data/gearChecklist";
import {
  HubHikeOption,
  HikeDifficulty,
  getHikesForHub,
  hubHikeOptions,
} from "@/data/hubPlanning";
import { HubConfidence, TrailHub, trailHubs } from "@/data/trailHubs";
import { cn } from "@/lib/utils";

type TripStyle = "balanced" | "big-days" | "low-friction" | "multi-day";
type SortMode = "best" | "access" | "routes" | "lodging";
type Stage = "explore" | "hikes" | "itinerary" | "gear";

const DEFAULT_DAYS = 6;
const DEFAULT_TRAVEL_DAYS = 2;
const DEFAULT_BUDGET = 8500;
const DEFAULT_HUB_ID = "jotunheimen-gjendesheim";

const stageItems: Array<{
  id: Stage;
  label: string;
  icon: typeof Search;
  tooltip: string;
}> = [
  {
    id: "explore",
    label: "Explore",
    icon: Search,
    tooltip: "Compare destination bases against your constraints.",
  },
  {
    id: "hikes",
    label: "Hikes",
    icon: Route,
    tooltip: "Pick the specific hikes to include in the trip.",
  },
  {
    id: "itinerary",
    label: "Plan",
    icon: CalendarDays,
    tooltip: "Review travel days, hiking days, buffers, and follow-ups.",
  },
  {
    id: "gear",
    label: "Gear",
    icon: Backpack,
    tooltip: "Generate a checklist from the selected hikes and overnight mode.",
  },
];

const tripStyleLabels: Record<TripStyle, string> = {
  balanced: "Balanced",
  "big-days": "Big days",
  "low-friction": "Low friction",
  "multi-day": "Multi-day",
};

const sortLabels: Record<SortMode, string> = {
  best: "Best fit",
  access: "Easiest access",
  routes: "Most routes",
  lodging: "Lodging",
};

const categoryLabels: Record<GearCategory, string> = {
  clothing: "Clothing",
  navigation: "Navigation",
  safety: "Safety",
  "food-water": "Food and water",
  sleep: "Sleep",
  shelter: "Shelter",
  cooking: "Cooking",
  documents: "Documents",
  electronics: "Electronics",
};

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("da-DK", { maximumFractionDigits }).format(value);

const formatDkk = (value: number) =>
  `${formatNumber(value)} DKK`;

function App() {
  const [activeStage, setActiveStage] = useState<Stage>("explore");
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [tripDays, setTripDays] = useState(DEFAULT_DAYS);
  const [travelDays, setTravelDays] = useState(DEFAULT_TRAVEL_DAYS);
  const [style, setStyle] = useState<TripStyle>("balanced");
  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [selectedHubId, setSelectedHubId] = useState(DEFAULT_HUB_ID);
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>(() =>
    suggestRouteIds(DEFAULT_HUB_ID, DEFAULT_DAYS - DEFAULT_TRAVEL_DAYS, "balanced"),
  );
  const [focusedRouteId, setFocusedRouteId] = useState<string | undefined>("besseggen");
  const [gearMode, setGearMode] = useState<GearTripMode>("day-only");
  const [expectedWet, setExpectedWet] = useState(true);
  const [expectedCold, setExpectedCold] = useState(false);
  const [checkedGearIds, setCheckedGearIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const openDays = Math.max(1, tripDays - travelDays);
  const rankedHubs = useMemo(
    () =>
      trailHubs
        .map((hub) => ({
          hub,
          score: scoreHub(hub, { budget, tripDays, style }),
          accessScore: scoreAccess(hub),
        }))
        .sort((a, b) => sortHubs(a, b, sortMode)),
    [budget, sortMode, style, tripDays],
  );
  const selectedHub =
    trailHubs.find((hub) => hub.id === selectedHubId) ?? rankedHubs[0].hub;
  const hubRoutes = useMemo(() => getHikesForHub(selectedHub.id), [selectedHub.id]);
  const selectedRoutes = useMemo(
    () =>
      selectedRouteIds
        .map((id) => hubHikeOptions.find((route) => route.id === id))
        .filter((route): route is HubHikeOption => Boolean(route)),
    [selectedRouteIds],
  );
  const selectedHubRoutes = selectedRoutes.filter(
    (route) => route.hubId === selectedHub.id,
  );
  const focusedRoute =
    hubRoutes.find((route) => route.id === focusedRouteId) ??
    selectedHubRoutes[0] ??
    hubRoutes[0];
  const usedDays = selectedHubRoutes.reduce(
    (sum, route) => sum + route.durationDays,
    0,
  );
  const remainingDays = openDays - usedDays;
  const tripEstimate = estimateTripCost(selectedHub, tripDays, selectedHubRoutes);
  const checklist = useMemo(
    () =>
      buildGearChecklist({
        mode: gearMode,
        selectedRoutes: selectedHubRoutes,
        expectedWet,
        expectedCold,
      }),
    [expectedCold, expectedWet, gearMode, selectedHubRoutes],
  );
  const groupedGear = useMemo(() => groupGear(checklist), [checklist]);
  const packWeightKg = estimatePackWeightKg(checklist);
  const checkedCount = checklist.filter((item) =>
    checkedGearIds.includes(item.id),
  ).length;
  const canCopy = selectedHubRoutes.length > 0;

  const handleHubSelect = (hubId: string) => {
    const ids = suggestRouteIds(hubId, openDays, style);
    setSelectedHubId(hubId);
    setSelectedRouteIds(ids);
    setFocusedRouteId(ids[0] ?? getHikesForHub(hubId)[0]?.id);
    setCheckedGearIds([]);
    setActiveStage("hikes");
  };

  const toggleRoute = (route: HubHikeOption) => {
    setFocusedRouteId(route.id);
    setSelectedRouteIds((current) =>
      current.includes(route.id)
        ? current.filter((id) => id !== route.id)
        : [...current.filter((id) => getHikesForHub(selectedHub.id).some((r) => r.id === id)), route.id],
    );
    setCheckedGearIds([]);
  };

  const applySuggestion = () => {
    const ids = suggestRouteIds(selectedHub.id, openDays, style);
    setSelectedRouteIds(ids);
    setFocusedRouteId(ids[0] ?? hubRoutes[0]?.id);
    setCheckedGearIds([]);
  };

  const handleTripDaysChange = (value: number) => {
    setTripDays(value);
    setTravelDays((current) => Math.min(current, value - 1));
  };

  const copySummary = async () => {
    if (!canCopy) return;
    const text = [
      `Trail Planner: ${selectedHub.name}`,
      `${tripDays} days, ${openDays} hiking day${openDays === 1 ? "" : "s"}, ${formatDkk(tripEstimate)}`,
      `Hikes: ${selectedHubRoutes.map((route) => route.name).join(", ")}`,
      `Gear: ${checklist.length} items, about ${formatNumber(packWeightKg, 1)} kg listed weight`,
    ].join("\n");
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <Mountain className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold leading-tight">Trail Planner</div>
              <div className="truncate text-xs text-muted-foreground">
                {selectedHub.region} · {tripDays} days · {selectedHubRoutes.length} hikes selected
              </div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2" aria-label="Planning stages">
            {stageItems.map((item) => {
              const Icon = item.icon;
              return (
                <Tooltip key={item.id} label={item.tooltip}>
                  <Button
                    variant={activeStage === item.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveStage(item.id)}
                    aria-current={activeStage === item.id ? "page" : undefined}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Button>
                </Tooltip>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1680px] gap-4 px-4 py-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <aside className="grid content-start gap-4">
          <TripControls
            budget={budget}
            tripDays={tripDays}
            travelDays={travelDays}
            style={style}
            onBudgetChange={setBudget}
            onTripDaysChange={handleTripDaysChange}
            onTravelDaysChange={(value) => setTravelDays(Math.min(value, tripDays - 1))}
            onStyleChange={setStyle}
          />
          <SelectedPlanCard
            hub={selectedHub}
            selectedRoutes={selectedHubRoutes}
            openDays={openDays}
            remainingDays={remainingDays}
            estimate={tripEstimate}
            onStageChange={setActiveStage}
          />
        </aside>

        <section className="grid min-w-0 gap-4">
          <HeroPanel
            hub={selectedHub}
            activeStage={activeStage}
            openDays={openDays}
            routeCount={hubRoutes.length}
            estimate={tripEstimate}
          />

          {activeStage === "explore" ? (
            <ExploreDestinations
              rankedHubs={rankedHubs}
              selectedHubId={selectedHub.id}
              sortMode={sortMode}
              onSortChange={setSortMode}
              onHubSelect={handleHubSelect}
            />
          ) : activeStage === "hikes" ? (
            <HikeSelection
              routes={hubRoutes}
              selectedRouteIds={selectedHubRoutes.map((route) => route.id)}
              focusedRoute={focusedRoute}
              remainingDays={remainingDays}
              onRouteFocus={setFocusedRouteId}
              onRouteToggle={toggleRoute}
              onApplySuggestion={applySuggestion}
            />
          ) : activeStage === "itinerary" ? (
            <ItineraryPlanner
              hub={selectedHub}
              routes={selectedHubRoutes}
              openDays={openDays}
              tripDays={tripDays}
              travelDays={travelDays}
              estimate={tripEstimate}
              remainingDays={remainingDays}
              onApplySuggestion={applySuggestion}
              onStageChange={setActiveStage}
            />
          ) : (
            <GearPlanner
              mode={gearMode}
              expectedWet={expectedWet}
              expectedCold={expectedCold}
              checklist={checklist}
              groupedGear={groupedGear}
              selectedRoutes={selectedHubRoutes}
              checkedIds={checkedGearIds}
              checkedCount={checkedCount}
              packWeightKg={packWeightKg}
              onModeChange={setGearMode}
              onWetChange={setExpectedWet}
              onColdChange={setExpectedCold}
              onToggleChecked={(itemId) =>
                setCheckedGearIds((current) =>
                  current.includes(itemId)
                    ? current.filter((id) => id !== itemId)
                    : [...current, itemId],
                )
              }
            />
          )}
        </section>

        <aside className="grid content-start gap-4">
          <TripSummary
            hub={selectedHub}
            focusedRoute={focusedRoute}
            selectedRoutes={selectedHubRoutes}
            checklist={checklist}
            checkedCount={checkedCount}
            openDays={openDays}
            usedDays={usedDays}
            estimate={tripEstimate}
            copied={copied}
            canCopy={canCopy}
            onCopy={copySummary}
            onStageChange={setActiveStage}
          />
          <EvidenceCard hub={selectedHub} route={focusedRoute} />
        </aside>
      </main>
    </div>
  );
}

function TripControls({
  budget,
  tripDays,
  travelDays,
  style,
  onBudgetChange,
  onTripDaysChange,
  onTravelDaysChange,
  onStyleChange,
}: {
  budget: number;
  tripDays: number;
  travelDays: number;
  style: TripStyle;
  onBudgetChange: (value: number) => void;
  onTripDaysChange: (value: number) => void;
  onTravelDaysChange: (value: number) => void;
  onStyleChange: (value: TripStyle) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <SlidersHorizontal className="size-4" />
          Trip fit
        </div>
        <CardTitle className="text-xl">Plan constraints</CardTitle>
        <CardDescription>Adjust the trip shape and the recommendations update immediately.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <ControlSlider
          icon={Wallet}
          label="Budget"
          valueLabel={formatDkk(budget)}
          value={budget}
          min={3000}
          max={18000}
          step={500}
          tooltip="Used to rank destinations and flag plans that are likely to stretch the trip."
          onChange={onBudgetChange}
        />
        <ControlSlider
          icon={CalendarDays}
          label="Total trip"
          valueLabel={`${tripDays} days`}
          value={tripDays}
          min={3}
          max={14}
          step={1}
          tooltip="Includes arrival and return travel days."
          onChange={onTripDaysChange}
        />
        <ControlSlider
          icon={Train}
          label="Travel days"
          valueLabel={`${travelDays} days`}
          value={travelDays}
          min={1}
          max={Math.max(1, tripDays - 1)}
          step={1}
          tooltip="Days reserved for getting to and from the hiking base."
          onChange={onTravelDaysChange}
        />
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium">Trip style</span>
            <Tooltip label="Changes ranking and the suggested set of hikes.">
              <Info className="size-4 text-muted-foreground" />
            </Tooltip>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(tripStyleLabels) as TripStyle[]).map((value) => (
              <Button
                key={value}
                variant={style === value ? "default" : "outline"}
                size="sm"
                onClick={() => onStyleChange(value)}
              >
                {tripStyleLabels[value]}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SelectedPlanCard({
  hub,
  selectedRoutes,
  openDays,
  remainingDays,
  estimate,
  onStageChange,
}: {
  hub: TrailHub;
  selectedRoutes: HubHikeOption[];
  openDays: number;
  remainingDays: number;
  estimate: number;
  onStageChange: (stage: Stage) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Current plan</CardTitle>
        <CardDescription>{hub.name}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <MetricLine icon={CalendarDays} label="Hiking days" value={`${Math.max(0, openDays - Math.max(0, remainingDays))}/${openDays}`} />
        <MetricLine icon={Route} label="Selected hikes" value={String(selectedRoutes.length)} />
        <MetricLine icon={Wallet} label="Estimate" value={formatDkk(estimate)} />
        <Badge variant={remainingDays < 0 ? "risk" : remainingDays === 0 ? "success" : "warning"} className="w-fit">
          {remainingDays < 0
            ? `${Math.abs(remainingDays)} day over plan`
            : remainingDays === 0
              ? "Days filled"
              : `${remainingDays} open day${remainingDays === 1 ? "" : "s"}`}
        </Badge>
        <div className="grid gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => onStageChange("hikes")}>
            Edit hikes
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onStageChange("itinerary")}>
            View itinerary
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroPanel({
  hub,
  activeStage,
  openDays,
  routeCount,
  estimate,
}: {
  hub: TrailHub;
  activeStage: Stage;
  openDays: number;
  routeCount: number;
  estimate: number;
}) {
  const title =
    activeStage === "explore"
      ? "Choose a mountain base that fits the whole trip."
      : activeStage === "hikes"
        ? `Pick hikes around ${hub.region}.`
        : activeStage === "itinerary"
          ? "Turn selected hikes into a day-by-day plan."
          : "Pack for the routes, weather, and overnight style.";

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="grid min-h-[330px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[300px]">
          <img
            src={hub.heroImageUrl}
            alt={`${hub.name} mountain scenery`}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="relative grid max-w-2xl gap-4 p-5 text-white sm:p-7">
            <Badge className="w-fit bg-white/90 text-stone-900 hover:bg-white/90">
              {hub.country} · {hub.season.bestMonths}
            </Badge>
            <div className="grid gap-2">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                {title}
              </h1>
              <p className="max-w-xl text-sm leading-6 text-white/88">
                {hub.summary}
              </p>
            </div>
          </div>
        </div>
        <div className="grid content-between gap-4 border-t bg-card p-4 lg:border-l lg:border-t-0">
          <div className="grid gap-3">
            <MetricLine icon={MapPin} label="Base" value={hub.name} />
            <MetricLine icon={Route} label="Available hikes" value={String(routeCount)} />
            <MetricLine icon={CalendarDays} label="Open hiking days" value={String(openDays)} />
            <MetricLine icon={Wallet} label="Trip estimate" value={formatDkk(estimate)} />
            <MetricLine icon={ShieldCheck} label="Data confidence" value={hub.profile.confidence} />
          </div>
          <div className="rounded-lg border bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">
            {hub.season.caution}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExploreDestinations({
  rankedHubs,
  selectedHubId,
  sortMode,
  onSortChange,
  onHubSelect,
}: {
  rankedHubs: Array<{ hub: TrailHub; score: number; accessScore: number }>;
  selectedHubId: string;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  onHubSelect: (hubId: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Destination shortlist</h2>
          <p className="text-sm text-muted-foreground">
            Ranked bases for a realistic hiking trip, not isolated trail ideas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(sortLabels) as SortMode[]).map((mode) => (
            <Button
              key={mode}
              variant={sortMode === mode ? "default" : "outline"}
              size="sm"
              onClick={() => onSortChange(mode)}
            >
              {sortLabels[mode]}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {rankedHubs.map(({ hub, score, accessScore }) => (
          <button
            key={hub.id}
            className={cn(
              "grid overflow-hidden rounded-lg border bg-card text-left shadow-xs transition hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring",
              selectedHubId === hub.id && "border-primary ring-2 ring-primary/15",
            )}
            onClick={() => onHubSelect(hub.id)}
          >
            <div className="grid grid-cols-[130px_minmax(0,1fr)]">
              <img
                src={hub.heroImageUrl}
                alt=""
                className="h-full min-h-44 w-full object-cover"
              />
              <div className="grid gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold leading-tight">{hub.name}</h3>
                    <p className="text-sm text-muted-foreground">{hub.region}, {hub.country}</p>
                  </div>
                  <Badge variant={confidenceVariant(hub.profile.confidence)}>
                    {Math.round(score)}
                  </Badge>
                </div>
                <p className="line-clamp-3 text-sm leading-5 text-muted-foreground">
                  {hub.summary}
                </p>
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <Signal label="Access" value={accessScore} />
                  <Signal label="Routes" value={hub.profile.routeDensity} />
                  <Signal label="Lodging" value={hub.profile.lodgingStrength} />
                  <Signal label="Season" value={hub.profile.seasonFit} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {hub.logistics.trunkAccess.slice(0, 2).map((item) => (
                    <Badge key={item} variant="outline">{item}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HikeSelection({
  routes,
  selectedRouteIds,
  focusedRoute,
  remainingDays,
  onRouteFocus,
  onRouteToggle,
  onApplySuggestion,
}: {
  routes: HubHikeOption[];
  selectedRouteIds: string[];
  focusedRoute?: HubHikeOption;
  remainingDays: number;
  onRouteFocus: (routeId: string) => void;
  onRouteToggle: (route: HubHikeOption) => void;
  onApplySuggestion: () => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Hike options</h2>
            <p className="text-sm text-muted-foreground">
              Add anchor hikes, backup days, and multi-day blocks to the trip.
            </p>
          </div>
          <Tooltip label="Rebuilds the plan from quality, route role, and available hiking days.">
            <Button variant="outline" size="sm" onClick={onApplySuggestion}>
              <Sparkles className="size-4" />
              Suggest plan
            </Button>
          </Tooltip>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {routes.map((route) => {
            const selected = selectedRouteIds.includes(route.id);
            return (
              <Card
                key={route.id}
                className={cn(
                  "transition hover:border-primary/50",
                  focusedRoute?.id === route.id && "border-primary ring-2 ring-primary/15",
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <button
                      className="min-w-0 text-left"
                      onClick={() => onRouteFocus(route.id)}
                    >
                      <CardTitle className="leading-tight">{route.name}</CardTitle>
                      <CardDescription>{route.start} to {route.end}</CardDescription>
                    </button>
                    <Badge variant={difficultyVariant(route.difficulty)}>
                      {route.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="text-sm leading-5 text-muted-foreground">{route.notes}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <SmallMetric label="Days" value={String(route.durationDays)} />
                    <SmallMetric label="Quality" value={String(route.quality)} />
                    <SmallMetric label="Weather" value={String(route.weatherSensitivity)} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{route.routeType}</Badge>
                    <Badge variant={confidenceVariant(route.confidence)}>{route.confidence}</Badge>
                    <Badge variant="secondary">{route.role}</Badge>
                  </div>
                  <Button
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRouteToggle(route)}
                    title={selected ? "Remove this hike from the trip" : "Add this hike to the trip"}
                  >
                    {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
                    {selected ? "Selected" : "Add to plan"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <RouteDetail route={focusedRoute} remainingDays={remainingDays} />
    </div>
  );
}

function RouteDetail({
  route,
  remainingDays,
}: {
  route?: HubHikeOption;
  remainingDays: number;
}) {
  if (!route) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Select a hike to see route details.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">{route.name}</CardTitle>
        <CardDescription>{route.transportNeed}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <MetricLine icon={CalendarDays} label="Duration" value={`${route.durationDays} day${route.durationDays === 1 ? "" : "s"}`} />
        <MetricLine icon={MapIcon} label="Distance" value={route.distanceKm ? `${route.distanceKm} km` : "To confirm"} />
        <MetricLine icon={Mountain} label="Ascent" value={route.ascentM ? `${formatNumber(route.ascentM)} m` : "To confirm"} />
        <MetricLine icon={Compass} label="Route type" value={route.routeType} />
        <MetricLine icon={CloudRain} label="Weather sensitivity" value={`${route.weatherSensitivity}/100`} />
        <Badge variant={remainingDays < 0 ? "risk" : "secondary"} className="w-fit">
          {remainingDays < 0 ? "Plan is overfilled" : `${remainingDays} day${remainingDays === 1 ? "" : "s"} still open`}
        </Badge>
        <div className="rounded-lg border bg-muted/35 p-3">
          <div className="font-medium">Evidence</div>
          <ul className="mt-2 grid gap-1 text-muted-foreground">
            {route.evidence.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ItineraryPlanner({
  hub,
  routes,
  openDays,
  tripDays,
  travelDays,
  estimate,
  remainingDays,
  onApplySuggestion,
  onStageChange,
}: {
  hub: TrailHub;
  routes: HubHikeOption[];
  openDays: number;
  tripDays: number;
  travelDays: number;
  estimate: number;
  remainingDays: number;
  onApplySuggestion: () => void;
  onStageChange: (stage: Stage) => void;
}) {
  const plannedDays = expandItinerary(routes, openDays);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Trip plan</h2>
          <p className="text-sm text-muted-foreground">
            {tripDays} total days with {travelDays} travel day{travelDays === 1 ? "" : "s"} and {openDays} hiking day{openDays === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onApplySuggestion}>
            <Sparkles className="size-4" />
            Rebuild
          </Button>
          <Button size="sm" onClick={() => onStageChange("gear")}>
            Gear checklist
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Day-by-day outline</CardTitle>
                <CardDescription>{hub.name}</CardDescription>
              </div>
              <Badge variant={remainingDays < 0 ? "risk" : remainingDays === 0 ? "success" : "warning"}>
                {remainingDays < 0 ? "Overfilled" : remainingDays === 0 ? "Filled" : "Needs a buffer"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            <DayRow day="Day 1" title="Travel to base" icon={Plane} detail={hub.logistics.trunkAccess[0]} />
            {plannedDays.map((item, index) => (
              <DayRow
                key={`${item.route.id}-${index}`}
                day={`Day ${index + 2}`}
                title={item.route.name}
                icon={item.route.role === "multi-day" ? BedDouble : Route}
                detail={`${item.route.difficulty} · ${item.route.durationDays > 1 ? `part ${item.part}/${item.route.durationDays}` : item.route.transportNeed}`}
                muted={item.overflow}
              />
            ))}
            {remainingDays > 0
              ? Array.from({ length: remainingDays }).map((_, index) => (
                  <DayRow
                    key={`buffer-${index}`}
                    day={`Day ${plannedDays.length + index + 2}`}
                    title="Weather or recovery buffer"
                    icon={CloudRain}
                    detail="Keep flexible until the local forecast is reliable."
                  />
                ))
              : null}
            <DayRow day={`Day ${tripDays}`} title="Return home" icon={Car} detail={hub.logistics.trunkAccess[0]} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Booking checks</CardTitle>
            <CardDescription>Items to confirm before treating the plan as bookable.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {buildBookingChecks(hub, routes).map((item) => (
              <div key={item} className="flex gap-2 rounded-lg border bg-muted/30 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
                <span>{item}</span>
              </div>
            ))}
            <SmallMetric label="Current estimate" value={formatDkk(estimate)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GearPlanner({
  mode,
  expectedWet,
  expectedCold,
  checklist,
  groupedGear,
  selectedRoutes,
  checkedIds,
  checkedCount,
  packWeightKg,
  onModeChange,
  onWetChange,
  onColdChange,
  onToggleChecked,
}: {
  mode: GearTripMode;
  expectedWet: boolean;
  expectedCold: boolean;
  checklist: GearItem[];
  groupedGear: Array<[GearCategory, GearItem[]]>;
  selectedRoutes: HubHikeOption[];
  checkedIds: string[];
  checkedCount: number;
  packWeightKg: number;
  onModeChange: (mode: GearTripMode) => void;
  onWetChange: (value: boolean) => void;
  onColdChange: (value: boolean) => void;
  onToggleChecked: (itemId: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Gear checklist</h2>
          <p className="text-sm text-muted-foreground">
            Built from {selectedRoutes.length} selected hike{selectedRoutes.length === 1 ? "" : "s"} and the overnight style.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tooltip label="Adds hut bookings, sleep liner, and shared-hut items.">
            <Button variant={mode === "hut-to-hut" ? "default" : "outline"} size="sm" onClick={() => onModeChange("hut-to-hut")}>
              <BedDouble className="size-4" />
              Hut
            </Button>
          </Tooltip>
          <Tooltip label="Adds tent, sleep system, cooking, and water treatment modules.">
            <Button variant={mode === "tent" ? "default" : "outline"} size="sm" onClick={() => onModeChange("tent")}>
              <Tent className="size-4" />
              Tent
            </Button>
          </Tooltip>
          <Tooltip label="Keeps the list focused on day-hike essentials.">
            <Button variant={mode === "day-only" ? "default" : "outline"} size="sm" onClick={() => onModeChange("day-only")}>
              <Mountain className="size-4" />
              Day
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SmallMetric label="Checklist progress" value={`${checkedCount}/${checklist.length}`} />
        <SmallMetric label="Listed weight" value={`${formatNumber(packWeightKg, 1)} kg`} />
        <div className="grid grid-cols-2 gap-2">
          <Button variant={expectedWet ? "default" : "outline"} size="sm" onClick={() => onWetChange(!expectedWet)}>
            <CloudRain className="size-4" />
            Wet
          </Button>
          <Button variant={expectedCold ? "default" : "outline"} size="sm" onClick={() => onColdChange(!expectedCold)}>
            <Mountain className="size-4" />
            Cold
          </Button>
        </div>
      </div>

      <Tabs defaultValue={groupedGear[0]?.[0] ?? "clothing"} className="gap-4">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          {groupedGear.map(([category, items]) => (
            <TabsTrigger key={category} value={category}>
              {categoryLabels[category]}
              <Badge variant="secondary" className="ml-1">{items.length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        {groupedGear.map(([category, items]) => (
          <TabsContent key={category} value={category} className="grid gap-3">
            {items.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "flex gap-3 rounded-lg border bg-card p-3 transition hover:border-primary/50",
                  checkedIds.includes(item.id) && "border-primary bg-accent/60",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[var(--primary)]"
                  checked={checkedIds.includes(item.id)}
                  onChange={() => onToggleChecked(item.id)}
                />
                <span className="grid flex-1 gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
                    {item.weightG ? <span className="text-xs text-muted-foreground">{item.weightG} g</span> : null}
                  </span>
                  <span className="text-sm leading-5 text-muted-foreground">{item.reason}</span>
                </span>
              </label>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function TripSummary({
  hub,
  focusedRoute,
  selectedRoutes,
  checklist,
  checkedCount,
  openDays,
  usedDays,
  estimate,
  copied,
  canCopy,
  onCopy,
  onStageChange,
}: {
  hub: TrailHub;
  focusedRoute?: HubHikeOption;
  selectedRoutes: HubHikeOption[];
  checklist: GearItem[];
  checkedCount: number;
  openDays: number;
  usedDays: number;
  estimate: number;
  copied: boolean;
  canCopy: boolean;
  onCopy: () => void;
  onStageChange: (stage: Stage) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ClipboardCheck className="size-4" />
          Ready check
        </div>
        <CardTitle className="text-lg">{hub.region} trip</CardTitle>
        <CardDescription>
          {selectedRoutes.length ? focusedRoute?.name : "Choose hikes to complete the plan"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <MetricLine icon={Route} label="Hike days" value={`${usedDays}/${openDays}`} />
        <MetricLine icon={Backpack} label="Gear checked" value={`${checkedCount}/${checklist.length}`} />
        <MetricLine icon={Wallet} label="Estimate" value={formatDkk(estimate)} />
        <MetricLine icon={BedDouble} label="Lodging" value={hub.logistics.lodging.slice(0, 2).join(", ")} />
        <div className="grid gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => onStageChange("explore")}>
            Change destination
          </Button>
          <Button variant="outline" size="sm" onClick={() => onStageChange("gear")}>
            Continue packing
          </Button>
          <Button size="sm" onClick={onCopy} disabled={!canCopy}>
            {copied ? <Check className="size-4" /> : <ClipboardCheck className="size-4" />}
            {copied ? "Copied" : "Copy trip summary"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceCard({
  hub,
  route,
}: {
  hub: TrailHub;
  route?: HubHikeOption;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Confidence and sources</CardTitle>
        <CardDescription>Visible source strength for the current decision.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {hub.dataSignals.slice(0, 4).map((signal) => (
          <div key={signal.label} className="grid gap-1 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{signal.source}</span>
              <Badge variant={confidenceVariant(signal.confidence)}>{signal.confidence}</Badge>
            </div>
            <div className="text-muted-foreground">{signal.label}</div>
          </div>
        ))}
        {route ? (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 font-medium">Focused hike evidence</div>
            <div className="grid gap-1 text-muted-foreground">
              {route.evidence.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ControlSlider({
  icon: Icon,
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  tooltip,
  onChange,
}: {
  icon: typeof Wallet;
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  tooltip: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="size-4" />
          {label}
        </span>
        <span className="flex items-center gap-2">
          {valueLabel}
          <Tooltip label={tooltip}>
            <Info className="size-4 text-muted-foreground" />
          </Tooltip>
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}

function DayRow({
  day,
  title,
  detail,
  icon: Icon,
  muted,
}: {
  day: string;
  title: string;
  detail: string;
  icon: typeof Route;
  muted?: boolean;
}) {
  return (
    <div className={cn("grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[82px_32px_minmax(0,1fr)]", muted && "opacity-60")}>
      <div className="text-sm font-medium text-muted-foreground">{day}</div>
      <div className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{muted ? "Standby because the plan is overfilled" : detail}</div>
      </div>
    </div>
  );
}

function MetricLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Route;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border bg-background/70 px-3 py-2">
      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        <span className="truncate text-sm">{label}</span>
      </span>
      <span className="max-w-[55%] text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="tooltip-trigger inline-flex" data-tooltip={label}>
      {children}
    </span>
  );
}

function scoreHub(
  hub: TrailHub,
  options: { budget: number; tripDays: number; style: TripStyle },
) {
  const accessScore = scoreAccess(hub);
  const budgetPenalty = Math.max(0, estimateTripCost(hub, options.tripDays, []) - options.budget) / 180;
  const timePenalty = hub.logistics.driveHoursFromAalborg
    ? Math.max(0, hub.logistics.driveHoursFromAalborg - options.tripDays * 2.2) * 2
    : 0;
  const styleBoost =
    options.style === "multi-day"
      ? hub.routeCandidates.some((route) => route.durationDays > 1)
        ? 8
        : -4
      : options.style === "low-friction"
        ? hub.profile.publicTransportFit * 0.12 + hub.profile.lodgingStrength * 0.08
        : options.style === "big-days"
          ? hub.profile.mountainQuality * 0.12
          : 0;

  return (
    hub.profile.mountainQuality * 0.3 +
    hub.profile.routeDensity * 0.22 +
    hub.profile.lodgingStrength * 0.18 +
    hub.profile.seasonFit * 0.14 +
    accessScore * 0.16 +
    styleBoost -
    budgetPenalty -
    timePenalty
  );
}

function scoreAccess(hub: TrailHub) {
  const driveFit = hub.logistics.driveHoursFromAalborg
    ? Math.max(20, 100 - hub.logistics.driveHoursFromAalborg * 4)
    : 64;
  return Math.round(
    driveFit * 0.35 +
      hub.profile.publicTransportFit * 0.35 +
      (100 - hub.profile.accessComplexity) * 0.3,
  );
}

function sortHubs(
  a: { hub: TrailHub; score: number; accessScore: number },
  b: { hub: TrailHub; score: number; accessScore: number },
  mode: SortMode,
) {
  if (mode === "access") return b.accessScore - a.accessScore;
  if (mode === "routes") return b.hub.profile.routeDensity - a.hub.profile.routeDensity;
  if (mode === "lodging") return b.hub.profile.lodgingStrength - a.hub.profile.lodgingStrength;
  return b.score - a.score;
}

function suggestRouteIds(hubId: string, openDays: number, style: TripStyle) {
  const routes = getHikesForHub(hubId).sort((a, b) => {
    const roleScore = (route: HubHikeOption) => {
      if (style === "multi-day" && route.role === "multi-day") return 24;
      if (style === "low-friction") return 100 - route.logisticsLoad;
      if (style === "big-days" && (route.difficulty === "hard" || route.difficulty === "expert")) return 20;
      if (route.role === "anchor") return 16;
      if (route.role === "filler") return 8;
      return 0;
    };
    return b.quality + roleScore(b) - (a.quality + roleScore(a));
  });
  const selected: string[] = [];
  let daysLeft = openDays;

  for (const route of routes) {
    if (route.durationDays <= daysLeft) {
      selected.push(route.id);
      daysLeft -= route.durationDays;
    }
    if (daysLeft === 0) break;
  }

  return selected.length ? selected : routes.slice(0, 1).map((route) => route.id);
}

function estimateTripCost(
  hub: TrailHub,
  tripDays: number,
  selectedRoutes: HubHikeOption[],
) {
  const baseTransport = hub.country === "Norway" ? 2400 : hub.country === "Sweden" ? 2800 : hub.country === "Italy" ? 3200 : 3600;
  const lodging = tripDays * (hub.profile.lodgingStrength > 82 ? 620 : 520);
  const localTransport = selectedRoutes.reduce(
    (sum, route) => sum + route.logisticsLoad * 8 + route.durationDays * 120,
    0,
  );
  return Math.round(baseTransport + lodging + localTransport);
}

function expandItinerary(routes: HubHikeOption[], openDays: number) {
  const days: Array<{ route: HubHikeOption; part: number; overflow: boolean }> = [];
  let used = 0;

  routes.forEach((route) => {
    Array.from({ length: route.durationDays }).forEach((_, index) => {
      used += 1;
      days.push({ route, part: index + 1, overflow: used > openDays });
    });
  });

  return days;
}

function buildBookingChecks(hub: TrailHub, routes: HubHikeOption[]) {
  const checks = [
    `Confirm lodging in ${hub.name} for the full stay.`,
    `Check ${hub.season.bestMonths} conditions before locking dates.`,
  ];

  routes.forEach((route) => {
    if (route.transportNeed !== "Walk from town" && route.transportNeed !== "Walk from lodging") {
      checks.push(`${route.name}: ${route.transportNeed}.`);
    }
    if (route.weatherSensitivity >= 70) {
      checks.push(`${route.name}: keep a weather backup or buffer day.`);
    }
  });

  return Array.from(new Set(checks)).slice(0, 6);
}

function groupGear(items: GearItem[]) {
  const grouped = items.reduce((acc, item) => {
    const current = acc.get(item.category) ?? [];
    current.push(item);
    acc.set(item.category, current);
    return acc;
  }, new Map<GearCategory, GearItem[]>());

  return Array.from(grouped.entries());
}

function confidenceVariant(confidence: HubConfidence) {
  if (confidence === "High") return "success";
  if (confidence === "Medium") return "warning";
  return "risk";
}

function difficultyVariant(difficulty: HikeDifficulty) {
  if (difficulty === "easy") return "success";
  if (difficulty === "moderate") return "outline";
  if (difficulty === "hard") return "warning";
  return "risk";
}

function priorityVariant(priority: GearItem["priority"]) {
  if (priority === "required") return "risk";
  if (priority === "recommended") return "warning";
  return "outline";
}

export default App;
