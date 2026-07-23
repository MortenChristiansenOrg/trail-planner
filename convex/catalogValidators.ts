import { v } from "convex/values";

export const catalogDataDomain = v.union(
  v.literal("destination-core"),
  v.literal("seasonality"),
  v.literal("access"),
  v.literal("hikes"),
  v.literal("hike-geometry"),
  v.literal("lodging"),
  v.literal("travel-road"),
  v.literal("travel-transit"),
  v.literal("travel-flight"),
  v.literal("media"),
);

export const coverageStatus = v.union(
  v.literal("missing"),
  v.literal("partial"),
  v.literal("fresh"),
  v.literal("stale"),
  v.literal("unavailable"),
);

export const confidence = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));
