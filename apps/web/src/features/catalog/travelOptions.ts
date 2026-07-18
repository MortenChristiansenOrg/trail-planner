import type { TravelLegKind, TravelOptionSnapshot, TravelStage } from "@trail-planner/domain";

const places = {
  aalborg: { name: "Aalborg", coordinates: [9.922, 57.048] as [number, number] },
  aalborgStation: { name: "Aalborg Station", coordinates: [9.918, 57.043] as [number, number] },
  aalborgAirport: { name: "Aalborg Airport (AAL)", coordinates: [9.849, 57.093] as [number, number] },
  copenhagenAirport: { name: "Copenhagen Airport (CPH)", coordinates: [12.65, 55.618] as [number, number] },
  roedby: { name: "Rødby ferry terminal", coordinates: [11.35, 54.65] as [number, number] },
  puttgarden: { name: "Puttgarden ferry terminal", coordinates: [10.77, 54.5] as [number, number] },
  hamburg: { name: "Hamburg Hbf", coordinates: [10.006, 53.552] as [number, number] },
  munich: { name: "München Hbf", coordinates: [11.558, 48.14] as [number, number] },
  innsbruckAirport: { name: "Innsbruck Airport (INN)", coordinates: [11.344, 47.26] as [number, number] },
  innsbruck: { name: "Innsbruck", coordinates: [11.404, 47.269] as [number, number] },
  zurichAirport: { name: "Zurich Airport (ZRH)", coordinates: [8.555, 47.458] as [number, number] },
  zermatt: { name: "Zermatt", coordinates: [7.748, 46.02] as [number, number] },
};

function stage(
  id: string,
  kind: TravelLegKind,
  origin: TravelStage["origin"],
  destination: TravelStage["destination"],
  durationMinutes: number,
  details: Partial<TravelStage> = {},
): TravelStage {
  return {
    id,
    kind,
    origin,
    destination,
    durationMinutes,
    geometry: origin.coordinates && destination.coordinates ? [origin.coordinates, destination.coordinates] : undefined,
    confidence: "medium",
    costComponentIds: [],
    ...details,
  };
}

function option(
  id: string,
  label: string,
  outbound: TravelStage[],
  inbound: TravelStage[],
  costComponents: TravelOptionSnapshot["costComponents"],
  priceType: TravelOptionSnapshot["priceType"],
  assumptions: string[],
): TravelOptionSnapshot {
  return {
    id,
    label,
    priceType,
    pricingBasis: "per-person",
    outbound: { direction: "outbound", stages: outbound },
    return: { direction: "return", stages: inbound },
    costComponents,
    providerTotals: {
      durationMinutes: [...outbound, ...inbound].reduce((sum, item) => sum + item.durationMinutes, 0),
      cost: { amount: costComponents.reduce((sum, item) => sum + item.amount.amount, 0), currency: "DKK" },
    },
    warnings: ["Sample itinerary: confirm schedules, availability, and booking conditions for the actual travel date.", "Map lines connect catalog waypoints and are schematic, not turn-by-turn route geometry."],
    assumptions,
    retrievedAt: "2026-07-18T00:00:00Z",
    source: { provider: "MVP catalog sample" },
  };
}

