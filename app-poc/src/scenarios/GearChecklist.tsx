import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Backpack,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  CloudRain,
  Filter,
  Flame,
  Home,
  Map,
  Mountain,
  ShieldCheck,
  Shirt,
  Tent,
  Utensils,
  WalletCards,
  Zap,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GearCategory, GearItem, GearTripMode, buildGearChecklist, estimatePackWeightKg } from "@/data/gearChecklist";
import { HubHikeOption, hubHikeOptions } from "@/data/hubPlanning";
import { cn } from "@/lib/utils";

const defaultRouteIds = ["besseggen", "knutshoe", "gjendesheim-local"];

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("da-DK", { maximumFractionDigits }).format(value);

const priorityVariant = (priority: GearItem["priority"]) => {
  if (priority === "required") return "risk";
  if (priority === "recommended") return "warning";
  return "outline";
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

const categoryIcons: Record<GearCategory, typeof Backpack> = {
  clothing: Shirt,
  navigation: Map,
  safety: ShieldCheck,
  "food-water": Utensils,
  sleep: BedDouble,
  shelter: Tent,
  cooking: Flame,
  documents: WalletCards,
  electronics: Zap,
};

export function GearChecklist() {
  const [mode, setMode] = useState<GearTripMode>("day-only");
  const [selectedRouteIds, setSelectedRouteIds] = useState(defaultRouteIds);
  const [expectedWet, setExpectedWet] = useState(true);
  const [expectedCold, setExpectedCold] = useState(false);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const selectedRoutes = useMemo(
    () => hubHikeOptions.filter((route) => selectedRouteIds.includes(route.id)),
    [selectedRouteIds],
  );
  const checklist = useMemo(
    () => buildGearChecklist({ mode, selectedRoutes, expectedWet, expectedCold }),
    [expectedCold, expectedWet, mode, selectedRoutes],
  );
  const groupedItems = useMemo(() => groupByCategory(checklist), [checklist]);
  const requiredCount = checklist.filter((item) => item.priority === "required").length;
  const checkedCount = checklist.filter((item) => checkedIds.includes(item.id)).length;
  const packWeightKg = estimatePackWeightKg(checklist);

  const toggleRoute = (routeId: string) => {
    setSelectedRouteIds((current) =>
      current.includes(routeId)
        ? current.filter((id) => id !== routeId)
        : [...current, routeId],
    );
  };

  const toggleChecked = (itemId: string) => {
    setCheckedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)_380px]">
      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="size-4" />
              Gear inputs
            </div>
            <CardTitle className="text-xl">Checklist generator</CardTitle>
            <CardDescription>
              Gear modules are included from the trip type and selected hike risks.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Trip type</div>
              <div className="grid gap-2">
                <ModeButton
                  active={mode === "day-only"}
                  icon={Home}
                  label="Day hikes only"
                  onClick={() => setMode("day-only")}
                />
                <ModeButton
                  active={mode === "hut-to-hut"}
                  icon={BedDouble}
                  label="Multi-day hut hike"
                  onClick={() => setMode("hut-to-hut")}
                />
                <ModeButton
                  active={mode === "tent"}
                  icon={Tent}
                  label="Multi-day tent hike"
                  onClick={() => setMode("tent")}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Conditions</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={expectedWet ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpectedWet((value) => !value)}
                >
                  <CloudRain className="size-4" />
                  Wet
                </Button>
                <Button
                  variant={expectedCold ? "default" : "outline"}
                  size="sm"
                  onClick={() => setExpectedCold((value) => !value)}
                >
                  <Mountain className="size-4" />
                  Cold
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Selected hikes</div>
              <div className="grid max-h-[360px] gap-2 overflow-auto pr-1">
                {hubHikeOptions.slice(0, 14).map((route) => (
                  <button
                    key={route.id}
                    className={cn(
                      "grid gap-1 rounded-md border bg-background p-2 text-left text-sm transition hover:border-primary/50",
                      selectedRouteIds.includes(route.id) && "border-primary ring-2 ring-primary/15",
                    )}
                    onClick={() => toggleRoute(route.id)}
                  >
                    <span className="font-medium">{route.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {route.durationDays} day{route.durationDays === 1 ? "" : "s"} · {route.difficulty} · {route.routeType}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>

      <main className="grid gap-4">
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="grid min-h-[300px] lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="relative min-h-[250px]">
              <img
                src={backdropUrl}
                alt="Topographic planning map with route markings"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/62 via-black/20 to-transparent" />
              <div className="relative grid max-w-2xl gap-4 p-5 text-white sm:p-7">
                <Badge className="w-fit bg-white/90 text-stone-900 hover:bg-white/90">
                  Gear POC
                </Badge>
                <div className="grid gap-2">
                  <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                    Generate gear from the hikes you picked.
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-white/86">
                    The checklist starts with mountain essentials, then adds
                    modules for long days, ridges, wet/cold exposure, hut systems,
                    or tent-based nights.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid content-between gap-4 border-t bg-card p-4 lg:border-l lg:border-t-0">
              <div className="grid gap-3">
                <MetricLine icon={Backpack} label="Checklist items" value={String(checklist.length)} />
                <MetricLine icon={ShieldCheck} label="Required" value={String(requiredCount)} />
                <MetricLine icon={CheckCircle2} label="Packed" value={`${checkedCount}/${checklist.length}`} />
                <MetricLine icon={CalendarDays} label="Selected hikes" value={String(selectedRoutes.length)} />
                <MetricLine icon={Backpack} label="Known weight" value={`${formatNumber(packWeightKg)} kg`} />
              </div>
              <div className="rounded-lg border bg-muted/45 p-3 text-sm text-muted-foreground">
                Weight is only a rough known-item subtotal. Food, water, worn
                clothing, and route-specific gear still need review.
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="checklist" className="gap-4">
          <TabsList>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="why">Why included</TabsTrigger>
            <TabsTrigger value="routes">Route risks</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="grid gap-4">
            {Object.entries(groupedItems).map(([category, items]) => (
              <GearCategoryCard
                key={category}
                category={category as GearCategory}
                items={items}
                checkedIds={checkedIds}
                onToggle={toggleChecked}
              />
            ))}
          </TabsContent>

          <TabsContent value="why" className="grid gap-3">
            {checklist.map((item) => (
              <Card key={item.id}>
                <CardContent className="grid gap-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{item.label}</div>
                    <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
                  </div>
                  <p className="text-sm leading-5 text-muted-foreground">{item.reason}</p>
                  <div className="text-xs text-muted-foreground">
                    Applies to: {item.appliesTo.join(", ")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="routes" className="grid gap-3">
            {selectedRoutes.map((route) => (
              <RouteRiskCard key={route.id} route={route} />
            ))}
          </TabsContent>
        </Tabs>
      </main>

      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Packing review</CardTitle>
            <CardDescription>
              Highest-impact checks before turning this into a real list.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ReviewItem
              icon={AlertTriangle}
              title="Conditions override defaults"
              text="The checklist cannot know actual snow, wind, river, hut, or fire restrictions yet."
            />
            <ReviewItem
              icon={ShieldCheck}
              title="Route confidence matters"
              text="Low-confidence route options should keep conservative safety and navigation gear."
            />
            <ReviewItem
              icon={Backpack}
              title="Mode changes the pack"
              text="Switching from day-only to hut or tent mode adds sleep, shelter, documents, and cooking modules."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected hike profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <CompactMetric label="Total route days" value={String(selectedRoutes.reduce((sum, route) => sum + route.durationDays, 0))} />
            <CompactMetric label="Max difficulty" value={maxDifficulty(selectedRoutes)} />
            <CompactMetric label="Max weather sensitivity" value={`${Math.max(0, ...selectedRoutes.map((route) => route.weatherSensitivity))}/100`} />
            <CompactMetric label="Overnight mode" value={mode} />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function groupByCategory(items: GearItem[]) {
  return items.reduce<Record<string, GearItem[]>>((groups, item) => {
    groups[item.category] = [...(groups[item.category] ?? []), item];
    return groups;
  }, {});
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Backpack;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button variant={active ? "default" : "outline"} size="sm" className="justify-start" onClick={onClick}>
      <Icon className="size-4" />
      {label}
    </Button>
  );
}

function GearCategoryCard({
  category,
  items,
  checkedIds,
  onToggle,
}: {
  category: GearCategory;
  items: GearItem[];
  checkedIds: string[];
  onToggle: (itemId: string) => void;
}) {
  const Icon = categoryIcons[category];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <CardTitle className="text-base">{categoryLabels[category]}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2">
        {items.map((item) => {
          const checked = checkedIds.includes(item.id);

          return (
            <button
              key={item.id}
              className={cn(
                "grid gap-2 rounded-md border bg-background p-3 text-left transition hover:border-primary/50 sm:grid-cols-[24px_1fr_auto]",
                checked && "border-primary bg-accent",
              )}
              onClick={() => onToggle(item.id)}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-5 place-items-center rounded border",
                  checked && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {checked ? <CheckCircle2 className="size-3.5" /> : null}
              </span>
              <span>
                <span className="block font-medium">{item.label}</span>
                <span className="text-sm text-muted-foreground">{item.reason}</span>
              </span>
              <span className="flex flex-wrap gap-2 sm:justify-end">
                <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
                {item.weightG ? <Badge variant="outline">{item.weightG} g</Badge> : null}
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RouteRiskCard({ route }: { route: HubHikeOption }) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-medium">{route.name}</div>
            <div className="text-sm text-muted-foreground">
              {route.durationDays} day{route.durationDays === 1 ? "" : "s"} · {route.routeType}
            </div>
          </div>
          <Badge variant={route.difficulty === "expert" || route.difficulty === "hard" ? "warning" : "outline"}>
            {route.difficulty}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <CompactMetric label="Distance" value={route.distanceKm ? `${route.distanceKm} km` : "TBD"} />
          <CompactMetric label="Ascent" value={route.ascentM ? `${route.ascentM} m` : "TBD"} />
          <CompactMetric label="Weather" value={`${route.weatherSensitivity}/100`} />
          <CompactMetric label="Logistics" value={`${route.logisticsLoad}/100`} />
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Backpack;
  title: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[32px_1fr] gap-3">
      <div className="grid size-8 place-items-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="size-4" />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <p className="text-sm leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function MetricLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Backpack;
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

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function maxDifficulty(routes: HubHikeOption[]) {
  const order = ["easy", "moderate", "hard", "expert"];
  return routes.reduce(
    (max, route) => (order.indexOf(route.difficulty) > order.indexOf(max) ? route.difficulty : max),
    "easy",
  );
}
