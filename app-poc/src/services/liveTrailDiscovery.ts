export type SourceRef = {
  label: string;
  url: string;
  retrievedAt: string;
};

export type CandidateTrail = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  articleUrl?: string;
  imageUrl?: string;
  sitelinks: number;
  lengthKm?: number;
  route?: {
    distanceKm: number;
    durationHours: number;
    osrmDurationHours: number;
    maxSpeedKmh: number;
    speedCapApplied: boolean;
  };
  weather?: {
    temperatureC?: number;
    precipitationMm?: number;
    windKmh?: number;
    observedAt?: string;
  };
  elevationM?: number;
  derived: {
    score: number;
    tripDays: number;
    estimatedCostDkk: number;
    confidence: "Low" | "Medium" | "High";
    fitLabel: string;
  };
  sources: {
    identity: SourceRef;
    routing?: SourceRef;
    weather?: SourceRef;
    elevation?: SourceRef;
  };
};

type WikidataBinding = {
  trail?: { value: string };
  trailLabel?: { value: string };
  coord?: { value: string };
  countryLabel?: { value: string };
  image?: { value: string };
  article?: { value: string };
  sitelinks?: { value: string };
  length?: { value: string };
};

type DiscoveryOptions = {
  evEfficiencyKwhPer100Km: number;
  electricityPriceDkkPerKwh: number;
  maxDrivingSpeedKmh: number;
};

const AALBORG = {
  latitude: 57.0488,
  longitude: 9.9217,
};

const WIKIDATA_SOURCE = "https://query.wikidata.org/sparql";
const OSRM_SOURCE = "https://router.project-osrm.org";

export async function discoverLiveTrails({
  evEfficiencyKwhPer100Km,
  electricityPriceDkkPerKwh,
  maxDrivingSpeedKmh,
}: DiscoveryOptions): Promise<CandidateTrail[]> {
  const retrievedAt = new Date().toISOString();
  const seedCandidates = await fetchWikidataTrailCandidates(retrievedAt);
  const uniqueCandidates = dedupeCandidates(seedCandidates).slice(0, 14);

  const enriched = await Promise.all(
    uniqueCandidates.map((candidate) =>
      enrichCandidate(
        candidate,
        {
          evEfficiencyKwhPer100Km,
          electricityPriceDkkPerKwh,
          maxDrivingSpeedKmh,
        },
        retrievedAt,
      ),
    ),
  );

  return enriched.sort((a, b) => b.derived.score - a.derived.score);
}

async function fetchWikidataTrailCandidates(
  retrievedAt: string,
): Promise<CandidateTrail[]> {
  const query = `
SELECT ?trail ?trailLabel ?coord ?countryLabel ?image ?article ?sitelinks ?length WHERE {
  VALUES ?country { wd:Q20 wd:Q34 wd:Q145 wd:Q38 wd:Q39 wd:Q40 wd:Q142 wd:Q183 wd:Q189 wd:Q55 wd:Q35 }
  ?trail wdt:P31/wdt:P279* wd:Q2143825;
         wdt:P625 ?coord;
         wdt:P17 ?country;
         wikibase:sitelinks ?sitelinks.
  OPTIONAL { ?trail wdt:P18 ?image. }
  OPTIONAL { ?trail wdt:P2043 ?length. }
  OPTIONAL {
    ?article schema:about ?trail;
             schema:isPartOf <https://en.wikipedia.org/>.
  }
  FILTER(?sitelinks >= 3)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 45`;

  const url = new URL(WIKIDATA_SOURCE);
  url.searchParams.set("format", "json");
  url.searchParams.set("query", query);

  const response = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    results?: { bindings?: WikidataBinding[] };
  };

  return (payload.results?.bindings ?? [])
    .map((binding) => mapWikidataBinding(binding, retrievedAt))
    .filter((candidate): candidate is CandidateTrail => candidate !== null);
}

