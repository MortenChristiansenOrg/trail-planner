import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("https://api.dataforsyningen.dk/steder");
sourceUrl.searchParams.set("hovedtype", "Bebyggelse");
sourceUrl.searchParams.set("undertype", "by");

const sourceTimeoutMs = 30_000;
let places;
try {
  const response = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(sourceTimeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Danish city source returned ${response.status}`);
  }
  places = await response.json();
} catch (error) {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    throw new Error(
      `Danish city source timed out after ${sourceTimeoutMs / 1_000} seconds`,
      { cause: error },
    );
  }
  throw error;
}

if (!Array.isArray(places) || places.length < 7_000) {
  throw new Error(`Expected a comprehensive city catalog, received ${places.length}`);
}

const cities = places.map((place) => {
  const coordinates = place.visueltcenter;
  if (
    typeof place.id !== "string" ||
    typeof place.primærtnavn !== "string" ||
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !coordinates.every(Number.isFinite)
  ) {
    throw new Error(`Invalid city record ${place.id ?? "without id"}`);
  }

  return {
    key: place.id,
    name: place.primærtnavn,
    municipality: place.kommuner?.map(({ navn }) => navn).join(" / ") || undefined,
    coordinates,
  };
}).toSorted((a, b) =>
  a.name.localeCompare(b.name, "da") ||
  (a.municipality ?? "").localeCompare(b.municipality ?? "", "da"),
);

const uniqueIds = new Set(cities.map(({ key }) => key));
if (uniqueIds.size !== cities.length) {
  throw new Error("Danish city source contains duplicate place ids");
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outputPath = resolve(
  repositoryRoot,
  "apps/web/public/data/danish-cities.json",
);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify({
    source: sourceUrl.toString(),
    retrievedAt: new Date().toISOString().slice(0, 10),
    cities,
  })}\n`,
);

console.log(`Wrote ${cities.length} Danish cities to ${outputPath}`);
