import { HubHikeOption } from "@/data/hubPlanning";

export type GearTripMode = "day-only" | "hut-to-hut" | "tent";
export type GearCategory =
  | "clothing"
  | "navigation"
  | "safety"
  | "food-water"
  | "sleep"
  | "shelter"
  | "cooking"
  | "documents"
  | "electronics";

export type GearItem = {
  id: string;
  label: string;
  category: GearCategory;
  priority: "required" | "recommended" | "optional";
  weightG?: number;
  reason: string;
  appliesTo: GearTripMode[];
};

export type GearContext = {
  mode: GearTripMode;
  selectedRoutes: HubHikeOption[];
  expectedWet: boolean;
  expectedCold: boolean;
};

const baseItems: GearItem[] = [
  {
    id: "shell-jacket",
    label: "Waterproof shell jacket",
    category: "clothing",
    priority: "required",
    weightG: 320,
    reason: "Baseline mountain weather protection.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
  {
    id: "insulation",
    label: "Warm insulation layer",
    category: "clothing",
    priority: "required",
    weightG: 360,
    reason: "Stops and exposed ridges can be cold even on day hikes.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
  {
    id: "map-offline",
    label: "Offline map and route file",
    category: "navigation",
    priority: "required",
    weightG: 0,
    reason: "Route geometry and local transfer assumptions are not yet fully validated.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
  {
    id: "power-bank",
    label: "Power bank and cable",
    category: "electronics",
    priority: "recommended",
    weightG: 190,
    reason: "Needed for navigation, booking references, and emergency margin.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
  {
    id: "first-aid",
    label: "First aid and blister kit",
    category: "safety",
    priority: "required",
    weightG: 180,
    reason: "Baseline safety kit for remote-feeling routes.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
  {
    id: "headlamp",
    label: "Headlamp",
    category: "safety",
    priority: "required",
    weightG: 90,
    reason: "Long hikes and transport delays can push return timing late.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
  {
    id: "water",
    label: "Water capacity",
    category: "food-water",
    priority: "required",
    weightG: 120,
    reason: "Carry capacity appropriate to stage length and refill uncertainty.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
  {
    id: "food",
    label: "Food plus emergency calories",
    category: "food-water",
    priority: "required",
    weightG: 500,
    reason: "The planner may include long day routes and remote transfers.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
];

const conditionalItems: GearItem[] = [
  {
    id: "trekking-poles",
    label: "Trekking poles",
    category: "safety",
    priority: "recommended",
    weightG: 460,
    reason: "Added for high-ascent routes or multi-day load management.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
  {
    id: "gloves-hat",
    label: "Gloves and warm hat",
    category: "clothing",
    priority: "recommended",
    weightG: 110,
    reason: "Added for cold, windy, ridge, or shoulder-season plans.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
  {
    id: "rain-pants",
    label: "Waterproof trousers",
    category: "clothing",
    priority: "recommended",
    weightG: 240,
    reason: "Added for wet forecast or multi-day exposure.",
    appliesTo: ["day-only", "hut-to-hut", "tent"],
  },
  {
    id: "hut-liner",
    label: "Hut sleeping liner",
    category: "sleep",
    priority: "required",
    weightG: 240,
    reason: "Required or expected in many hut systems.",
    appliesTo: ["hut-to-hut"],
  },
  {
    id: "hut-booking",
    label: "Hut booking confirmation",
    category: "documents",
    priority: "required",
    reason: "Hut plans should be gated by reservation evidence.",
    appliesTo: ["hut-to-hut"],
  },
  {
    id: "earplugs",
    label: "Earplugs",
    category: "sleep",
    priority: "optional",
    weightG: 5,
    reason: "Small comfort item for shared huts.",
    appliesTo: ["hut-to-hut"],
  },
  {
    id: "tent",
    label: "Tent with stakes and repair sleeve",
    category: "shelter",
    priority: "required",
    weightG: 1400,
    reason: "Tent-based route selected.",
    appliesTo: ["tent"],
  },
  {
    id: "sleeping-bag",
    label: "Sleeping bag rated for expected lows",
    category: "sleep",
    priority: "required",
    weightG: 900,
    reason: "Tent nights need a real sleep system matched to temperature.",
    appliesTo: ["tent"],
  },
  {
    id: "sleeping-pad",
    label: "Insulated sleeping pad",
    category: "sleep",
    priority: "required",
    weightG: 520,
    reason: "Ground insulation matters for mountain camps.",
    appliesTo: ["tent"],
  },
  {
    id: "stove",
    label: "Stove, fuel, lighter, and pot",
    category: "cooking",
    priority: "required",
    weightG: 560,
    reason: "Tent plan needs independent cooking unless resupply is proven.",
    appliesTo: ["tent"],
  },
  {
    id: "water-treatment",
    label: "Water filter or treatment",
    category: "food-water",
    priority: "recommended",
    weightG: 90,
    reason: "Added for tent or uncertain refill plans.",
    appliesTo: ["tent", "hut-to-hut"],
  },
  {
    id: "dry-bags",
    label: "Dry bags or pack liner",
    category: "shelter",
    priority: "recommended",
    weightG: 120,
    reason: "Added for wet or overnight plans.",
    appliesTo: ["hut-to-hut", "tent"],
  },
];

export function buildGearChecklist(context: GearContext) {
  const selectedIds = new Set<string>();
  const items: GearItem[] = [];
  const addItem = (item: GearItem) => {
    if (selectedIds.has(item.id)) return;
    selectedIds.add(item.id);
    items.push(item);
  };

  baseItems.forEach(addItem);
  conditionalItems
    .filter((item) => item.appliesTo.includes(context.mode))
    .forEach(addItem);

  const hasHardRoute = context.selectedRoutes.some(
    (route) => route.difficulty === "hard" || route.difficulty === "expert",
  );
  const hasLongDay = context.selectedRoutes.some(
    (route) => (route.hikingHours ?? 0) >= 7 || (route.distanceKm ?? 0) >= 18,
  );
  const hasHighAscent = context.selectedRoutes.some(
    (route) => (route.ascentM ?? 0) >= 900,
  );
  const hasWeatherExposure = context.selectedRoutes.some(
    (route) => route.weatherSensitivity >= 70,
  );

  if (hasHardRoute || hasHighAscent) {
    addItem(conditionalItems.find((item) => item.id === "trekking-poles")!);
  }
  if (hasWeatherExposure || context.expectedCold) {
    addItem(conditionalItems.find((item) => item.id === "gloves-hat")!);
  }
  if (context.expectedWet || context.mode !== "day-only") {
    addItem(conditionalItems.find((item) => item.id === "rain-pants")!);
  }
  if (hasLongDay) {
    addItem({
      id: "extra-battery",
      label: "Extra phone battery margin",
      category: "electronics",
      priority: "recommended",
      weightG: 120,
      reason: "Added for long days where navigation and delay margin matter.",
      appliesTo: ["day-only", "hut-to-hut", "tent"],
    });
  }

  return items.sort((a, b) => {
    const priorityOrder = { required: 0, recommended: 1, optional: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority] || a.category.localeCompare(b.category);
  });
}

export function estimatePackWeightKg(items: GearItem[]) {
  const grams = items.reduce((sum, item) => sum + (item.weightG ?? 0), 0);
  return grams / 1000;
}