function mapWikidataBinding(
  binding: WikidataBinding,
  retrievedAt: string,
): CandidateTrail | null {
  const id = binding.trail?.value;
  const name = binding.trailLabel?.value;
  const coord = binding.coord?.value;
  const country = binding.countryLabel?.value;

  if (!id || !name || !coord || !country) return null;

  const parsedPoint = parseWikidataPoint(coord);
  if (!parsedPoint) return null;

  const lengthKm = binding.length?.value
    ? Number.parseFloat(binding.length.value)
    : undefined;

  return {
    id,
    name,
    country,
    latitude: parsedPoint.latitude,
    longitude: parsedPoint.longitude,
    articleUrl: binding.article?.value,
    imageUrl: binding.image?.value,
    sitelinks: Number.parseInt(binding.sitelinks?.value ?? "0", 10),
    lengthKm: Number.isFinite(lengthKm) ? lengthKm : undefined,
    derived: {
      score: 0,
      tripDays: 0,
      estimatedCostDkk: 0,
      confidence: "Low",
      fitLabel: "Loading",
    },
    sources: {
      identity: {
        label: "Wikidata SPARQL",
        url: id,
        retrievedAt,
      },
    },
  };
}

function parseWikidataPoint(point: string) {
  const match = point.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
  if (!match) return null;

  return {
    longitude: Number.parseFloat(match[1]),
    latitude: Number.parseFloat(match[2]),
  };
}

function dedupeCandidates(candidates: CandidateTrail[]) {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    if (seen.has(candidate.id)) return false;
    seen.add(candidate.id);
    return true;
  });
}

async function enrichCandidate(
  candidate: CandidateTrail,
  evCostModel: {
    evEfficiencyKwhPer100Km: number;
    electricityPriceDkkPerKwh: number;
    maxDrivingSpeedKmh: number;
  },
  retrievedAt: string,
): Promise<CandidateTrail> {
  const [routeResult, weatherResult, elevationResult] = await Promise.allSettled([
    fetchOsrmRoute(candidate, evCostModel.maxDrivingSpeedKmh, retrievedAt),
    fetchOpenMeteoWeather(candidate, retrievedAt),
    fetchOpenMeteoElevation(candidate, retrievedAt),
  ]);

  const route = routeResult.status === "fulfilled" ? routeResult.value : undefined;
  const weather =
    weatherResult.status === "fulfilled" ? weatherResult.value : undefined;
  const elevation =
    elevationResult.status === "fulfilled" ? elevationResult.value : undefined;

  const derived = deriveRecommendation({
    candidate,
    route,
    elevationM: elevation?.elevationM,
    evCostModel,
  });

  return {
    ...candidate,
    route: route?.route,
    weather: weather?.weather,
    elevationM: elevation?.elevationM,
    derived,
    sources: {
      ...candidate.sources,
      routing: route?.source,
      weather: weather?.source,
      elevation: elevation?.source,
    },
  };
}

async function fetchOsrmRoute(
  candidate: CandidateTrail,
  maxDrivingSpeedKmh: number,
  retrievedAt: string,
) {
  const url = new URL(
    `/route/v1/driving/${AALBORG.longitude},${AALBORG.latitude};${candidate.longitude},${candidate.latitude}`,
    OSRM_SOURCE,
  );
  url.searchParams.set("overview", "false");
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("steps", "false");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`OSRM returned ${response.status}`);

  const payload = (await response.json()) as {
    code?: string;
    routes?: Array<{ distance: number; duration: number }>;
  };

  const route = payload.routes?.[0];
  if (payload.code !== "Ok" || !route) {
    throw new Error(`OSRM route failed for ${candidate.name}`);
  }

  const distanceKm = route.distance / 1000;
  const osrmDurationHours = route.duration / 3600;
  const cappedDurationHours = distanceKm / maxDrivingSpeedKmh;
  const durationHours = Math.max(osrmDurationHours, cappedDurationHours);

  return {
    route: {
      distanceKm,
      durationHours,
      osrmDurationHours,
      maxSpeedKmh: maxDrivingSpeedKmh,
      speedCapApplied: durationHours > osrmDurationHours,
    },
    source: {
      label: "OSRM public demo route API",
      url: url.toString(),
      retrievedAt,
    },
  };
}

