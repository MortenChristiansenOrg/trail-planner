import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

const homeCity = v.object({
  key: v.string(),
  name: v.string(),
  countryCode: v.literal("DK"),
  municipality: v.optional(v.string()),
  coordinates: v.array(v.number()),
});

const vehicle = v.object({
  version: v.number(),
  powertrain: v.union(
    v.literal("petrol"),
    v.literal("diesel"),
    v.literal("ev"),
  ),
  consumptionPer100Km: v.number(),
  energyPricePerUnit: v.number(),
  costPerKmOverrideDkk: v.optional(v.number()),
  chargingPlan: v.optional(
    v.object({
      name: v.string(),
      pricePerKwh: v.number(),
    }),
  ),
});

const legacyDanishCityByKey = new Map<
  string,
  readonly [name: string, longitude: number, latitude: number]
>([
  ["aalborg", ["Aalborg", 9.9217, 57.0488]],
  ["aarhus", ["Aarhus", 10.2039, 56.1629]],
  ["copenhagen", ["Copenhagen", 12.5683, 55.6761]],
  ["esbjerg", ["Esbjerg", 8.4594, 55.4765]],
  ["fredericia", ["Fredericia", 9.7556, 55.5657]],
  ["herning", ["Herning", 8.9738, 56.1393]],
  ["hillerod", ["Hillerød", 12.3109, 55.9279]],
  ["horsens", ["Horsens", 9.8503, 55.8607]],
  ["kolding", ["Kolding", 9.4722, 55.4904]],
  ["naestved", ["Næstved", 11.7609, 55.2299]],
  ["odense", ["Odense", 10.4024, 55.4038]],
  ["randers", ["Randers", 10.0364, 56.4607]],
  ["roskilde", ["Roskilde", 12.0803, 55.6415]],
  ["silkeborg", ["Silkeborg", 9.5451, 56.1697]],
  ["sonderborg", ["Sønderborg", 9.7922, 54.9093]],
  ["vejle", ["Vejle", 9.5357, 55.7113]],
]);
const officialPlaceId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}

async function currentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await requireIdentity(ctx);
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) =>
      q.eq("clerkUserId", identity.subject),
    )
    .unique();
}

async function ensureCurrentUser(ctx: MutationCtx) {
  const identity = await requireIdentity(ctx);
  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) =>
      q.eq("clerkUserId", identity.subject),
    )
    .unique();
  if (existing) return existing;

  const now = Date.now();
  const userId = await ctx.db.insert("users", {
    clerkUserId: identity.subject,
    displayName: identity.name ?? undefined,
    createdAt: now,
    updatedAt: now,
  });
  const created = await ctx.db.get(userId);
  if (!created) throw new Error("Unable to create user profile");
  return created;
}

function validatePreferenceNumbers(args: {
  version: number;
  homeCity: {
    key: string;
    name: string;
    municipality?: string;
    coordinates: number[];
  };
  vehicle: {
    version: number;
    powertrain: "petrol" | "diesel" | "ev";
    consumptionPer100Km: number;
    energyPricePerUnit: number;
    costPerKmOverrideDkk?: number;
    chargingPlan?: { name: string; pricePerKwh: number };
  };
}) {
  const positive = [args.version, args.vehicle.version, args.vehicle.consumptionPer100Km];
  const nonNegative = [
    args.vehicle.energyPricePerUnit,
    args.vehicle.costPerKmOverrideDkk,
    args.vehicle.chargingPlan?.pricePerKwh,
  ].filter((value): value is number => value !== undefined);
  if (positive.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("Preference versions and consumption must be positive");
  }
  if (nonNegative.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Preference prices and overrides must be non-negative");
  }
  if (
    args.homeCity.coordinates.length !== 2 ||
    !args.homeCity.coordinates.every(Number.isFinite)
  ) {
    throw new Error("Home-city coordinates must contain longitude and latitude");
  }
  const [longitude, latitude] = args.homeCity.coordinates;
  const isLegacyCity = legacyDanishCityByKey.has(args.homeCity.key);
  if (
    !args.homeCity.name.trim() ||
    args.homeCity.name.length > 100 ||
    (args.homeCity.municipality?.length ?? 0) > 100
  ) {
    throw new Error("Home city must have a valid name");
  }
  if (
    !isLegacyCity &&
    (!officialPlaceId.test(args.homeCity.key) ||
      longitude < 8 ||
      longitude > 15.2 ||
      latitude < 54.5 ||
      latitude > 57.8)
  ) {
    throw new Error("Home city must be in the official Danish city catalog");
  }
  if (
    args.vehicle.chargingPlan &&
    (args.vehicle.powertrain !== "ev" ||
      !args.vehicle.chargingPlan.name.trim())
  ) {
    throw new Error(
      "Charging plans require an electric vehicle and a non-blank name",
    );
  }
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) return null;
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();
    if (!preferences) return null;
    return {
      version: preferences.version,
      homeCity: preferences.homeCity,
      vehicle: {
        version: preferences.vehicle.version,
        powertrain: preferences.vehicle.powertrain,
        consumptionPer100Km: preferences.vehicle.consumptionPer100Km,
        energyPricePerUnit: preferences.vehicle.energyPricePerUnit,
        ...(preferences.vehicle.costPerKmOverrideDkk === undefined
          ? {}
          : {
              costPerKmOverrideDkk:
                preferences.vehicle.costPerKmOverrideDkk,
            }),
        ...(preferences.vehicle.chargingPlan === undefined
          ? {}
          : { chargingPlan: preferences.vehicle.chargingPlan }),
      },
    };
  },
});

export const upsert = mutation({
  args: {
    version: v.number(),
    homeCity,
    vehicle,
  },
  handler: async (ctx, args) => {
    validatePreferenceNumbers(args);
    const user = await ensureCurrentUser(ctx);
    const legacyCity = legacyDanishCityByKey.get(args.homeCity.key);
    const canonicalHomeCity = legacyCity
      ? {
          key: args.homeCity.key,
          name: legacyCity[0],
          countryCode: "DK" as const,
          coordinates: [legacyCity[1], legacyCity[2]],
        }
      : {
          key: args.homeCity.key,
          name: args.homeCity.name.trim(),
          countryCode: "DK" as const,
          municipality: args.homeCity.municipality?.trim() || undefined,
          coordinates: args.homeCity.coordinates,
        };
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        version: args.version,
        homeCity: canonicalHomeCity,
        vehicle: args.vehicle,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userPreferences", {
        ownerId: user._id,
        version: args.version,
        homeCity: canonicalHomeCity,
        vehicle: args.vehicle,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { ...args, homeCity: canonicalHomeCity };
  },
});
