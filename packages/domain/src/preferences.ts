export const powertrains = ["petrol", "diesel", "ev"] as const;
export type Powertrain = (typeof powertrains)[number];

export type HomeCity = {
  key: string;
  name: string;
  countryCode: "DK";
  municipality?: string;
  coordinates: [longitude: number, latitude: number];
};

export type ChargingPlan = {
  name: string;
  pricePerKwh: number;
};

export type VehicleProfile = {
  version: number;
  powertrain: Powertrain;
  consumptionPer100Km: number;
  energyPricePerUnit: number;
  costPerKmOverrideDkk?: number;
  chargingPlan?: ChargingPlan;
};

export type UserPreferences = {
  version: number;
  homeCity: HomeCity;
  vehicle: VehicleProfile;
};

export type CarCostComponent = {
  kind: "energy";
  label: string;
  amountDkk: number;
  estimated: boolean;
};

export type CarCostEstimate = {
  distanceKm: number;
  totalDkk: number;
  pricePerKmDkk: number;
  components: CarCostComponent[];
  assumptions: string[];
};

const legacyDanishCities: readonly HomeCity[] = [
  { key: "aalborg", name: "Aalborg", countryCode: "DK", coordinates: [9.9217, 57.0488] },
  { key: "aarhus", name: "Aarhus", countryCode: "DK", coordinates: [10.2039, 56.1629] },
  { key: "copenhagen", name: "Copenhagen", countryCode: "DK", coordinates: [12.5683, 55.6761] },
  { key: "esbjerg", name: "Esbjerg", countryCode: "DK", coordinates: [8.4594, 55.4765] },
  { key: "fredericia", name: "Fredericia", countryCode: "DK", coordinates: [9.7556, 55.5657] },
  { key: "herning", name: "Herning", countryCode: "DK", coordinates: [8.9738, 56.1393] },
  { key: "hillerod", name: "Hillerød", countryCode: "DK", coordinates: [12.3109, 55.9279] },
  { key: "horsens", name: "Horsens", countryCode: "DK", coordinates: [9.8503, 55.8607] },
  { key: "kolding", name: "Kolding", countryCode: "DK", coordinates: [9.4722, 55.4904] },
  { key: "naestved", name: "Næstved", countryCode: "DK", coordinates: [11.7609, 55.2299] },
  { key: "odense", name: "Odense", countryCode: "DK", coordinates: [10.4024, 55.4038] },
  { key: "randers", name: "Randers", countryCode: "DK", coordinates: [10.0364, 56.4607] },
  { key: "roskilde", name: "Roskilde", countryCode: "DK", coordinates: [12.0803, 55.6415] },
  { key: "silkeborg", name: "Silkeborg", countryCode: "DK", coordinates: [9.5451, 56.1697] },
  { key: "sonderborg", name: "Sønderborg", countryCode: "DK", coordinates: [9.7922, 54.9093] },
  { key: "vejle", name: "Vejle", countryCode: "DK", coordinates: [9.5357, 55.7113] },
] as const;

export const defaultVehicleProfile: VehicleProfile = {
  version: 1,
  powertrain: "ev",
  consumptionPer100Km: 20,
  energyPricePerUnit: 2.5,
};

export function getDanishCity(key: string) {
  return legacyDanishCities.find((city) => city.key === key);
}

export const defaultHomeCity = legacyDanishCities[0];

export function createDefaultPreferences(homeCity: HomeCity): UserPreferences {
  return {
    version: 1,
    homeCity,
    vehicle: { ...defaultVehicleProfile },
  };
}

export function energyUnit(powertrain: Powertrain) {
  return powertrain === "ev" ? "kWh" : "litres";
}

export function vehicleProfileKey(vehicle: VehicleProfile) {
  const chargingPlan =
    vehicle.powertrain === "ev" ? vehicle.chargingPlan : undefined;
  const chargingPrice = chargingPlan?.pricePerKwh ?? "none";
  const override = vehicle.costPerKmOverrideDkk ?? "none";
  return [
    `v${vehicle.version}`,
    vehicle.powertrain,
    vehicle.consumptionPer100Km,
    vehicle.energyPricePerUnit,
    chargingPrice,
    override,
  ].join("-");
}

export function preferenceCacheKey(preferences: UserPreferences) {
  return `${preferences.homeCity.key}:${vehicleProfileKey(preferences.vehicle)}`;
}

export function calculateCarCost(
  distanceKm: number,
  vehicle: VehicleProfile,
): CarCostEstimate {
  const chargingPlan =
    vehicle.powertrain === "ev" ? vehicle.chargingPlan : undefined;
  requireNonNegative(distanceKm, "distance");
  requirePositive(vehicle.consumptionPer100Km, "consumption");
  requireNonNegative(vehicle.energyPricePerUnit, "energy price");
  if (vehicle.costPerKmOverrideDkk !== undefined) {
    requireNonNegative(vehicle.costPerKmOverrideDkk, "cost-per-kilometre override");
  }
  if (chargingPlan) {
    requireNonNegative(chargingPlan.pricePerKwh, "charging-plan price");
  }

  const effectiveUnitPrice =
    chargingPlan
      ? chargingPlan.pricePerKwh
      : vehicle.energyPricePerUnit;
  const calculatedEnergy =
    (distanceKm * vehicle.consumptionPer100Km * effectiveUnitPrice) / 100;
  const energyAmount =
    vehicle.costPerKmOverrideDkk === undefined
      ? calculatedEnergy
      : distanceKm * vehicle.costPerKmOverrideDkk;
  const components: CarCostComponent[] = [
    {
      kind: "energy",
      label:
        vehicle.costPerKmOverrideDkk === undefined
          ? `${vehicle.powertrain === "ev" ? "Charging" : `${capitalize(vehicle.powertrain)} fuel`}`
          : "Vehicle running-cost override",
      amountDkk: roundMoney(energyAmount),
      estimated: vehicle.costPerKmOverrideDkk === undefined,
    },
  ];
  const totalDkk = roundMoney(
    components.reduce((total, component) => total + component.amountDkk, 0),
  );
  const assumptions = [
    `${roundValue(vehicle.consumptionPer100Km)} ${energyUnit(vehicle.powertrain)}/100 km`,
    vehicle.costPerKmOverrideDkk === undefined
      ? `${roundValue(effectiveUnitPrice)} DKK/${energyUnit(vehicle.powertrain)}${chargingPlan ? ` via ${chargingPlan.name}` : ""}`
      : `${roundValue(vehicle.costPerKmOverrideDkk)} DKK/km user override`,
  ];

  return {
    distanceKm: roundValue(distanceKm),
    totalDkk,
    pricePerKmDkk: distanceKm ? roundMoney(totalDkk / distanceKm) : 0,
    components,
    assumptions,
  };
}

function requireNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }
}

function requirePositive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
}

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const roundValue = (value: number) =>
  Math.round((value + Number.EPSILON) * 10) / 10;
const capitalize = (value: string) =>
  `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
