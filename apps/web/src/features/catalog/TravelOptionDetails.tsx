import { deriveTravelOptionTotals, type Money, type TravelCostComponent, type TravelLegKind, type TravelOptionSnapshot, type TravelStage } from "@trail-planner/domain";
import { ArrowRight, BusFront, CarFront, CircleAlert, Clock3, Footprints, Plane, Ship, TrainFront, WalletCards, Waypoints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadTravelOption } from "@/features/catalog/travelOptionLoader";
import { TrailMap, type MapMarker, type TrailLine } from "@/features/maps/TrailMap";

const kindLabels: Record<TravelLegKind, string> = {
  walk: "Walk",
  car: "Drive",
  rail: "Rail",
  bus: "Bus",
  flight: "Flight",
  ferry: "Ferry",
  shuttle: "Shuttle",
  transfer: "Wait / transfer",
};

export function TravelOptionDetails({ option, optionId, label = "View stages" }: { option?: TravelOptionSnapshot; optionId?: string; label?: string }) {
  const [loaded, setLoaded] = useState<{ optionId: string; option: TravelOptionSnapshot }>();
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const requestRef = useRef(0);
  const optionValid = isValidTravelOption(option);
  const loadedOption = loaded && loaded.optionId === optionId ? loaded.option : undefined;
  const loadedValid = isValidTravelOption(loadedOption);
  const detail = optionValid ? option : loadedValid ? loadedOption : undefined;
  useEffect(() => {
    if (!open || optionValid || loadedValid || !optionId) return;
    const requestedOptionId = optionId;
    const requestId = ++requestRef.current;
    setLoading(true);
    setLoadFailed(false);
    void loadTravelOption(requestedOptionId).then((next) => {
      if (requestRef.current !== requestId) return;
      const valid = isValidTravelOption(next);
      setLoading(false);
      setLoaded(valid ? { optionId: requestedOptionId, option: next } : undefined);
      setLoadFailed(!valid);
    }).catch(() => {
      if (requestRef.current !== requestId) return;
      setLoading(false);
      setLoadFailed(true);
    });
    return () => {
      if (requestRef.current === requestId) requestRef.current += 1;
    };
  }, [loadedValid, open, optionId, optionValid]);
  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) return;
    requestRef.current += 1;
    setLoading(false);
  };
  return (
    <Dialog onOpenChange={changeOpen}>
      <DialogTrigger asChild><Button size="sm" variant="ghost"><Waypoints /> {label}</Button></DialogTrigger>
      <DialogContent className="travel-option-dialog">
        <DialogHeader>
          <DialogTitle>{detail?.label ?? "Travel stage details"}</DialogTitle>
          <DialogDescription>{detail ? "Complete outbound and return snapshot, including connections, assumptions, and component costs." : optionId ? "Loading the full option behind this Explore digest." : "Detailed stage data has not been loaded for this catalog estimate."}</DialogDescription>
        </DialogHeader>
        {detail ? <TravelOptionBody option={detail} /> : loading ? <div className="travel-detail-loading" role="status"><Clock3 /> Loading stages…</div> : <div className="travel-detail-unavailable"><CircleAlert /><div><strong>Stage detail not available</strong><p>{loadFailed ? "The detail record could not be loaded. The digest remains available." : "The aggregate duration and price remain visible, but no provider-backed leg sequence is stored. We do not invent intermediate stops."}</p></div></div>}
      </DialogContent>
    </Dialog>
  );
}

function isValidTravelOption(option?: TravelOptionSnapshot): option is TravelOptionSnapshot {
  if (!option) return false;
  try {
    deriveTravelOptionTotals(option);
    return true;
  } catch {
    return false;
  }
}

