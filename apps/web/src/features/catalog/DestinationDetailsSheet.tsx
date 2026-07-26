import { ArrowRight, BusFront, CarFront, Plane, Route } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CatalogMediaFigure } from "@/features/catalog/CatalogMediaFigure";
import { HikeDetails, HikeRouteIcon } from "@/features/catalog/HikeDetails";
import {
  formatHours,
  formatMoney,
  type Destination,
  type TravelEstimate,
  type TravelMode,
} from "@/features/catalog/catalog";
import {
  useCatalog,
  useCatalogDestination,
} from "@/features/catalog/CatalogProvider";
import { TravelOptionDetails } from "@/features/catalog/TravelOptionDetails";
import { travelEstimateTotal } from "@/features/preferences/personalizeTravel";

const travelModeLabels: Record<TravelMode, string> = {
  car: "Own car",
  train: "Train + bus",
  plane: "Airplane",
};

export function DestinationDetailsSheet({
  destination,
  participants,
  triggerLabel = "View area details",
  onPlan,
}: {
  destination: Destination;
  participants: number;
  triggerLabel?: string;
  onPlan?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const catalog = useCatalog();
  const detailedDestination =
    useCatalogDestination(destination.id, open, destination) ?? destination;
  const detailLoaded = catalog.details[destination.id] !== undefined;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button variant="outline">{triggerLabel}</Button></SheetTrigger>
      <SheetContent className="destination-sheet paper-sheet sm:max-w-xl" side="right">
        <SheetHeader>
          <p className="step-label">{detailedDestination.region}, {detailedDestination.country}</p>
          <SheetTitle>{detailedDestination.name}</SheetTitle>
          <SheetDescription>{detailedDestination.character}</SheetDescription>
        </SheetHeader>
        <div className="destination-sheet__body">
          <CatalogMediaFigure media={detailedDestination.media} sizes="(max-width: 640px) 90vw, 540px" />
          {detailedDestination.guide ? (
            <section className="destination-guide">
              <div><h3>Why go</h3><p>{detailedDestination.guide.highlights}</p></div>
              <div><h3>Mountains, nature and terrain</h3><p>{detailedDestination.guide.terrain}</p></div>
              <div><h3>What to expect</h3><p>{detailedDestination.guide.expectations}</p></div>
            </section>
          ) : <p className="route-loading" role="status">Loading the source-backed area guide…</p>}
          <section>
            <h3>Available travel</h3>
            <div className="detail-travel-list">
              {detailedDestination.travel.map((estimate) => (
                <div key={estimate.mode}>
                  {travelModeIcon(estimate.mode)}
                  <span><strong>{travelModeLabels[estimate.mode]}</strong><small>{estimate.note}</small></span>
                  <div className="detail-travel-actions">
                    <span>{travelSummary(estimate, participants)}</span>
                    {estimate.available && estimate.optionId ? <TravelOptionDetails estimate={estimate} optionId={estimate.optionId} /> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3>Hikes in the area</h3>
            {detailedDestination.hikes.length ? (
              <div className="route-preview-list">
                {detailedDestination.hikes.map((hike) => (
                  <article key={hike.id}>
                    <HikeRouteIcon routeType={hike.routeType} />
                    <HikeDetails hike={hike} showName />
                  </article>
                ))}
              </div>
            ) : open ? (
              <div className="routes-curating">
                <Route />
                <div>
                  <strong>{detailLoaded ? "No published hike choices" : "Loading hike choices"}</strong>
                  <p>{detailLoaded ? "This destination currently has no source-backed hikes in the active catalog." : "The catalog keeps route details outside the initial Explore list and loads them with this sheet."}</p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
        {onPlan ? (
          <SheetFooter>
            <SheetClose asChild>
              <Button onClick={onPlan}>Plan {detailedDestination.name} <ArrowRight /></Button>
            </SheetClose>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function travelSummary(estimate: TravelEstimate, participants: number) {
  if (!estimate.available) return "Unavailable";
  const layovers = estimate.mode === "plane"
    ? ` · ${estimate.layovers ?? 0} layover${estimate.layovers === 1 ? "" : "s"}`
    : "";
  return `${formatHours(estimate.oneWayHours)} · ${formatMoney(travelEstimateTotal(estimate, participants))}${layovers}`;
}

function travelModeIcon(mode: TravelMode) {
  return mode === "car" ? <CarFront /> : mode === "train" ? <BusFront /> : <Plane />;
}
