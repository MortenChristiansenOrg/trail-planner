import {
  ArrowLeftRight,
  CalendarRange,
  Clock3,
  Info,
  MapPin,
  RefreshCw,
  Route,
  Ruler,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { HikeRouteType } from "@trail-planner/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatHours, type Hike } from "@/features/catalog/catalog";

export function formatHikeRouteType(routeType: HikeRouteType) {
  if (routeType === "out-and-back") return "Out and back";
  if (routeType === "point-to-point") return "Point to point";
  if (routeType === "multi-day") return "Multi-day";
  return "Loop";
}

export function HikeRouteIcon({
  routeType,
}: {
  routeType: HikeRouteType;
}) {
  if (routeType === "loop") return <RefreshCw aria-label="Loop route" />;
  if (routeType === "out-and-back") {
    return <ArrowLeftRight aria-label="Out-and-back route" />;
  }
  if (routeType === "multi-day") {
    return <CalendarRange aria-label="Multi-day route" />;
  }
  return <Route aria-label="Point-to-point route" />;
}

export function formatHikeOption(hike: Hike) {
  const distance = hike.distanceKm === undefined
    ? "distance not published"
    : `${hike.distanceKm} km`;
  return `${hike.name} — ${distance} · ${formatHikeRouteType(hike.routeType)}`;
}

export function HikeDetails({
  hike,
  showName = false,
}: {
  hike: Hike;
  showName?: boolean;
}) {
  return (
    <div className="hike-details">
      {showName ? <strong>{hike.name}</strong> : null}
      <p>{hike.description}</p>
      <div className="hike-stats" aria-label={`${hike.name} statistics`}>
        <span>{hike.difficulty}</span>
        <span><Clock3 aria-hidden="true" /> {formatHours(hike.durationHours)}</span>
        <span><Ruler aria-hidden="true" /> {hike.distanceKm === undefined ? "Distance not published" : `${hike.distanceKm} km`}</span>
        <span><TrendingUp aria-hidden="true" /> {hike.ascentM === undefined ? "Ascent not published" : `${hike.ascentM} m`}</span>
        <span><TrendingDown aria-hidden="true" /> {hike.descentM === undefined ? "Descent not published" : `${hike.descentM} m`}</span>
        <span><HikeRouteIcon routeType={hike.routeType} /> {formatHikeRouteType(hike.routeType)}</span>
      </div>
      <div className="hike-access">
        <span><MapPin aria-hidden="true" /><span><small>Trailhead</small>{hike.trailhead}</span></span>
        {hike.accessCaveat ? <p>{hike.accessCaveat}</p> : null}
      </div>
    </div>
  );
}

export function HikeDetailsDialog({ hike }: { hike: Hike }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label={`View details for ${hike.name}`}
          size="icon"
          variant="ghost"
        >
          <Info />
        </Button>
      </DialogTrigger>
      <DialogContent className="hike-details-dialog">
        <DialogHeader>
          <DialogTitle>{hike.name}</DialogTitle>
          <DialogDescription>{formatHikeRouteType(hike.routeType)} hike details</DialogDescription>
        </DialogHeader>
        <HikeDetails hike={hike} />
      </DialogContent>
    </Dialog>
  );
}
