import { useEffect, useState } from "react";
import { drivingRoutePoints, loadRoadRoute } from "@/features/maps/drivingRoute";

type Coordinates = [number, number][];

const routeCache = new Map<string, Coordinates>();

export function useDrivingRoute(destination?: [number, number], viaSouthernDenmark = false) {
  const key = destination ? `${destination.join(",")}:${viaSouthernDenmark}` : "";
  const [result, setResult] = useState<{ key: string; coordinates: Coordinates }>({
    key,
    coordinates: routeCache.get(key) ?? [],
  });

  useEffect(() => {
    if (!destination) return;
    const cached = routeCache.get(key);
    if (cached) {
      setResult({ key, coordinates: cached });
      return;
    }

    const controller = new AbortController();
    void loadRoadRoute(drivingRoutePoints(destination, viaSouthernDenmark), controller.signal)
      .then((route) => {
        routeCache.set(key, route.coordinates);
        setResult({ key, coordinates: route.coordinates });
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResult({ key, coordinates: [] });
        }
      });

    return () => controller.abort();
  }, [destination, key, viaSouthernDenmark]);

  return result.key === key ? result.coordinates : [];
}
