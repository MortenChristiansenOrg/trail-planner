export type DrivingRoute = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
  durationBasis?: "provider" | "distance-estimate";
  sourceUrl: string;
};

export const aalborgCoordinates: [number, number] = [9.922, 57.048];
export const southernDenmarkCoordinates: [number, number] = [9.535, 55.711];

const routeCache = new Map<string, DrivingRoute>();
const fallbackAverageSpeedKph = 70;
const maximumEndpointSnapMeters = 1_000;

export type RoadRouteCandidate = {
  distance?: number;
  duration?: number;
  geometry?: { coordinates?: [number, number][] };
};

export function selectBestRoadRouteCandidate(candidates: RoadRouteCandidate[]) {
  const usable = candidates.filter((candidate) =>
    candidate.geometry?.coordinates?.length && Number.isFinite(candidate.distance) && (candidate.distance ?? 0) > 0,
  );
  const withDuration = usable.filter((candidate) => Number.isFinite(candidate.duration) && (candidate.duration ?? 0) > 0);
  const selected = (withDuration.length ? withDuration : usable).reduce<RoadRouteCandidate | undefined>((best, candidate) => {
    if (!best) return candidate;
    const candidateScore = withDuration.length ? candidate.duration! : candidate.distance!;
    const bestScore = withDuration.length ? best.duration! : best.distance!;
    return candidateScore < bestScore ? candidate : best;
  }, undefined);
  if (!selected) throw new Error("Routing response did not contain a usable road route");
  const durationSeconds = withDuration.length
    ? selected.duration!
    : (selected.distance! / 1_000 / fallbackAverageSpeedKph) * 3_600;
  return { candidate: selected, durationSeconds, durationBasis: withDuration.length ? "provider" as const : "distance-estimate" as const };
}

export function assertRoadEndpointSnaps(waypoints: { distance?: number }[] = []) {
  const excessiveSnap = waypoints.find(({ distance }) => Number.isFinite(distance) && distance! > maximumEndpointSnapMeters);
  if (excessiveSnap) {
    throw new Error(`Routing endpoint snapped ${Math.round(excessiveSnap.distance!)} m from the requested access node`);
  }
}

export async function loadRoadRoute(points: [number, number][], signal?: AbortSignal): Promise<DrivingRoute> {
  const coordinates = points.map((point) => point.join(",")).join(";");
  const cached = routeCache.get(coordinates);
  if (cached) return cached;

  const sourceUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&alternatives=3`;
  const response = await fetch(sourceUrl, { signal });
  if (!response.ok) throw new Error(`Routing request failed with ${response.status}`);
  const payload = await response.json() as {
    code: string;
    routes?: RoadRouteCandidate[];
    waypoints?: { distance?: number }[];
  };
  assertRoadEndpointSnaps(payload.waypoints);
  const { candidate: route, durationSeconds, durationBasis } = selectBestRoadRouteCandidate(payload.code === "Ok" ? payload.routes ?? [] : []);
  const result = {
    coordinates: route.geometry!.coordinates!,
    distanceKm: Math.round((route.distance! / 1_000) * 10) / 10,
    durationMinutes: Math.round(durationSeconds / 60),
    durationBasis,
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