export const innsbruckTravelOptions = {
  car: option(
    "innsbruck-car-sample",
    "Own car via Rødby–Puttgarden",
    [
      stage("car-out-1", "car", places.aalborg, places.roedby, 300, { costComponentIds: ["car-fuel"] }),
      stage("car-out-ferry", "ferry", places.roedby, places.puttgarden, 45, { operator: "Scandlines", service: "Rødby–Puttgarden", costComponentIds: ["car-crossings"] }),
      stage("car-out-2", "car", places.puttgarden, places.innsbruck, 465, { costComponentIds: ["car-fuel", "car-crossings"] }),
    ],
    [
      stage("car-home-1", "car", places.innsbruck, places.puttgarden, 480, { costComponentIds: ["car-fuel", "car-crossings"] }),
      stage("car-home-wait", "transfer", places.puttgarden, places.puttgarden, 30, { transferType: "wait" }),
      stage("car-home-ferry", "ferry", places.puttgarden, places.roedby, 45, { operator: "Scandlines", service: "Puttgarden–Rødby", costComponentIds: ["car-crossings"] }),
      stage("car-home-2", "car", places.roedby, places.aalborg, 300, { costComponentIds: ["car-fuel"] }),
    ],
    [
      { id: "car-fuel", label: "Fuel estimate", amount: { amount: 1_250, currency: "DKK" }, source: "Catalog estimate" },
      { id: "car-crossings", label: "Ferry, tolls, and road charges", amount: { amount: 700, currency: "DKK" }, source: "Catalog estimate" },
    ],
    "estimated",
    ["Return cost is expressed per traveller to match the Explore comparison.", "Driving stages exclude optional overnight stops."],
  ),
  train: option(
    "innsbruck-rail-sample",
    "Rail via Hamburg and Munich",
    [
      stage("rail-out-1", "rail", places.aalborgStation, places.hamburg, 360, { operator: "DSB / Deutsche Bahn", costComponentIds: ["rail-ticket"] }),
      stage("rail-out-wait", "transfer", places.hamburg, places.hamburg, 40, { transferType: "connection" }),
      stage("rail-out-2", "rail", places.hamburg, places.munich, 380, { operator: "Deutsche Bahn", costComponentIds: ["rail-ticket", "rail-reservation"] }),
      stage("rail-out-wait-2", "transfer", places.munich, places.munich, 30, { transferType: "connection" }),
      stage("rail-out-3", "rail", places.munich, places.innsbruck, 110, { operator: "ÖBB", costComponentIds: ["rail-ticket"] }),
    ],
    [
      stage("rail-home-1", "rail", places.innsbruck, places.munich, 105, { operator: "ÖBB", costComponentIds: ["rail-ticket"] }),
      stage("rail-home-wait", "transfer", places.munich, places.munich, 45, { transferType: "connection" }),
      stage("rail-home-2", "rail", places.munich, places.hamburg, 365, { operator: "Deutsche Bahn", costComponentIds: ["rail-ticket", "rail-reservation"] }),
      stage("rail-home-wait-2", "transfer", places.hamburg, places.hamburg, 55, { transferType: "connection" }),
      stage("rail-home-3", "rail", places.hamburg, places.aalborgStation, 378, { operator: "Deutsche Bahn / DSB", costComponentIds: ["rail-ticket"] }),
    ],
    [
      { id: "rail-ticket", label: "Return rail tickets", amount: { amount: 1_500, currency: "DKK" }, source: "Sampled catalog fare" },
      { id: "rail-reservation", label: "Seat reservations", amount: { amount: 250, currency: "DKK" }, source: "Catalog estimate" },
    ],
    "sampled",
    ["Services and transfer stations are representative, not date-specific.", "Local city transport is excluded because the rail station is in central Innsbruck."],
  ),
  plane: option(
    "innsbruck-flight-sample",
    "Flights via Copenhagen",
    [
      stage("flight-out-shuttle", "shuttle", places.aalborg, places.aalborgAirport, 20, { costComponentIds: ["flight-ground"] }),
      stage("flight-out-checkin", "transfer", places.aalborgAirport, places.aalborgAirport, 75, { transferType: "check-in" }),
      stage("flight-out-1", "flight", places.aalborgAirport, places.copenhagenAirport, 45, { departureTime: "2026-07-10T08:00:00Z", arrivalTime: "2026-07-10T08:45:00Z", operator: "SAS", service: "Sample SK domestic", confidence: "low", costComponentIds: ["flight-fare"] }),
      stage("flight-out-layover", "transfer", places.copenhagenAirport, places.copenhagenAirport, 55, { transferType: "layover", confidence: "low" }),
      stage("flight-out-2", "flight", places.copenhagenAirport, places.innsbruckAirport, 105, { departureTime: "2026-07-10T09:40:00Z", arrivalTime: "2026-07-10T11:25:00Z", operator: "SAS partner", service: "Sample connection", confidence: "low", costComponentIds: ["flight-fare"] }),
      stage("flight-out-ground", "shuttle", places.innsbruckAirport, places.innsbruck, 20, { costComponentIds: ["flight-ground"] }),
    ],
    [
      stage("flight-home-ground", "shuttle", places.innsbruck, places.innsbruckAirport, 20, { costComponentIds: ["flight-ground"] }),
      stage("flight-home-checkin", "transfer", places.innsbruckAirport, places.innsbruckAirport, 75, { transferType: "check-in" }),
      stage("flight-home-1", "flight", places.innsbruckAirport, places.copenhagenAirport, 110, { departureTime: "2026-07-15T15:00:00Z", arrivalTime: "2026-07-15T16:50:00Z", operator: "SAS partner", service: "Sample connection", confidence: "low", costComponentIds: ["flight-fare"] }),
      stage("flight-home-layover", "transfer", places.copenhagenAirport, places.copenhagenAirport, 80, { transferType: "layover", confidence: "low" }),
      stage("flight-home-2", "flight", places.copenhagenAirport, places.aalborgAirport, 45, { departureTime: "2026-07-15T18:10:00Z", arrivalTime: "2026-07-15T18:55:00Z", operator: "SAS", service: "Sample SK domestic", confidence: "low", costComponentIds: ["flight-fare"] }),
      stage("flight-home-shuttle", "shuttle", places.aalborgAirport, places.aalborg, 20, { costComponentIds: ["flight-ground"] }),
    ],
    [
      { id: "flight-fare", label: "Sampled return airfare", amount: { amount: 1_150, currency: "DKK" }, source: "Sample catalog fare" },
      { id: "flight-ground", label: "Airport ground transfers", amount: { amount: 300, currency: "DKK" }, source: "Catalog estimate" },
    ],
    "sampled",
    ["The connection illustrates the complete chain; it is not a live offer.", "Flight technical stops are separate from passenger layovers."],
  ),
} satisfies Record<"car" | "train" | "plane", TravelOptionSnapshot>;

