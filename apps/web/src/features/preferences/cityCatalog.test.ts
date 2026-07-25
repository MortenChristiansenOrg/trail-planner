import type { HomeCity } from "@trail-planner/domain";
import { describe, expect, test } from "vitest";
import { searchDanishCities } from "./cityCatalog";

const cities: HomeCity[] = [
  {
    key: "1",
    name: "København",
    municipality: "København",
    countryCode: "DK",
    coordinates: [12.5683, 55.6761],
  },
  {
    key: "2",
    name: "Nørre Åby",
    municipality: "Middelfart",
    countryCode: "DK",
    coordinates: [9.88, 55.46],
  },
  {
    key: "3",
    name: "Aarhus",
    municipality: "Aarhus",
    countryCode: "DK",
    coordinates: [10.2039, 56.1629],
  },
];

describe("Danish city search", () => {
  test("shows no cities until the user types", () => {
    expect(searchDanishCities(cities, "")).toEqual([]);
    expect(searchDanishCities(cities, "   ")).toEqual([]);
  });

  test("matches Danish names with keyboard-friendly spelling", () => {
    expect(searchDanishCities(cities, "koben").map(({ name }) => name)).toEqual([
      "København",
    ]);
    expect(searchDanishCities(cities, "norre a").map(({ name }) => name)).toEqual([
      "Nørre Åby",
    ]);
  });
});
