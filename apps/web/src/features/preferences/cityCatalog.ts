import type { HomeCity } from "@trail-planner/domain";

type CityCatalogPayload = {
  source: string;
  retrievedAt: string;
  cities: Array<Omit<HomeCity, "countryCode">>;
};

let catalogPromise: Promise<HomeCity[]> | undefined;

export function loadDanishCities() {
  catalogPromise ??= fetch("/data/danish-cities.json")
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`City catalog returned ${response.status}`);
      }
      const payload = await response.json() as CityCatalogPayload;
      if (!Array.isArray(payload.cities) || payload.cities.length < 7_000) {
        throw new Error("City catalog is incomplete");
      }
      return payload.cities.map((city) => ({
        ...city,
        countryCode: "DK" as const,
      }));
    })
    .catch((error: unknown) => {
      catalogPromise = undefined;
      throw error;
    });
  return catalogPromise;
}

export function searchDanishCities(
  cities: HomeCity[],
  rawQuery: string,
  limit = 12,
) {
  const query = normalizeCityQuery(rawQuery);
  if (!query) return [];

  const startsWith: HomeCity[] = [];
  const wordStartsWith: HomeCity[] = [];
  const includes: HomeCity[] = [];
  for (const city of cities) {
    const name = normalizeSearchValue(city.name);
    const municipality = normalizeSearchValue(city.municipality ?? "");
    if (name.startsWith(query)) {
      startsWith.push(city);
    } else if (name.split(/\s+/).some((word) => word.startsWith(query))) {
      wordStartsWith.push(city);
    } else if (name.includes(query) || municipality.includes(query)) {
      includes.push(city);
    }
    if (
      startsWith.length >= limit &&
      wordStartsWith.length >= limit &&
      includes.length >= limit
    ) {
      break;
    }
  }
  return [...startsWith, ...wordStartsWith, ...includes].slice(0, limit);
}

export const normalizeCityQuery = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("da")
    .replaceAll("æ", "ae")
    .replaceAll("ø", "o")
    .replaceAll("å", "a")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const normalizeSearchValue = (value: string) => normalizeCityQuery(value);