export const zermattDirectFlightOption = option(
  "zermatt-flight-direct-sample",
  "Direct flight and rail to Zermatt",
  [
    stage("zermatt-out-shuttle", "shuttle", places.aalborg, places.aalborgAirport, 20, { costComponentIds: ["zermatt-ground"] }),
    stage("zermatt-out-checkin", "transfer", places.aalborgAirport, places.aalborgAirport, 75, { transferType: "check-in" }),
    stage("zermatt-out-flight", "flight", places.aalborgAirport, places.zurichAirport, 150, { departureTime: "2026-07-10T08:00:00Z", arrivalTime: "2026-07-10T10:30:00Z", operator: "Sample carrier", service: "Direct sample", confidence: "low", costComponentIds: ["zermatt-fare"] }),
    stage("zermatt-out-connection", "transfer", places.zurichAirport, places.zurichAirport, 35, { transferType: "connection", confidence: "low" }),
    stage("zermatt-out-rail", "rail", places.zurichAirport, places.zermatt, 210, { operator: "SBB / Matterhorn Gotthard Bahn", costComponentIds: ["zermatt-rail"] }),
  ],
  [
    stage("zermatt-home-rail", "rail", places.zermatt, places.zurichAirport, 215, { operator: "Matterhorn Gotthard Bahn / SBB", costComponentIds: ["zermatt-rail"] }),
    stage("zermatt-home-connection", "transfer", places.zurichAirport, places.zurichAirport, 45, { transferType: "connection", confidence: "low" }),
    stage("zermatt-home-flight", "flight", places.zurichAirport, places.aalborgAirport, 155, { departureTime: "2026-07-15T15:00:00Z", arrivalTime: "2026-07-15T17:35:00Z", operator: "Sample carrier", service: "Direct sample", confidence: "low", costComponentIds: ["zermatt-fare"] }),
    stage("zermatt-home-shuttle", "shuttle", places.aalborgAirport, places.aalborg, 20, { costComponentIds: ["zermatt-ground"] }),
  ],
  [
    { id: "zermatt-fare", label: "Sampled direct airfare", amount: { amount: 1_350, currency: "DKK" }, source: "Sample catalog fare" },
    { id: "zermatt-rail", label: "Zurich–Zermatt return rail", amount: { amount: 400, currency: "DKK" }, source: "Catalog estimate" },
    { id: "zermatt-ground", label: "Aalborg airport transfer", amount: { amount: 150, currency: "DKK" }, source: "Catalog estimate" },
  ],
  "sampled",
  ["The flight is a direct-flight UI sample rather than a live scheduled offer.", "Zermatt is car-free; the rail stage is part of the end-to-end option."],
);

export const travelOptionById = new Map(
  [...Object.values(innsbruckTravelOptions), zermattDirectFlightOption].map((travelOption) => [travelOption.id, travelOption]),
);
