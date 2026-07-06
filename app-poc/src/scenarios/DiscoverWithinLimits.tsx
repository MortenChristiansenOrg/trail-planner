import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarDays,
  CloudSun,
  Database,
  ExternalLink,
  Filter,
  Loader2,
  Mountain,
  RefreshCw,
  Route,
  Ruler,
  ShieldCheck,
  ThermometerSun,
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
import {
  CandidateTrail,
  SourceRef,
  discoverLiveTrails,
} from "@/services/liveTrailDiscovery";
import { cn } from "@/lib/utils";

type SortMode = "fit" | "cost" | "speed" | "quality";

const EV_EFFICIENCY_KWH_PER_100_KM = 20;
const ELECTRICITY_PRICE_DKK_PER_KWH = 3;
const DEFAULT_MAX_DRIVING_SPEED_KMH = 100;

const formatDkk = (value: number) =>
  new Intl.NumberFormat("da-DK", {
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("da-DK", { maximumFractionDigits }).format(value);

const confidenceVariant = (confidence: CandidateTrail["derived"]["confidence"]) => {
  if (confidence === "High") return "success";
  if (confidence === "Medium") return "warning";
  return "risk";
};

export function DiscoverWithinLimits() {
  const [budget, setBudget] = useState(4500);
  const [days, setDays] = useState(4);
  const [extraDays, setExtraDays] = useState(4);
  const [maxDrivingSpeedKmh, setMaxDrivingSpeedKmh] = useState(
    DEFAULT_MAX_DRIVING_SPEED_KMH,
  );
  const [sortMode, setSortMode] = useState<SortMode>("fit");
  const [selectedId, setSelectedId] = useState<string>();
  const [trails, setTrails] = useState<CandidateTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(undefined);

    discoverLiveTrails({
      evEfficiencyKwhPer100Km: EV_EFFICIENCY_KWH_PER_100_KM,
      electricityPriceDkkPerKwh: ELECTRICITY_PRICE_DKK_PER_KWH,
      maxDrivingSpeedKmh,
    })
      .then((results) => {
        if (cancelled) return;
        setTrails(results);
        setSelectedId((current) => current ?? results[0]?.id);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Live discovery failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [maxDrivingSpeedKmh, refreshNonce]);

  const rankedTrails = useMemo(() => {
    const maxIncludedDays = days + extraDays;

    return trails.filter((trail) => trail.derived.tripDays <= maxIncludedDays).sort((a, b) => {
      if (sortMode === "cost") {
        return a.derived.estimatedCostDkk - b.derived.estimatedCostDkk;
      }
      if (sortMode === "speed") {
        return (a.route?.durationHours ?? 999) - (b.route?.durationHours ?? 999);
      }
      if (sortMode === "quality") return b.derived.score - a.derived.score;

      const fitScore = (trail: CandidateTrail) => {
        const budgetPenalty =
          Math.max(0, trail.derived.estimatedCostDkk - budget) / 90;
        const dayPenalty = Math.max(0, trail.derived.tripDays - days) * 8;
        return trail.derived.score - budgetPenalty - dayPenalty;
      };

      return fitScore(b) - fitScore(a);
    });
  }, [budget, days, extraDays, sortMode, trails]);

  const selectedTrail =
    rankedTrails.find((trail) => trail.id === selectedId) ?? rankedTrails[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)_380px]">
      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="size-4" />
              Discovery constraints
            </div>
            <CardTitle className="text-xl">Live trail discovery</CardTitle>
            <CardDescription>
              Candidate trails, coordinates, routing, weather, and elevation are
              fetched from public source APIs at runtime.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Wallet className="size-4" />
                  Cost limit
                </span>
                <span>{formatDkk(budget)} DKK</span>
              </div>
              <Slider
                value={[budget]}
                min={2500}
                max={10000}
                step={250}
                onValueChange={([value]) => setBudget(value)}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <CalendarDays className="size-4" />
                  Time limit
                </span>
                <span>{days} days</span>
              </div>
              <Slider
                value={[days]}
                min={2}
                max={10}
                step={1}
                onValueChange={([value]) => setDays(value)}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <CalendarDays className="size-4" />
                  Include up to
                </span>
                <span>{days + extraDays} days</span>
              </div>
              <Slider
                value={[extraDays]}
                min={0}
                max={14}
                step={1}
                onValueChange={([value]) => setExtraDays(value)}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Includes trails up to {extraDays} days past the configured time limit.
              </p>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Route className="size-4" />
                  Max drive speed
                </span>
                <span>{maxDrivingSpeedKmh} km/h</span>
              </div>
              <Slider
                value={[maxDrivingSpeedKmh]}
                min={70}
                max={130}
                step={5}
                onValueChange={([value]) => setMaxDrivingSpeedKmh(value)}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Drive time is at least route distance divided by this speed.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setRefreshNonce((value) => value + 1)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh live data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Runtime sources</CardTitle>
            <CardDescription>
              No candidate trail records are embedded in the app bundle.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <SourcePill label="Wikidata" value="Trail entities" />
            <SourcePill label="OSRM" value="Road route time" />
            <SourcePill label="Open-Meteo" value="Weather + elevation" />
            <SourcePill
              label="EV cost"
              value={`${EV_EFFICIENCY_KWH_PER_100_KM} kWh/100 km · ${ELECTRICITY_PRICE_DKK_PER_KWH} DKK/kWh`}
            />
            <SourcePill label="Speed cap" value={`${maxDrivingSpeedKmh} km/h max`} />
          </CardContent>
        </Card>
      </aside>

      <main className="grid gap-4">
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="grid min-h-[310px] lg:grid-cols-[minmax(0,1fr)_310px]">
            <div className="relative min-h-[260px]">
              <img
                src={backdropUrl}
                alt="Topographic planning map with route markings"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
              <div className="relative grid max-w-xl gap-4 p-5 text-white sm:p-7">
                <Badge className="w-fit bg-white/90 text-stone-900 hover:bg-white/90">
                  Live-source POC
                </Badge>
                <div className="grid gap-2">
                  <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                    Discover trails from actual source data.
                  </h1>
                  <p className="max-w-lg text-sm leading-6 text-white/86">
                    The POC requests trail candidates, coordinates, routing, weather,
                    and elevation when the screen loads, then ranks the resulting
                    records against your limits.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid content-between gap-4 border-t bg-card p-4 lg:border-l lg:border-t-0">
              <div className="grid gap-3">
                <MetricLine icon={Database} label="Loaded candidates" value={loading ? "Loading" : String(trails.length)} />
                <MetricLine icon={Filter} label="Within window" value={loading ? "Loading" : String(rankedTrails.length)} />
                <MetricLine icon={Wallet} label="Cost limit" value={`${formatDkk(budget)} DKK`} />
                <MetricLine icon={CalendarDays} label="Included time" value={`${days + extraDays} days`} />
                <MetricLine icon={Route} label="Max speed" value={`${maxDrivingSpeedKmh} km/h`} />
              </div>
              <div className="rounded-lg border bg-muted/45 p-3 text-sm text-muted-foreground">
                Routing uses the public OSRM demo service, so this is a functional
                POC rather than a production SLA.
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3 p-4 text-sm text-red-900">
              <AlertTriangle className="mt-0.5 size-4" />
              <div>
                <div className="font-medium">Live data request failed</div>
                <div>{error}</div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue="ranked" className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="ranked">Ranked</TabsTrigger>
              <TabsTrigger value="matrix">Matrix</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2">
              {(["fit", "cost", "speed", "quality"] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={sortMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortMode(mode)}
                >
                  <ArrowUpDown className="size-3.5" />
                  {mode}
                </Button>
              ))}
            </div>
          </div>

          <TabsContent value="ranked" className="grid gap-3">
            {loading ? <LoadingCards /> : null}
            {!loading && rankedTrails.length === 0 && !error ? (
              <EmptyState />
            ) : null}
            {rankedTrails.map((trail) => {
              const overBudget = trail.derived.estimatedCostDkk > budget;
              const overDays = trail.derived.tripDays > days;

              return (
                <button
                  key={trail.id}
                  className={cn(
                    "grid gap-3 rounded-lg border bg-card p-4 text-left shadow-xs transition hover:border-primary/50",
                    selectedTrail?.id === trail.id && "border-primary ring-2 ring-primary/15",
                  )}
                  onClick={() => setSelectedId(trail.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{trail.name}</h2>
                        <Badge variant={overBudget || overDays ? "warning" : "success"}>
                          {trail.derived.fitLabel}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {trail.country} · {formatNumber(trail.latitude, 2)},{" "}
                        {formatNumber(trail.longitude, 2)}
                      </p>
                    </div>
                    <div className="grid size-14 place-items-center rounded-lg border bg-muted text-xl font-semibold">
                      {trail.derived.score}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-4">
                    <CompactMetric label="EV charging" value={`${formatDkk(trail.derived.estimatedCostDkk)} DKK`} muted={overBudget} />
                    <CompactMetric label="Trip estimate" value={`${trail.derived.tripDays} days`} muted={overDays} />
                    <CompactMetric
                      label="Drive time"
                      value={trail.route ? `${formatNumber(trail.route.durationHours, 1)}h` : "No route"}
                      muted={trail.route?.speedCapApplied}
                    />
                    <CompactMetric label="Elevation" value={typeof trail.elevationM === "number" ? `${formatNumber(trail.elevationM)} m` : "Unknown"} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{trail.sitelinks} Wikidata sitelinks</Badge>
                    {trail.lengthKm ? (
                      <Badge variant="outline">{formatNumber(trail.lengthKm, 1)} km trail length</Badge>
                    ) : null}
                    <Badge variant={confidenceVariant(trail.derived.confidence)}>
                      {trail.derived.confidence} confidence
                    </Badge>
                  </div>
                </button>
              );
            })}
          </TabsContent>

          <TabsContent value="matrix">
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[840px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/60 text-left">
                      <th className="p-3 font-medium">Trail</th>
                      <th className="p-3 font-medium">Source popularity</th>
                      <th className="p-3 font-medium">Route distance</th>
                      <th className="p-3 font-medium">Cost fit</th>
                      <th className="p-3 font-medium">Time fit</th>
                      <th className="p-3 font-medium">Current weather</th>
                      <th className="p-3 font-medium">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedTrails.map((trail) => (
                      <tr key={trail.id} className="border-b last:border-b-0">
                        <td className="p-3 font-medium">{trail.name}</td>
                        <td className="p-3">{trail.sitelinks} sitelinks</td>
                        <td className="p-3">
                          {trail.route
                            ? `${formatNumber(trail.route.distanceKm)} km`
                            : "No OSRM route"}
                        </td>
                        <td className="p-3">
                          {trail.derived.estimatedCostDkk <= budget ? "Within limit" : "Over limit"}
                        </td>
                        <td className="p-3">
                          {trail.derived.tripDays <= days ? "Fits" : "Needs more days"}
                        </td>
                        <td className="p-3">
                          {trail.weather?.temperatureC !== undefined
                            ? `${formatNumber(trail.weather.temperatureC, 1)}°C, ${formatNumber(trail.weather.windKmh ?? 0)} km/h wind`
                            : "Unavailable"}
                        </td>
                        <td className="p-3">{trail.derived.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What is fetched live</CardTitle>
                <CardDescription>
                  Candidate records are loaded from public APIs. The app derives
                  ranking and estimated cost from those responses.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <EvidenceCard
                  icon={Database}
                  title="Trail candidates"
                  copy="Wikidata SPARQL query for hiking trail entities in nearby European countries, including coordinates, country, image, article, and sitelink count."
                />
                <EvidenceCard
                  icon={Route}
                  title="Reachability"
                  copy="OSRM public demo route API from Aalborg coordinates to each candidate coordinate. The POC keeps OSRM distance and applies the configured maximum driving speed as a conservative duration floor."
                />
                <EvidenceCard
                  icon={CloudSun}
                  title="Conditions"
                  copy="Open-Meteo forecast and elevation APIs provide current weather and point elevation at each candidate coordinate."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <aside className="grid content-start gap-4">
        {selectedTrail ? <SelectedTrailPanel trail={selectedTrail} /> : null}
      </aside>
    </div>
  );
}

function SelectedTrailPanel({ trail }: { trail: CandidateTrail }) {
  return (
    <Card>
      {trail.imageUrl ? (
        <img
          src={trail.imageUrl}
          alt=""
          className="h-44 w-full rounded-t-lg object-cover"
          loading="lazy"
        />
      ) : null}
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle className="text-xl">{trail.name}</CardTitle>
            <CardDescription>
              {trail.country} · {formatNumber(trail.latitude, 3)},{" "}
              {formatNumber(trail.longitude, 3)}
            </CardDescription>
          </div>
          <Badge variant={confidenceVariant(trail.derived.confidence)}>
            {trail.derived.confidence}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          <CompactMetric label="Score" value={`${trail.derived.score}/100`} />
          <CompactMetric label="Sitelinks" value={String(trail.sitelinks)} />
          <CompactMetric label="EV charging" value={`${formatDkk(trail.derived.estimatedCostDkk)} DKK`} />
          <CompactMetric label="Trip days" value={`${trail.derived.tripDays}`} />
        </div>

        <div className="grid gap-3">
          <TimelineItem
            icon={Route}
            label="Routing"
            text={
              trail.route
                ? `${formatNumber(trail.route.distanceKm)} km, ${formatNumber(trail.route.durationHours, 1)} hours one way from Aalborg.`
                : "OSRM did not return a route for this coordinate."
            }
          />
          {trail.route?.speedCapApplied ? (
            <TimelineItem
              icon={Route}
              label="Speed cap"
              text={`OSRM estimated ${formatNumber(trail.route.osrmDurationHours, 1)} hours. With a ${trail.route.maxSpeedKmh} km/h cap, the POC uses ${formatNumber(trail.route.durationHours, 1)} hours.`}
            />
          ) : null}
          <TimelineItem
            icon={Mountain}
            label="Terrain proxy"
            text={
              typeof trail.elevationM === "number"
                ? `Open-Meteo point elevation is ${formatNumber(trail.elevationM)} m.`
                : "Elevation source did not return a value."
            }
          />
          <TimelineItem
            icon={ThermometerSun}
            label="Current weather"
            text={
              trail.weather?.temperatureC !== undefined
                ? `${formatNumber(trail.weather.temperatureC, 1)}°C, ${formatNumber(trail.weather.precipitationMm ?? 0, 1)} mm precipitation, ${formatNumber(trail.weather.windKmh ?? 0)} km/h wind.`
                : "Open-Meteo weather did not return current conditions."
            }
          />
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4" />
            POC limitation
          </div>
          Coordinates can represent an article point, not a verified trailhead.
          Cost is derived from live OSRM distance and an electric car charging
          assumption of {EV_EFFICIENCY_KWH_PER_100_KM} kWh/100 km at{" "}
          {ELECTRICITY_PRICE_DKK_PER_KWH} DKK/kWh. Drive time uses OSRM unless
          route distance divided by the configured max speed is slower.
        </div>

        <div className="grid gap-2">
          <SourceLink source={trail.sources.identity} />
          {trail.sources.routing ? <SourceLink source={trail.sources.routing} /> : null}
          {trail.sources.weather ? <SourceLink source={trail.sources.weather} /> : null}
          {trail.sources.elevation ? <SourceLink source={trail.sources.elevation} /> : null}
          {trail.articleUrl ? (
            <Button variant="outline" asChild>
              <a href={trail.articleUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open article
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SourcePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-2">
      <span className="font-medium">{label}</span>
      <span className="text-right text-muted-foreground">{value}</span>
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
      <span className="font-semibold">{value}</span>
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

function EvidenceCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof ShieldCheck;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="mb-2 flex items-center gap-2 font-medium">
        <Icon className="size-4" />
        {title}
      </div>
      <p className="text-sm leading-5 text-muted-foreground">{copy}</p>
    </div>
  );
}

function SourceLink({ source }: { source: SourceRef }) {
  return (
    <Button variant="outline" asChild>
      <a href={source.url} target="_blank" rel="noreferrer">
        <ExternalLink className="size-4" />
        {source.label}
      </a>
    </Button>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border bg-card p-4 shadow-xs"
        >
          <div className="h-5 w-2/5 animate-pulse rounded bg-muted" />
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="h-14 animate-pulse rounded-md bg-muted" />
            <div className="h-14 animate-pulse rounded-md bg-muted" />
            <div className="h-14 animate-pulse rounded-md bg-muted" />
            <div className="h-14 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="grid gap-2 p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Ruler className="size-4" />
          No live candidates returned
        </div>
        No live candidates fit the active time window. Increase the extra-day
        allowance or refresh the source data.
      </CardContent>
    </Card>
  );
}
