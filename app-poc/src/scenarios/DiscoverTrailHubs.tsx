import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  BedDouble,
  Bus,
  CalendarDays,
  Car,
  Database,
  ExternalLink,
  Filter,
  MapPin,
  Plane,
  Route,
  Ship,
  ShieldCheck,
  TentTree,
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
import { cn } from "@/lib/utils";
import { HubConfidence, TrailHub, trailHubs } from "@/data/trailHubs";

type SortMode = "fit" | "access" | "quality" | "lodging";
type TripStyle = "balanced" | "mountain" | "simple" | "multi-day";

const DEFAULT_BUDGET_DKK = 6500;
const DEFAULT_DAYS = 5;

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("da-DK", { maximumFractionDigits }).format(value);

const formatDkk = (value: number) =>
  new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 }).format(value);

const confidenceVariant = (confidence: HubConfidence) => {
  if (confidence === "High") return "success";
  if (confidence === "Medium") return "warning";
  return "risk";
};

export function DiscoverTrailHubs() {
  const [budget, setBudget] = useState(DEFAULT_BUDGET_DKK);
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [sortMode, setSortMode] = useState<SortMode>("fit");
  const [tripStyle, setTripStyle] = useState<TripStyle>("balanced");
  const [selectedId, setSelectedId] = useState(trailHubs[0]?.id);

  const rankedHubs = useMemo(() => {
    return trailHubs
      .map((hub) => ({
        hub,
        score: scoreHub(hub, { budget, days, tripStyle }),
        derived: deriveHubFit(hub, { budget, days }),
      }))
      .sort((a, b) => {
        if (sortMode === "access") return b.derived.accessScore - a.derived.accessScore;
        if (sortMode === "quality") return b.hub.profile.mountainQuality - a.hub.profile.mountainQuality;
        if (sortMode === "lodging") return b.hub.profile.lodgingStrength - a.hub.profile.lodgingStrength;
        return b.score - a.score;
      });
  }, [budget, days, sortMode, tripStyle]);

  const selected =
    rankedHubs.find(({ hub }) => hub.id === selectedId) ?? rankedHubs[0];

  const feasibleCount = rankedHubs.filter(({ derived }) => derived.timeFit !== "stretch").length;

  return (
    <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)_390px]">
      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="size-4" />
              Exploration constraints
            </div>
            <CardTitle className="text-xl">Trail hub discovery</CardTitle>
            <CardDescription>
              Pick a hiking base first, then fill the open days with routes from
              that area.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Wallet className="size-4" />
                  Trip budget
                </span>
                <span>{formatDkk(budget)} DKK</span>
              </div>
              <Slider
                value={[budget]}
                min={3000}
                max={16000}
                step={500}
                onValueChange={([value]) => setBudget(value)}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <CalendarDays className="size-4" />
                  Total trip length
                </span>
                <span>{days} days</span>
              </div>
              <Slider
                value={[days]}
                min={3}
                max={14}
                step={1}
                onValueChange={([value]) => setDays(value)}
              />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Trip shape</div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["balanced", "Balanced"],
                  ["mountain", "Mountain"],
                  ["simple", "Simple"],
                  ["multi-day", "Multi-day"],
                ] as const).map(([value, label]) => (
                  <Button
                    key={value}
                    variant={tripStyle === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTripStyle(value)}
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
            <CardTitle className="text-base">Hub signals</CardTitle>
            <CardDescription>
              Candidate bases are seeded manually and scored from reusable evidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <SourcePill label="Curated" value="Known route anchors" />
            <SourcePill label="OSM" value="Lodging, POIs, trailheads" />
            <SourcePill label="Entur" value="Norway trunk transit" />
            <SourcePill label="OurAirports" value="Airport candidates" />
          </CardContent>
        </Card>
      </aside>

      <main className="grid gap-4">
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="grid min-h-[300px] lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative min-h-[250px]">
              <img
                src={backdropUrl}
                alt="Topographic planning map with route markings"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
              <div className="relative grid max-w-2xl gap-4 p-5 text-white sm:p-7">
                <Badge className="w-fit bg-white/90 text-stone-900 hover:bg-white/90">
                  Hub-first POC
                </Badge>
                <div className="grid gap-2">
                  <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                    Find the mountain base before picking exact trails.
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-white/86">
                    This view ranks staging areas by access, lodging, route density,
                    mountain quality, and confidence. Individual hikes become the
                    second planning step.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid content-between gap-4 border-t bg-card p-4 lg:border-l lg:border-t-0">
              <div className="grid gap-3">
                <MetricLine icon={Database} label="Hub candidates" value={String(rankedHubs.length)} />
                <MetricLine icon={ShieldCheck} label="Practical matches" value={String(feasibleCount)} />
                <MetricLine icon={CalendarDays} label="Trip length" value={`${days} days`} />
                <MetricLine icon={Wallet} label="Budget" value={`${formatDkk(budget)} DKK`} />
                <MetricLine icon={TentTree} label="Route stage" value="After hub" />
              </div>
              <div className="rounded-lg border bg-muted/45 p-3 text-sm text-muted-foreground">
                Route data still matters, but it is scoped to the selected hub
                instead of driving the whole exploration result set.
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="ranked" className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="ranked">Ranked</TabsTrigger>
              <TabsTrigger value="matrix">Matrix</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2">
              {(["fit", "access", "quality", "lodging"] as const).map((mode) => (
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
            {rankedHubs.map(({ hub, score, derived }) => (
              <button
                key={hub.id}
                className={cn(
                  "grid gap-3 rounded-lg border bg-card p-4 text-left shadow-xs transition hover:border-primary/50",
                  selected?.hub.id === hub.id && "border-primary ring-2 ring-primary/15",
                )}
                onClick={() => setSelectedId(hub.id)}
              >
                <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto]">
                  <HubVisual hub={hub} className="h-24 sm:h-full" />
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{hub.name}</h2>
                      <Badge variant={derived.timeFit === "stretch" ? "warning" : "success"}>
                        {derived.fitLabel}
                      </Badge>
                      <Badge variant={confidenceVariant(hub.profile.confidence)}>
                        {hub.profile.confidence} confidence
                      </Badge>
                    </div>
                    <p className="text-sm leading-5 text-muted-foreground">
                      {hub.region}, {hub.country}. {hub.summary}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {hub.logistics.trunkAccess.slice(0, 2).map((access) => (
                        <Badge key={access} variant="outline">
                          {access}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid size-16 place-items-center rounded-lg border bg-muted text-xl font-semibold">
                    {score}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <CompactMetric label="Mountain" value={`${hub.profile.mountainQuality}/100`} />
                  <CompactMetric label="Routes" value={`${hub.profile.routeDensity}/100`} />
                  <CompactMetric label="Lodging" value={`${hub.profile.lodgingStrength}/100`} />
                  <CompactMetric label="Access" value={`${derived.accessScore}/100`} />
                  <CompactMetric label="Open days" value={`${derived.openHikingDays}`} muted={derived.openHikingDays < 2} />
                </div>
              </button>
            ))}
          </TabsContent>

          <TabsContent value="matrix">
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/60 text-left">
                      <th className="p-3 font-medium">Hub</th>
                      <th className="p-3 font-medium">Mountain</th>
                      <th className="p-3 font-medium">Routes</th>
                      <th className="p-3 font-medium">Lodging</th>
                      <th className="p-3 font-medium">Public transport</th>
                      <th className="p-3 font-medium">Season</th>
                      <th className="p-3 font-medium">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedHubs.map(({ hub }) => (
                      <tr key={hub.id} className="border-b last:border-b-0">
                        <td className="p-3 font-medium">{hub.name}</td>
                        <td className="p-3">{hub.profile.mountainQuality}</td>
                        <td className="p-3">{hub.profile.routeDensity}</td>
                        <td className="p-3">{hub.profile.lodgingStrength}</td>
                        <td className="p-3">{hub.profile.publicTransportFit}</td>
                        <td className="p-3">{hub.season.bestMonths}</td>
                        <td className="p-3">{hub.profile.confidence}</td>
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
                <CardTitle className="text-base">Data split</CardTitle>
                <CardDescription>
                  Hub discovery uses place-level evidence first. Route-level facts
                  are scoped to the selected hub.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <EvidenceCard
                  icon={MapPin}
                  title="Hub identity"
                  copy="Curated base areas with stable IDs, center coordinates, region, country, and source-backed route anchors."
                />
                <EvidenceCard
                  icon={BedDouble}
                  title="Stay viability"
                  copy="OSM lodging and amenity candidates indicate huts, campsites, town lodging, parking, ferries, and services."
                />
                <EvidenceCard
                  icon={Train}
                  title="Access"
                  copy="Entur, airports, road estimates, and local operator records separate trunk travel from last-mile mountain access."
                />
                <EvidenceCard
                  icon={Route}
                  title="Route filling"
                  copy="Curated routes, OSM hiking relations, and GPX imports become second-stage options for open non-travel days."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <aside className="grid content-start gap-4">
        {selected ? (
          <SelectedHubPanel
            hub={selected.hub}
            derived={selected.derived}
            score={selected.score}
          />
        ) : null}
      </aside>
    </div>
  );
}

function SelectedHubPanel({
  hub,
  derived,
  score,
}: {
  hub: TrailHub;
  derived: ReturnType<typeof deriveHubFit>;
  score: number;
}) {
  return (
    <Card>
      <HubVisual hub={hub} className="h-44 rounded-b-none rounded-t-lg" />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle className="text-xl">{hub.name}</CardTitle>
            <CardDescription>
              {hub.region}, {hub.country} · {formatNumber(hub.latitude, 3)},{" "}
              {formatNumber(hub.longitude, 3)}
            </CardDescription>
          </div>
          <Badge variant={confidenceVariant(hub.profile.confidence)}>
            {hub.profile.confidence}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-2">
          <CompactMetric label="Hub score" value={`${score}/100`} />
          <CompactMetric label="Open hiking days" value={String(derived.openHikingDays)} />
          <CompactMetric label="Access score" value={`${derived.accessScore}/100`} />
          <CompactMetric label="Best season" value={hub.season.bestMonths} />
        </div>

        <div className="grid gap-3">
          <TimelineItem icon={Plane} label="Airports" text={hub.logistics.nearestAirports.join(", ")} />
          <TimelineItem icon={Train} label="Trunk access" text={hub.logistics.trunkAccess.join("; ")} />
          <TimelineItem icon={Bus} label="Local access" text={hub.logistics.localAccess.join("; ")} />
          <TimelineItem icon={BedDouble} label="Stay options" text={hub.logistics.lodging.join("; ")} />
          {hub.logistics.driveHoursFromAalborg ? (
            <TimelineItem
              icon={Car}
              label="Drive proxy"
              text={`${formatNumber(hub.logistics.driveHoursFromAalborg, 1)} hours one way from Aalborg before local timing checks.`}
            />
          ) : null}
          <TimelineItem icon={Ship} label="Season caution" text={hub.season.caution} />
        </div>

        <div className="grid gap-2">
          <div className="text-sm font-medium">Route candidates after hub selection</div>
          {hub.routeCandidates.map((route) => (
            <div key={route.name} className="rounded-md border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{route.name}</div>
                <Badge variant={route.status === "curated seed" ? "success" : "outline"}>
                  {route.status}
                </Badge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {route.durationDays} day{route.durationDays === 1 ? "" : "s"} · {route.type}
              </div>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{route.note}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-2">
          <div className="text-sm font-medium">Evidence signals</div>
          {hub.dataSignals.map((signal) => (
            <div
              key={`${signal.source}-${signal.label}`}
              className="flex items-start justify-between gap-3 rounded-md border bg-background p-2 text-sm"
            >
              <span>{signal.label}</span>
              <Badge variant={confidenceVariant(signal.confidence)}>{signal.source}</Badge>
            </div>
          ))}
        </div>

        <Button variant="outline" asChild>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            OSM attribution basis
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function HubVisual({ hub, className }: { hub: TrailHub; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md border bg-muted", className)}>
      <img
        src={backdropUrl}
        alt=""
        className="absolute inset-0 size-full object-cover"
        loading="lazy"
      />
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

function scoreHub(
  hub: TrailHub,
  filters: { budget: number; days: number; tripStyle: TripStyle },
) {
  const derived = deriveHubFit(hub, filters);
  const weights = getStyleWeights(filters.tripStyle);
  const score =
    hub.profile.mountainQuality * weights.mountain +
    hub.profile.routeDensity * weights.routes +
    hub.profile.lodgingStrength * weights.lodging +
    hub.profile.publicTransportFit * weights.transit +
    hub.profile.seasonFit * weights.season +
    derived.accessScore * weights.access -
    hub.profile.accessComplexity * weights.complexityPenalty +
    derived.timePenalty +
    derived.budgetPenalty;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function deriveHubFit(hub: TrailHub, filters: { budget: number; days: number }) {
  const driveHours = hub.logistics.driveHoursFromAalborg;
  const longDrivePenalty = driveHours ? Math.max(0, driveHours - 11) * 3 : 10;
  const flightAccessBoost = hub.logistics.nearestAirports.length >= 2 ? 8 : 3;
  const accessScore = Math.max(
    0,
    Math.min(
      100,
      hub.profile.publicTransportFit + flightAccessBoost - longDrivePenalty,
    ),
  );
  const travelDays = driveHours && driveHours < 13 ? 2 : 3;
  const openHikingDays = Math.max(0, filters.days - travelDays);
  const minimumUsefulDays = hub.routeCandidates.some((route) => route.durationDays >= 3)
    ? 4
    : 3;
  const timeFit =
    openHikingDays >= minimumUsefulDays
      ? "good"
      : openHikingDays >= 2
        ? "tight"
        : "stretch";
  const fitLabel =
    timeFit === "good"
      ? "Good base fit"
      : timeFit === "tight"
        ? "Tight but workable"
        : "Needs more days";
  const estimatedMinimumBudget =
    3000 + hub.profile.accessComplexity * 45 + (driveHours ?? 10) * 95;
  const budgetPenalty = Math.min(18, Math.max(0, estimatedMinimumBudget - filters.budget) / 350);
  const timePenalty = timeFit === "stretch" ? -14 : timeFit === "tight" ? -5 : 0;

  return {
    accessScore: Math.round(accessScore),
    openHikingDays,
    timeFit,
    fitLabel,
    budgetPenalty: -budgetPenalty,
    timePenalty,
    estimatedMinimumBudget,
  };
}

function getStyleWeights(style: TripStyle) {
  if (style === "mountain") {
    return {
      mountain: 0.38,
      routes: 0.2,
      lodging: 0.1,
      transit: 0.07,
      season: 0.1,
      access: 0.18,
      complexityPenalty: 0.08,
    };
  }
  if (style === "simple") {
    return {
      mountain: 0.2,
      routes: 0.14,
      lodging: 0.18,
      transit: 0.18,
      season: 0.12,
      access: 0.28,
      complexityPenalty: 0.18,
    };
  }
  if (style === "multi-day") {
    return {
      mountain: 0.26,
      routes: 0.28,
      lodging: 0.2,
      transit: 0.1,
      season: 0.12,
      access: 0.16,
      complexityPenalty: 0.1,
    };
  }

  return {
    mountain: 0.28,
    routes: 0.2,
    lodging: 0.16,
    transit: 0.12,
    season: 0.12,
    access: 0.2,
    complexityPenalty: 0.1,
  };
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
