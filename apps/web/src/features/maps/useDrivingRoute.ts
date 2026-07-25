import { useEffect, useState } from "react";
import { getCatalogCarPlan, getCatalogFerryPart } from "@/features/catalog/catalogTravelData";
import { loadCatalogRouteJourney } from "@/features/maps/catalogRoute";
import { drivingRoutePoints, loadRoadRoute } from "@/features/maps/drivingRoute";
import type { TrailLine } from "@/features/maps/TrailMap";
import {
  preferenceCacheKey,
  type UserPreferences,
} from "@trail-planner/domain";

type ExploreRoute = { lines: TrailLine[]; label: string };

const routeCache = new Map<string, ExploreRoute>();
const emptyRoute: ExploreRoute = { lines: [], label: "" };

export function useDrivingRoute(
  destinationId: string | undefined,
  destination: [number, number] | undefined,
  viaSouthernDenmark: boolean,
  preferences: UserPreferences | null,
) {
  const origin = preferences?.homeCity;
  const originLongitude = origin?.coordinates[0];
  const originLatitude = origin?.coordinates[1];
  const originName = origin?.name;
  const useCatalogRoute = origin?.name === "Aalborg";
  const routeViaSouthernDenmark =
    useCatalogRoute && viaSouthernDenmark;
  const key = destination && preferences
    ? `${destinationId ?? "unknown"}:${destination.join(",")}:${routeViaSouthernDenmark}:${preferenceCacheKey(preferences)}`
    : "";
  const [result, setResult] = useState<{ key: string; route: ExploreRoute }>({
    key,
    route: routeCache.get(key) ?? emptyRoute,
  });

  useEffect(() => {
    if (
      !destination ||
      originLongitude === undefined ||
      originLatitude === undefined ||
      !originName
    ) return;
    const cached = routeCache.get(key);
    if (cached) {
      setResult((previous) =>
        previous.key === key && previous.route === cached
          ? previous
          : { key, route: cached },
      );
      return;
    }

    const controller = new AbortController();
    const catalogPlan =
      useCatalogRoute && destinationId
        ? getCatalogCarPlan(destinationId)
        : undefined;
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
          label: ferry ? `${ferry.service} · arrive 1h before departure` : `Catalog driving route from ${originName}`,
        };
      })
      : loadRoadRoute(drivingRoutePoints([originLongitude, originLatitude], destination, routeViaSouthernDenmark), controller.signal).then((route): ExploreRoute => ({
        lines: [{ id: "journey", kind: "journey", coordinates: route.coordinates, label: `OSRM driving route from ${originName}`, styleMode: "car" }],
        label: `OSRM driving route from ${originName}`,
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
  }, [
    destination,
    destinationId,
    key,
    originLatitude,
    originLongitude,
    originName,
    routeViaSouthernDenmark,
    useCatalogRoute,
  ]);

  return result.key === key ? result.route : emptyRoute;
}