async function fetchOpenMeteoWeather(
  candidate: CandidateTrail,
  retrievedAt: string,
) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(candidate.latitude));
  url.searchParams.set("longitude", String(candidate.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,precipitation,wind_speed_10m",
  );
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);

  const payload = (await response.json()) as {
    current?: {
      time?: string;
      temperature_2m?: number;
      precipitation?: number;
      wind_speed_10m?: number;
    };
  };

  return {
    weather: {
      temperatureC: payload.current?.temperature_2m,
      precipitationMm: payload.current?.precipitation,
      windKmh: payload.current?.wind_speed_10m,
      observedAt: payload.current?.time,
    },
    source: {
      label: "Open-Meteo forecast API",
      url: url.toString(),
      retrievedAt,
    },
  };
}

async function fetchOpenMeteoElevation(
  candidate: CandidateTrail,
  retrievedAt: string,
) {
  const url = new URL("https://api.open-meteo.com/v1/elevation");
  url.searchParams.set("latitude", String(candidate.latitude));
  url.searchParams.set("longitude", String(candidate.longitude));

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo elevation returned ${response.status}`);

  const payload = (await response.json()) as { elevation?: number[] };
  const elevationM = payload.elevation?.[0];
  if (typeof elevationM !== "number") {
    throw new Error(`Open-Meteo elevation missing for ${candidate.name}`);
  }

  return {
    elevationM,
    source: {
      label: "Open-Meteo elevation API",
      url: url.toString(),
      retrievedAt,
    },
  };
}

function deriveRecommendation({
  candidate,
  route,
  elevationM,
  evCostModel,
}: {
  candidate: CandidateTrail;
  route?: { route: { distanceKm: number; durationHours: number } };
  elevationM?: number;
  evCostModel: {
    evEfficiencyKwhPer100Km: number;
    electricityPriceDkkPerKwh: number;
  };
}): CandidateTrail["derived"] {
  const oneWayDistance = route?.route.distanceKm;
  const oneWayHours = route?.route.durationHours;
  const routeKnown = typeof oneWayDistance === "number" && typeof oneWayHours === "number";
  const roundTripDistance = routeKnown ? oneWayDistance * 2 : undefined;
  const travelHours = routeKnown ? oneWayHours * 2 : undefined;
  const hikingHours = estimateHikingHours(candidate.lengthKm, elevationM);
  const totalHours = (travelHours ?? estimateFallbackTravelHours(candidate)) + hikingHours;
  const tripDays = Math.max(2, Math.ceil((totalHours + 10) / 14));
  const costDistanceKm = roundTripDistance ?? estimateFallbackDistance(candidate);
  const electricityKwh =
    (costDistanceKm * evCostModel.evEfficiencyKwhPer100Km) / 100;
  const estimatedCostDkk = Math.round(
    (electricityKwh * evCostModel.electricityPriceDkkPerKwh) / 50,
  ) * 50;
  const prominence = Math.min(35, candidate.sitelinks * 1.4);
  const elevationScore = Math.min(30, Math.max(0, (elevationM ?? 0) / 55));
  const proximityScore = routeKnown
    ? Math.max(0, 25 - (oneWayHours ?? 0) * 0.8)
    : 8;
  const lengthScore = Math.min(10, (candidate.lengthKm ?? 20) / 8);
  const score = Math.round(prominence + elevationScore + proximityScore + lengthScore);
  const confidence: CandidateTrail["derived"]["confidence"] =
    routeKnown && typeof elevationM === "number"
      ? "High"
      : routeKnown || typeof elevationM === "number"
        ? "Medium"
        : "Low";

  return {
    score,
    tripDays,
    estimatedCostDkk,
    confidence,
    fitLabel: routeKnown ? "Live route estimate" : "Partial live estimate",
  };
}

function estimateHikingHours(lengthKm?: number, elevationM?: number) {
  const distanceHours = (lengthKm ?? 18) / 4;
  const elevationHours = Math.max(0, (elevationM ?? 500) / 600);
  return distanceHours + elevationHours;
}

function estimateFallbackTravelHours(candidate: CandidateTrail) {
  return (haversineKm(AALBORG, candidate) / 70) * 2;
}

function estimateFallbackDistance(candidate: CandidateTrail) {
  return haversineKm(AALBORG, candidate) * 2 * 1.25;
}

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const radiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
