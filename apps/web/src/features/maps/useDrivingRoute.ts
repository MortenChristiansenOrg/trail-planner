import { useEffect, useState } from "react";

type Coordinates = [number, number][];

const origin: [number, number] = [9.922, 57.048];
const southboundWaypoint: [number, number] = [9.535, 55.711];
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
    const coordinates = [origin, ...(viaSouthernDenmark ? [southboundWaypoint] : []), destination]
      .map((point) => point.join(","))
      .join(";");
    void fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=simplified&geometries=geojson`,
      { signal: controller.signal },
    )
      .then((response) => {
        if (!response.ok) throw new Error(`Routing request failed with ${response.status}`);
        return response.json() as Promise<{
          code: string;
          routes?: { geometry?: { coordinates?: Coordinates } }[];
        }>;
      })
      .then((payload) => {
        const next = payload.code === "Ok" ? payload.routes?.[0]?.geometry?.coordinates : undefined;
        if (!next?.length) return;
        routeCache.set(key, next);
        setResult({ key, coordinates: next });
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