function TravelOptionBody({ option }: { option: TravelOptionSnapshot }) {
  const totals = deriveTravelOptionTotals(option);
  const stages = [...option.outbound.stages, ...option.return.stages];
  const costById = new Map(option.costComponents.map((component) => [component.id, component]));
  const markers = stageMarkers(stages);
  const lines: TrailLine[] = stages.flatMap((stage) => stage.geometry?.length && stage.kind !== "transfer" ? [{
    id: stage.id,
    label: `${kindLabels[stage.kind]}: ${stage.origin.name} to ${stage.destination.name}`,
    coordinates: stage.geometry,
    kind: "journey" as const,
    styleMode: stage.kind,
  }] : []);
  const providerDuration = option.providerTotals?.durationMinutes;
  const providerCost = option.providerTotals?.cost;
  const durationDifference = providerDuration === undefined ? undefined : totals.durationMinutes - providerDuration;
  const costDifference = providerCost === undefined ? undefined : totals.cost.amount - providerCost.amount;

  return (
    <div className="travel-option-body">
      <div className="travel-option-summary">
        <Badge variant="secondary">{option.priceType === "live" ? "Live, date-specific" : `${option.priceType[0].toUpperCase()}${option.priceType.slice(1)} plan`}</Badge>
        <span><Clock3 /><strong>{formatMinutes(totals.durationMinutes)}</strong><small>outbound + return</small></span>
        <span aria-label={`${totals.layovers} flight layover${totals.layovers === 1 ? "" : "s"}`}><Plane /><strong>{totals.layovers}</strong><small>flight layover{totals.layovers === 1 ? "" : "s"}</small></span>
        <span><WalletCards /><strong>{formatTravelMoney(totals.cost)}</strong><small>{option.pricingBasis === "per-person" ? "per traveller" : "per group"}</small></span>
      </div>
      {lines.length ? <div className="travel-option-map"><TrailMap lines={lines} markers={markers} mode="detail" /></div> : null}
      <Tabs defaultValue="outbound">
        <TabsList className="w-full"><TabsTrigger value="outbound">Outbound · {formatMinutes(sumDuration(option.outbound.stages))}</TabsTrigger><TabsTrigger value="return">Return · {formatMinutes(sumDuration(option.return.stages))}</TabsTrigger></TabsList>
        <TabsContent value="outbound"><StageTimeline costById={costById} stages={option.outbound.stages} /></TabsContent>
        <TabsContent value="return"><StageTimeline costById={costById} stages={option.return.stages} /></TabsContent>
      </Tabs>
      <section className="travel-cost-detail">
        <h3>Cost components</h3>
        {option.costComponents.map((component) => {
          const referenced = stages.filter((stage) => stage.costComponentIds.includes(component.id));
          return <p key={component.id}><span><strong>{component.label}</strong><small>{component.source} · used by {referenced.length} leg{referenced.length === 1 ? "" : "s"}</small></span><strong>{formatTravelMoney(component.amount)}</strong></p>;
        })}
        <p className="travel-reconciliation"><span>Derived total</span><strong>{formatTravelMoney(totals.cost)}</strong></p>
        <small>{providerCost ? `Provider total ${formatTravelMoney(providerCost)} · difference ${formatSignedMoney(costDifference ?? 0, providerCost.currency)}` : "Provider cost total not available for reconciliation."}</small>
        <small>{providerDuration === undefined ? "Provider duration total not available for reconciliation." : `Provider duration ${formatMinutes(providerDuration)} · difference ${formatSignedMinutes(durationDifference ?? 0)}`}</small>
      </section>
      <section className="travel-option-notes">
        <h3>Freshness and assumptions</h3>
        <p>Saved {new Date(option.retrievedAt).toLocaleString("en-DK")} · {option.source.url ? <a href={option.source.url} rel="noreferrer" target="_blank">{option.source.provider}</a> : option.source.provider}</p>
        {option.warnings.map((warning) => <p className="travel-warning" key={warning}><CircleAlert /> {warning}</p>)}
        <ul>{option.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul>
      </section>
    </div>
  );
}

function StageTimeline({ costById, stages }: { costById: Map<string, TravelCostComponent>; stages: TravelStage[] }) {
  return <ol className="travel-stage-timeline">{stages.map((stage) => (
    <li className={`travel-stage travel-stage--${stage.kind}`} key={stage.id}>
      <span className="travel-stage__icon">{kindIcon(stage.kind)}</span>
      <div>
        <span className="travel-stage__heading"><Badge variant="outline">{stage.transferType === "layover" ? "Flight layover" : kindLabels[stage.kind]}</Badge><strong>{formatMinutes(stage.durationMinutes)}</strong></span>
        <p><strong>{stage.origin.name}</strong><ArrowRight /><strong>{stage.destination.name}</strong></p>
        <small>{[stage.operator, stage.service, stage.confidence ? `${stage.confidence} confidence` : undefined].filter(Boolean).join(" · ") || "Operator not available"}</small>
        {stage.departureTime && stage.arrivalTime ? <small>{formatTime(stage.departureTime)}–{formatTime(stage.arrivalTime)}</small> : null}
        {stage.costComponentIds.length ? <small>Cost components: {stage.costComponentIds.map((id) => costById.get(id)?.label).filter(Boolean).join(", ")}</small> : null}
        {stage.technicalStops?.map((stop) => <small className="travel-technical-stop" key={stop}>{stop}</small>)}
        {stage.bookingUrl || stage.sourceUrl ? <small className="travel-stage-links">{stage.bookingUrl ? <a href={stage.bookingUrl} rel="noreferrer" target="_blank">Booking</a> : null}{stage.sourceUrl ? <a href={stage.sourceUrl} rel="noreferrer" target="_blank">Source</a> : null}</small> : null}
      </div>
    </li>
  ))}</ol>;
}

function stageMarkers(stages: TravelStage[]): MapMarker[] {
  const places = new Map<string, MapMarker>();
  for (const stage of stages) {
    for (const place of [stage.origin, stage.destination]) {
      if (place.coordinates && !places.has(place.name)) places.set(place.name, { id: `travel-place-${places.size}`, label: place.name, coordinates: place.coordinates });
    }
  }
  return Array.from(places.values());
}

function kindIcon(kind: TravelLegKind) {
  if (kind === "flight") return <Plane />;
  if (kind === "rail") return <TrainFront />;
  if (kind === "bus" || kind === "shuttle") return <BusFront />;
  if (kind === "car") return <CarFront />;
  if (kind === "ferry") return <Ship />;
  if (kind === "walk") return <Footprints />;
  return <Clock3 />;
}

const sumDuration = (stages: TravelStage[]) => stages.reduce((sum, stage) => sum + stage.durationMinutes, 0);
const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
const formatSignedMinutes = (minutes: number) => `${minutes > 0 ? "+" : ""}${minutes} min`;
const formatTravelMoney = ({ amount, currency }: Money) => new Intl.NumberFormat("en-DK", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
const formatSignedMoney = (amount: number, currency: Money["currency"]) => `${amount > 0 ? "+" : ""}${formatTravelMoney({ amount, currency })}`;
const formatTime = (value: string) => {
  const localClock = /T(\d{2}):(\d{2})/.exec(value);
  return localClock ? `${localClock[1]}.${localClock[2]}` : "Time unavailable";
};
