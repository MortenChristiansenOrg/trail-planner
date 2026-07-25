import { useEffect, useState } from "react";
import { getCatalogCarPlan, getCatalogFerryPart } from "@/features/catalog/catalogTravelData";
import { loadCatalogRouteJourney } from "@/features/maps/catalogRoute";
import { drivingRoutePoints, loadRoadRoute } from "@/features/maps/drivingRoute";
import type { TrailLine } from "@/features/maps/TrailMap";

type ExploreRoute = { lines: TrailLine[]; label: string };

const routeCache = new Map<string, ExploreRoute>();
const emptyRoute: ExploreRoute = { lines: [], label: "" };

export function useDrivingRoute(destinationId?: string, destination?: [number, number], viaSouthernDenmark = false) {
  const key = destination ? `${destinationId ?? "unknown"}:${destination.join(",")}:${viaSouthernDenmark}` : "";
  const [result, setResult] = useState<{ key: string; route: ExploreRoute }>({
    key,
    route: routeCache.get(key) ?? emptyRoute,
  });

  useEffect(() => {
    if (!destination) return;
    const cached = routeCache.get(key);
    if (cached) {
      setResult({ key, route: cached });
      return;
    }

    const controller = new AbortController();
    const catalogPlan = destinationId ? getCatalogCarPlan(destinationId) : undefined;
    const request = catalogPlan && destinationId
      ? loadCatalogRouteJourney(destinationId, "outbound", controller.signal).then((parts): ExploreRoute => {
        const ferry = getCatalogFerryPart(destinationId);
        return {
          lines: parts.map(({ coordinates, part }, index) => ({
            id: `journey-${index}-${part.key}`,
            kind: "journey",
            coordinates,
            label: `${part.kind === "ferry" ? "Ferry" : "Drive"}: ${part.origin.name} to ${part.destination.name}`,
            styleMode: part.kind,
          })),
          label: ferry ? `${ferry.service} · arrive 1h before departure` : "Catalog driving route from Aalborg",
        };
      })
      : loadRoadRoute(drivingRoutePoints(destination, viaSouthernDenmark), controller.signal).then((route): ExploreRoute => ({
        lines: [{ id: "journey", kind: "journey", coordinates: route.coordinates, label: "OSRM driving route from Aalborg", styleMode: "car" }],
        label: "OSRM driving route from Aalborg",
      }));
    void request
      .then((route) => {
        routeCache.set(key, route);
        setResult({ key, route });
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResult({ key, route: emptyRoute });
        }
      });

    return () => controller.abort();
  }, [destination, destinationId, key, viaSouthernDenmark]);

  return result.key === key ? result.route : emptyRoute;
}
