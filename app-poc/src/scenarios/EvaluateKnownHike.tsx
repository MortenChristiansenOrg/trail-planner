import type { ComponentType } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Mountain,
  Route,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import backdropUrl from "@/assets/planning-map-backdrop.png";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EvidenceConfidence,
  TravelOption,
  evaluatedHike,
} from "@/data/hikeEvaluation";
import { cn } from "@/lib/utils";

const formatDkk = (value: number) =>
  new Intl.NumberFormat("da-DK", {
    maximumFractionDigits: 0,
  }).format(value);

const confidenceVariant = (confidence: EvidenceConfidence) => {
  if (confidence === "High") return "success";
  if (confidence === "Medium") return "warning";
  return "risk";
};

const complexityVariant = (complexity: TravelOption["complexity"]) => {
  if (complexity === "Low") return "success";
  if (complexity === "Medium") return "outline";
  if (complexity === "High") return "warning";
  return "risk";
};

export function EvaluateKnownHike() {
  const selectedOption =
    evaluatedHike.options.find((option) => option.selected) ??
    evaluatedHike.options[0];
  const totalCost = evaluatedHike.costs.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)_390px]">
      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="size-4" />
              Known hike evaluation
            </div>
            <CardTitle className="text-xl">{evaluatedHike.name}</CardTitle>
            <CardDescription>
              Full trip dossier from {evaluatedHike.origin} to {evaluatedHike.region}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <MetricLine icon={MapPin} label="Region" value={evaluatedHike.region} />
            <MetricLine icon={Route} label="Route type" value={evaluatedHike.route.routeType} />
            <MetricLine icon={Mountain} label="Difficulty" value={evaluatedHike.route.difficulty} />
            <MetricLine icon={CalendarDays} label="Season" value={evaluatedHike.route.season} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg border bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">
              {evaluatedHike.verdict}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SmallMetric label="Score" value={`${evaluatedHike.score}/100`} />
              <SmallMetric label="Mode" value={selectedOption.label} />
            </div>
          </CardContent>
        </Card>
      </aside>

      <main className="grid gap-4">
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="grid min-h-[330px] lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="relative min-h-[280px]">
              <img
                src={backdropUrl}
                alt="Topographic planning map with route markings"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/62 via-black/25 to-transparent" />
              <div className="absolute inset-x-10 bottom-8 hidden h-32 rounded-full border-4 border-white/75 md:block" />
              <div className="absolute bottom-20 left-[28%] hidden size-3 rounded-full bg-white shadow md:block" />
              <div className="absolute bottom-36 right-[26%] hidden size-3 rounded-full bg-white shadow md:block" />
              <div className="relative grid max-w-2xl gap-4 p-5 text-white sm:p-7">
                <Badge className="w-fit bg-white/90 text-stone-900 hover:bg-white/90">
                  Evaluate a hike POC
                </Badge>
                <div className="grid gap-2">
                  <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                    {evaluatedHike.name}, with the trip details exposed.
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-white/86">
                    The hike is fixed. The screen evaluates how to get there, how
                    many nights to reserve, what the trip is likely to cost, and
                    which assumptions still need manual confirmation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid content-between gap-4 border-t bg-card p-4 lg:border-l lg:border-t-0">
              <div className="grid gap-3">
                <MetricLine icon={Clock} label="Home to trail" value={evaluatedHike.summary.timeToTrail} />
                <MetricLine icon={CalendarDays} label="Trip length" value={evaluatedHike.summary.recommendedLength} />
                <MetricLine icon={Wallet} label="Estimate" value={`${formatDkk(evaluatedHike.summary.estimatedCostDkk)} DKK`} />
                <MetricLine icon={Mountain} label="Hike" value={`${evaluatedHike.route.distanceKm} km, ${formatDkk(evaluatedHike.route.ascentM)} m gain`} />
              </div>
              <div className="rounded-lg border bg-muted/45 p-3 text-sm leading-6 text-muted-foreground">
                This POC treats one known hike as a decision dossier instead of a
                ranked search result.
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="dossier" className="gap-4">
          <TabsList className="max-w-full flex-wrap justify-start h-auto">
            <TabsTrigger value="dossier">Dossier</TabsTrigger>
            <TabsTrigger value="modes">Mode compare</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>

          <TabsContent value="dossier" className="grid gap-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Recommended plan</CardTitle>
                    <CardDescription>
                      {selectedOption.summary}
                    </CardDescription>
                  </div>
                  <Badge variant="success">{selectedOption.verdict}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {evaluatedHike.plan.map((leg) => (
                  <PlanLegRow key={`${leg.when}-${leg.title}`} {...leg} />
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-3 md:grid-cols-4">
              {evaluatedHike.ratings.map((rating) => (
                <RatingCard key={rating.label} {...rating} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="modes" className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-3">
              {evaluatedHike.options.map((option) => (
                <TravelOptionCard key={option.id} option={option} />
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost build-up</CardTitle>
                <CardDescription>
                  Planning estimate for the recommended mode. Total: {formatDkk(totalCost)} DKK.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {evaluatedHike.costs.map((item) => (
                  <div key={item.label} className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{item.label}</div>
                      <Badge variant={confidenceVariant(item.confidence)}>
                        {item.confidence}
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      {formatDkk(item.value)} DKK
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Source confidence</CardTitle>
                <CardDescription>
                  The dossier shows the answer and the weak points at the same time.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {evaluatedHike.evidence.map((item) => (
                  <EvidenceRow key={item.label} {...item} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Route facts</CardTitle>
            <CardDescription>
              The hike itself is known; logistics decide whether it is feasible.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <MetricLine icon={Route} label="Distance" value={`${evaluatedHike.route.distanceKm} km`} />
            <MetricLine icon={Mountain} label="Ascent" value={`${formatDkk(evaluatedHike.route.ascentM)} m`} />
            <MetricLine icon={Clock} label="Hiking time" value={evaluatedHike.route.hikingHours} />
            <MetricLine icon={MapPin} label="Start" value={evaluatedHike.route.start} />
            <MetricLine icon={CheckCircle2} label="Finish" value={evaluatedHike.route.finish} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-700" />
              <CardTitle className="text-base">Decision notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {evaluatedHike.fragility.map((note) => (
              <div
                key={note}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
              >
                {note}
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function MetricLine({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-background px-3 py-2">
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        <span>{label}</span>
      </div>
      <span className="max-w-[58%] text-right font-medium">{value}</span>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function PlanLegRow({
  when,
  mode,
  title,
  detail,
  value,
  confidence,
}: (typeof evaluatedHike.plan)[number]) {
  return (
    <div className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-[92px_minmax(0,1fr)_auto]">
      <div className="text-sm font-medium text-muted-foreground">{when}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{mode}</Badge>
          <div className="font-medium">{title}</div>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
      <div className="flex items-start justify-between gap-2 sm:block sm:text-right">
        <div className="font-semibold">{value}</div>
        <Badge variant={confidenceVariant(confidence)} className="mt-0 sm:mt-2">
          {confidence}
        </Badge>
      </div>
    </div>
  );
}

function RatingCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{caption}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{value}/100</div>
    </div>
  );
}

function TravelOptionCard({ option }: { option: TravelOption }) {
  return (
    <Card className={cn(option.selected && "border-primary shadow-sm")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{option.label}</CardTitle>
            <CardDescription className="mt-1">{option.summary}</CardDescription>
          </div>
          {option.selected ? <Badge variant="success">Selected</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <MetricLine icon={CalendarDays} label="Trip days" value={`${option.totalTripDays}`} />
        <MetricLine icon={Clock} label="To trail" value={option.timeToTrail} />
        <MetricLine icon={Wallet} label="Estimate" value={`${formatDkk(option.estimatedCostDkk)} DKK`} />
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
          <span className="text-muted-foreground">Complexity</span>
          <Badge variant={complexityVariant(option.complexity)}>{option.complexity}</Badge>
        </div>
        <div className="rounded-lg border bg-muted/35 p-3 leading-6 text-muted-foreground">
          <span className="font-medium text-foreground">{option.verdict}:</span>{" "}
          {option.tradeoff}
        </div>
      </CardContent>
    </Card>
  );
}

function EvidenceRow({
  label,
  value,
  confidence,
  note,
}: (typeof evaluatedHike.evidence)[number]) {
  return (
    <div className="grid gap-2 rounded-lg border bg-background p-3 md:grid-cols-[220px_170px_minmax(0,1fr)] md:items-start">
      <div className="font-medium">{label}</div>
      <div className="flex items-center gap-2">
        <Badge variant={confidenceVariant(confidence)}>{confidence}</Badge>
        <span className="text-sm text-muted-foreground">{value}</span>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{note}</p>
    </div>
  );
}
