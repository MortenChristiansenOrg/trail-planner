import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock,
  Database,
  Filter,
  MapPin,
  Mountain,
  Plane,
  Route,
  ShieldCheck,
  Shuffle,
  Train,
  Wallet,
} from "lucide-react";
import backdropUrl from "@/assets/planning-map-backdrop.png";
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
import { HubConfidence, TrailHub, trailHubs } from "@/data/trailHubs";
import { HubHikeOption, getHikesForHub } from "@/data/hubPlanning";
import { cn } from "@/lib/utils";

type PlanStyle = "balanced" | "big-days" | "low-friction" | "multi-day";

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("da-DK", { maximumFractionDigits }).format(value);

const confidenceVariant = (confidence: HubConfidence) => {
  if (confidence === "High") return "success";
  if (confidence === "Medium") return "warning";
  return "risk";
};

const difficultyVariant = (difficulty: HubHikeOption["difficulty"]) => {
  if (difficulty === "easy") return "success";
  if (difficulty === "moderate") return "outline";
  if (difficulty === "hard") return "warning";
  return "risk";
};

export function PlanHubItinerary() {
  const [hubId, setHubId] = useState("jotunheimen-gjendesheim");
  const [tripDays, setTripDays] = useState(5);
  const [travelDays, setTravelDays] = useState(2);
  const [style, setStyle] = useState<PlanStyle>("balanced");
  const [selectedRouteId, setSelectedRouteId] = useState<string>();

  const hub = trailHubs.find((candidate) => candidate.id === hubId) ?? trailHubs[0];
  const routeOptions = useMemo(() => getHikesForHub(hub.id), [hub.id]);
  const openDays = Math.max(0, tripDays - travelDays);
  const suggestedPlan = useMemo(
    () => buildSuggestedPlan(routeOptions, openDays, style),
    [openDays, routeOptions, style],
  );
  const selectedRoute =
    routeOptions.find((route) => route.id === selectedRouteId) ??
    suggestedPlan.routes[0] ??
    routeOptions[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)_400px]">
      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="size-4" />
              Planning inputs
            </div>
            <CardTitle className="text-xl">Fill the hiking days</CardTitle>
            <CardDescription>
              Choose a hub and allocate the non-travel days to concrete hikes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Selected hub</div>
              <div className="grid gap-2">
                {trailHubs.map((candidate) => (
                  <Button
                    key={candidate.id}
                    variant={candidate.id === hub.id ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      setHubId(candidate.id);
                      setSelectedRouteId(undefined);
                    }}
                  >
                    <MapPin className="size-4" />
                    {candidate.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <CalendarDays className="size-4" />
                  Total trip
                </span>
                <span>{tripDays} days</span>
              </div>
              <Slider
                value={[tripDays]}
                min={3}
                max={12}
                step={1}
                onValueChange={([value]) => setTripDays(value)}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Train className="size-4" />
                  <span className="sr-only">Travel days</span>
                </span>
                <span>{travelDays} travel days</span>
              </div>
              <Slider
                value={[travelDays]}
                min={1}
                max={4}
                step={1}
                onValueChange={([value]) => setTravelDays(Math.min(value, tripDays - 1))}
              />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Fill strategy</div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["balanced", "Balanced"],
                  ["big-days", "Big days"],
                  ["low-friction", "Simple"],
                  ["multi-day", "Multi-day"],
                ] as const).map(([value, label]) => (
                  <Button
                    key={value}
                    variant={style === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStyle(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open-day budget</CardTitle>
            <CardDescription>
              Travel days are fixed inputs for this POC, not computed live.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <MetricLine icon={CalendarDays} label="Open hiking days" value={String(openDays)} />
            <MetricLine icon={Route} label="Filled days" value={String(suggestedPlan.usedDays)} />
            <MetricLine icon={ShieldCheck} label="Plan confidence" value={suggestedPlan.confidence} />
            <MetricLine icon={AlertTriangle} label="Unfilled days" value={String(suggestedPlan.unfilledDays)} />
          </CardContent>
        </Card>
      </aside>

      <main className="grid gap-4">
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="grid min-h-[310px] lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="relative min-h-[260px]">
              <img
                src={backdropUrl}
                alt="Topographic planning map with route markings"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/62 via-black/20 to-transparent" />
              <div className="relative grid max-w-2xl gap-4 p-5 text-white sm:p-7">
                <Badge className="w-fit bg-white/90 text-stone-900 hover:bg-white/90">
                  Detailed planning POC
                </Badge>
                <div className="grid gap-2">
                  <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                    Build a hike plan inside {hub.region}.
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-white/86">
                    The hub stays as the planning container. Routes are selected
                    to fill the open days, with weather, logistics, and source
                    confidence visible before anything becomes a real itinerary.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid content-between gap-4 border-t bg-card p-4 lg:border-l lg:border-t-0">
              <div className="grid gap-3">
                <MetricLine icon={MapPin} label="Hub" value={hub.name} />
                <MetricLine icon={Database} label="Route options" value={String(routeOptions.length)} />
                <MetricLine icon={CalendarDays} label="Open days" value={String(openDays)} />
                <MetricLine icon={Clock} label="Hiking hours" value={`${formatNumber(suggestedPlan.hikingHours, 1)}h`} />
                <MetricLine icon={Mountain} label="Ascent" value={`${formatNumber(suggestedPlan.ascentM)} m`} />
              </div>
              <div className="rounded-lg border bg-muted/45 p-3 text-sm text-muted-foreground">
                The planner distinguishes anchor hikes, filler days, backups, and
                multi-day route blocks instead of treating every trail equally.
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="itinerary" className="gap-4">
          <TabsList>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="hub">Hub overview</TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary" className="grid gap-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Suggested open-day fill</CardTitle>
                    <CardDescription>
                      {suggestedPlan.label}
                    </CardDescription>
                  </div>
                  <Badge variant={suggestedPlan.unfilledDays > 0 ? "warning" : "success"}>
                    {suggestedPlan.usedDays}/{openDays} days filled
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                <TravelBlock label="Travel in" day="Day 1" />
                {suggestedPlan.routes.map((route, index) => (
                  <RouteDay
                    key={route.id}
                    day={`Day ${index + 2}`}
                    route={route}
                    selected={selectedRoute?.id === route.id}
                    onSelect={() => setSelectedRouteId(route.id)}
                  />
                ))}
                {Array.from({ length: suggestedPlan.unfilledDays }).map((_, index) => (
                  <OpenDayPlaceholder
                    key={index}
                    day={`Day ${suggestedPlan.routes.length + index + 2}`}
                  />
                ))}
                <TravelBlock label="Travel home" day={`Day ${tripDays}`} />
              </CardContent>
            </Card>

            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard label="Quality" value={`${suggestedPlan.quality}/100`} />
              <SummaryCard label="Logistics load" value={`${suggestedPlan.logisticsLoad}/100`} />
              <SummaryCard label="Weather sensitivity" value={`${suggestedPlan.weatherSensitivity}/100`} />
              <SummaryCard label="Validation gaps" value={String(suggestedPlan.validationGaps)} />
            </div>
          </TabsContent>

          <TabsContent value="options" className="grid gap-3">
            {routeOptions.map((route) => (
              <RouteOptionCard
                key={route.id}
                route={route}
                selected={selectedRoute?.id === route.id}
                onSelect={() => setSelectedRouteId(route.id)}
              />
            ))}
          </TabsContent>

          <TabsContent value="hub" className="grid gap-4 lg:grid-cols-2">
            <HubOverviewCard hub={hub} />
            <SourceConfidenceCard hub={hub} routeOptions={routeOptions} />
          </TabsContent>
        </Tabs>
      </main>

      <aside className="grid content-start gap-4">
        <SelectedRoutePanel route={selectedRoute} hub={hub} />
      </aside>
    </div>
  );
}

function buildSuggestedPlan(
  routeOptions: HubHikeOption[],
  openDays: number,
  style: PlanStyle,
) {
  const sorted = [...routeOptions].sort((a, b) => scoreRoute(b, style) - scoreRoute(a, style));
  const routes: HubHikeOption[] = [];
  let usedDays = 0;

  for (const route of sorted) {
    if (usedDays + route.durationDays > openDays) continue;
    if (routes.some((selected) => selected.id === route.id)) continue;
    routes.push(route);
    usedDays += route.durationDays;
    if (usedDays >= openDays) break;
  }

  const totals = routes.reduce(
    (sum, route) => ({
      distanceKm: sum.distanceKm + (route.distanceKm ?? 0),
      ascentM: sum.ascentM + (route.ascentM ?? 0),
      hikingHours: sum.hikingHours + (route.hikingHours ?? 0),
      quality: sum.quality + route.quality,
      logisticsLoad: sum.logisticsLoad + route.logisticsLoad,
      weatherSensitivity: sum.weatherSensitivity + route.weatherSensitivity,
      validationGaps:
        sum.validationGaps +
        (route.confidence === "Low" || route.sourceStatus === "needs validation" ? 1 : 0),
    }),
    {
      distanceKm: 0,
      ascentM: 0,
      hikingHours: 0,
      quality: 0,
      logisticsLoad: 0,
      weatherSensitivity: 0,
      validationGaps: 0,
    },
  );
  const divisor = Math.max(1, routes.length);
  const confidence =
    routes.some((route) => route.confidence === "Low")
      ? "Low"
      : routes.some((route) => route.confidence === "Medium")
        ? "Medium"
        : "High";

  return {
    routes,
    usedDays,
    unfilledDays: Math.max(0, openDays - usedDays),
    distanceKm: totals.distanceKm,
    ascentM: totals.ascentM,
    hikingHours: totals.hikingHours,
    quality: Math.round(totals.quality / divisor),
    logisticsLoad: Math.round(totals.logisticsLoad / divisor),
    weatherSensitivity: Math.round(totals.weatherSensitivity / divisor),
    validationGaps: totals.validationGaps,
    confidence,
    label:
      routes.length === 0
        ? "No route block fits the current open-day budget."
        : `Prioritized for ${style.replace("-", " ")} planning.`,
  };
}

function scoreRoute(route: HubHikeOption, style: PlanStyle) {
  if (style === "big-days") {
    return route.quality * 1.25 + route.durationDays * 8 - route.logisticsLoad * 0.2;
  }
  if (style === "low-friction") {
    return route.quality * 0.8 - route.logisticsLoad * 0.75 - route.weatherSensitivity * 0.35;
  }
  if (style === "multi-day") {
    return (
      route.quality +
      (route.role === "multi-day" ? 28 : 0) +
      route.durationDays * 6 -
      route.logisticsLoad * 0.25
    );
  }

  return route.quality + (route.role === "anchor" ? 12 : 0) - route.logisticsLoad * 0.35;
}

function RouteDay({
  day,
  route,
  selected,
  onSelect,
}: {
  day: string;
  route: HubHikeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={cn(
        "grid gap-3 rounded-lg border bg-background p-3 text-left transition hover:border-primary/50 sm:grid-cols-[88px_1fr_auto]",
        selected && "border-primary ring-2 ring-primary/15",
      )}
      onClick={onSelect}
    >
      <div className="rounded-md bg-muted p-2 text-sm font-medium">{day}</div>
      <div className="grid gap-1">
        <div className="font-semibold">{route.name}</div>
        <div className="text-sm text-muted-foreground">
          {route.durationDays} day{route.durationDays === 1 ? "" : "s"} · {route.routeType} · {route.transportNeed}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <Badge variant={difficultyVariant(route.difficulty)}>{route.difficulty}</Badge>
        <Badge variant={confidenceVariant(route.confidence)}>{route.confidence}</Badge>
      </div>
    </button>
  );
}

function TravelBlock({ day, label }: { day: string; label: string }) {
  return (
    <div className="grid gap-3 rounded-lg border border-dashed bg-muted/45 p-3 sm:grid-cols-[88px_1fr]">
      <div className="rounded-md bg-background p-2 text-sm font-medium">{day}</div>
      <div>
        <div className="font-medium">{label}</div>
        <p className="text-sm text-muted-foreground">
          Travel timing is represented as a fixed block in this POC.
        </p>
      </div>
    </div>
  );
}

function OpenDayPlaceholder({ day }: { day: string }) {
  return (
    <div className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950 sm:grid-cols-[88px_1fr]">
      <div className="rounded-md bg-white/70 p-2 text-sm font-medium">{day}</div>
      <div>
        <div className="font-medium">Unfilled buffer day</div>
        <p className="text-sm">
          Keep as weather buffer, recovery, local scouting, or add another route after validation.
        </p>
      </div>
    </div>
  );
}

function RouteOptionCard({
  route,
  selected,
  onSelect,
}: {
  route: HubHikeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={cn(
        "grid gap-3 rounded-lg border bg-card p-4 text-left shadow-xs transition hover:border-primary/50",
        selected && "border-primary ring-2 ring-primary/15",
      )}
      onClick={onSelect}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{route.name}</h2>
            <Badge variant={difficultyVariant(route.difficulty)}>{route.difficulty}</Badge>
            <Badge variant={confidenceVariant(route.confidence)}>{route.confidence}</Badge>
          </div>
          <p className="text-sm leading-5 text-muted-foreground">{route.notes}</p>
        </div>
        <div className="grid size-14 place-items-center rounded-lg border bg-muted text-xl font-semibold">
          {route.quality}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <CompactMetric label="Days" value={String(route.durationDays)} />
        <CompactMetric label="Distance" value={route.distanceKm ? `${formatNumber(route.distanceKm, 1)} km` : "TBD"} />
        <CompactMetric label="Ascent" value={route.ascentM ? `${formatNumber(route.ascentM)} m` : "TBD"} />
        <CompactMetric label="Logistics" value={`${route.logisticsLoad}/100`} muted={route.logisticsLoad >= 70} />
        <CompactMetric label="Weather" value={`${route.weatherSensitivity}/100`} muted={route.weatherSensitivity >= 75} />
      </div>
    </button>
  );
}

function SelectedRoutePanel({
  route,
  hub,
}: {
  route?: HubHikeOption;
  hub: TrailHub;
}) {
  if (!route) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">No route selected</CardTitle>
          <CardDescription>Select a route option to inspect the planning details.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <HubVisual hub={hub} className="h-44 rounded-b-none rounded-t-lg" />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle className="text-xl">{route.name}</CardTitle>
            <CardDescription>
              {hub.region} · {route.start} to {route.end}
            </CardDescription>
          </div>
          <Badge variant={confidenceVariant(route.confidence)}>{route.confidence}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          <CompactMetric label="Quality" value={`${route.quality}/100`} />
          <CompactMetric label="Difficulty" value={route.difficulty} />
          <CompactMetric label="Duration" value={`${route.durationDays} day${route.durationDays === 1 ? "" : "s"}`} />
          <CompactMetric label="Hiking time" value={route.hikingHours ? `${formatNumber(route.hikingHours, 1)}h` : "TBD"} />
        </div>

        <div className="grid gap-3">
          <TimelineItem icon={Route} label="Route shape" text={route.routeType} />
          <TimelineItem icon={Shuffle} label="Transport dependency" text={route.transportNeed} />
          <TimelineItem icon={AlertTriangle} label="Planning note" text={route.notes} />
          <TimelineItem icon={Database} label="Source status" text={route.sourceStatus} />
        </div>

        <div className="grid gap-2">
          <div className="text-sm font-medium">Evidence to resolve</div>
          {route.evidence.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-md border bg-background p-2 text-sm">
              <CheckCircle2 className="size-4 text-primary" />
              {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HubOverviewCard({ hub }: { hub: TrailHub }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{hub.name}</CardTitle>
        <CardDescription>{hub.summary}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <CompactMetric label="Mountain" value={`${hub.profile.mountainQuality}/100`} />
          <CompactMetric label="Route density" value={`${hub.profile.routeDensity}/100`} />
          <CompactMetric label="Lodging" value={`${hub.profile.lodgingStrength}/100`} />
          <CompactMetric label="Season" value={hub.season.bestMonths} />
        </div>
        <TimelineItem icon={Plane} label="Airports" text={hub.logistics.nearestAirports.join(", ")} />
        <TimelineItem icon={Train} label="Trunk access" text={hub.logistics.trunkAccess.join("; ")} />
        <TimelineItem icon={BedDouble} label="Lodging options" text={hub.logistics.lodging.join("; ")} />
      </CardContent>
    </Card>
  );
}

function SourceConfidenceCard({
  hub,
  routeOptions,
}: {
  hub: TrailHub;
  routeOptions: HubHikeOption[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Source confidence</CardTitle>
        <CardDescription>
          Detailed planning exposes the weak links before route selection.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {hub.dataSignals.map((signal) => (
          <div key={`${signal.source}-${signal.label}`} className="flex items-start justify-between gap-3 rounded-md border bg-background p-3 text-sm">
            <span>{signal.label}</span>
            <Badge variant={confidenceVariant(signal.confidence)}>{signal.source}</Badge>
          </div>
        ))}
        <div className="rounded-lg border bg-muted/45 p-3 text-sm text-muted-foreground">
          {routeOptions.filter((route) => route.confidence === "Low").length} of{" "}
          {routeOptions.length} route options still have low-confidence route,
          logistics, or availability assumptions.
        </div>
      </CardContent>
    </Card>
  );
}

function HubVisual({ hub, className }: { hub: TrailHub; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md border bg-muted", className)}>
      <img src={backdropUrl} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(37,93,80,0.82),rgba(35,45,55,0.28)_48%,rgba(185,109,70,0.5))]" />
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <div className="text-xs font-medium uppercase tracking-normal text-white/75">
          {hub.country}
        </div>
        <div className="text-sm font-semibold leading-tight">{hub.region}</div>
      </div>
    </div>
  );
}

function MetricLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function CompactMetric({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-background p-2",
        muted && "border-amber-200 bg-amber-50",
      )}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof Route;
  label: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[32px_1fr] gap-3">
      <div className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="size-4" />
      </div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <p className="text-sm leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
