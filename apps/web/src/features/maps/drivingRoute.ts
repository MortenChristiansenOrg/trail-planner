export type DrivingRoute = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
  sourceUrl: string;
};

export const aalborgCoordinates: [number, number] = [9.922, 57.048];
export const southernDenmarkCoordinates: [number, number] = [9.535, 55.711];

const routeCache = new Map<string, DrivingRoute>();

export async function loadRoadRoute(points: [number, number][], signal?: AbortSignal): Promise<DrivingRoute> {
  const coordinates = points.map((point) => point.join(",")).join(";");
  const cached = routeCache.get(coordinates);
  if (cached) return cached;

  const sourceUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
  const response = await fetch(sourceUrl, { signal });
  if (!response.ok) throw new Error(`Routing request failed with ${response.status}`);
  const payload = await response.json() as {
    code: string;
    routes?: { distance?: number; duration?: number; geometry?: { coordinates?: [number, number][] } }[];
  };
  const route = payload.code === "Ok" ? payload.routes?.[0] : undefined;
  if (!route?.geometry?.coordinates?.length || !Number.isFinite(route.duration) || !Number.isFinite(route.distance)) {
    throw new Error("Routing response did not contain a usable road route");
  }
  const result = {
    coordinates: route.geometry.coordinates,
    distanceKm: Math.round((route.distance! / 1_000) * 10) / 10,
    durationMinutes: Math.round(route.duration! / 60),
    sourceUrl,
  };
  routeCache.set(coordinates, result);
  return result;
}

export function drivingRoutePoints(destination: [number, number], viaSouthernDenmark: boolean) {
  return [
    aalborgCoordinates,
    ...(viaSouthernDenmark ? [southernDenmarkCoordinates] : []),
    destination,
  ];
}
