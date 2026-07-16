import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const money = v.object({
  amount: v.number(),
  currency: v.string(),
});

const provenanceClaim = v.object({
  sourceId: v.string(),
  sourceUrl: v.optional(v.string()),
  reviewedAt: v.string(),
  confidence: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  priceType: v.optional(
    v.union(
      v.literal("live"),
      v.literal("sampled"),
      v.literal("estimated"),
      v.literal("manual"),
      v.literal("unavailable"),
    ),
  ),
  attribution: v.optional(v.string()),
  refreshPolicy: v.optional(v.string()),
});

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    displayName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  destinations: defineTable({
    name: v.string(),
    countryCode: v.string(),
    region: v.string(),
    recommendedMonths: v.array(v.string()),
    visibility: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    provenance: v.array(provenanceClaim),
  })
    .index("by_country_visibility", ["countryCode", "visibility"])
    .index("by_region_visibility", ["region", "visibility"])
    .index("by_visibility", ["visibility"]),

  hikes: defineTable({
    destinationId: v.id("destinations"),
    name: v.string(),
    routeType: v.string(),
    expectedDurationDays: v.number(),
    distanceKm: v.optional(v.number()),
    elevationGainMeters: v.optional(v.number()),
    provenance: v.array(provenanceClaim),
  }).index("by_destination", ["destinationId"]),

  travelEstimates: defineTable({
    destinationId: v.id("destinations"),
    originKey: v.string(),
    month: v.string(),
    mode: v.string(),
    available: v.boolean(),
    durationHours: v.optional(v.number()),
    costPerPerson: v.optional(money),
    provenance: v.array(provenanceClaim),
  }).index("by_destination_origin_month_mode", [
    "destinationId",
    "originKey",
    "month",
    "mode",
  ]),

  trips: defineTable({
    ownerId: v.id("users"),
    destinationId: v.optional(v.id("destinations")),
    destinationKey: v.string(),
    plannedMonth: v.string(),
    selectedTravelMode: v.optional(v.string()),
    estimatedTotalCost: money,
    exploreSnapshotJson: v.string(),
    stateJson: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_planned_month", ["ownerId", "plannedMonth"])
    .index("by_destination", ["destinationId"])
    .index("by_destination_key", ["destinationKey"]),

  itineraryDays: defineTable({
    tripId: v.id("trips"),
    dayOrder: v.number(),
    calendarDate: v.optional(v.string()),
    title: v.optional(v.string()),
  }).index("by_trip_day_order", ["tripId", "dayOrder"]),

  itineraryActivities: defineTable({
    tripId: v.id("trips"),
    dayOrder: v.number(),
    groupId: v.string(),
    kind: v.union(v.literal("catalog-hike"), v.literal("custom-hike")),
    hikeId: v.optional(v.id("hikes")),
    catalogHikeKey: v.optional(v.string()),
    name: v.string(),
    description: v.string(),
    letter: v.string(),
    segment: v.number(),
    durationDays: v.number(),
  })
    .index("by_trip_day", ["tripId", "dayOrder"])
    .index("by_trip_group", ["tripId", "groupId"]),

  lodgingNights: defineTable({
    tripId: v.id("trips"),
    afterDayOrder: v.number(),
    name: v.string(),
    kind: v.string(),
    nightlyCost: v.optional(money),
  }).index("by_trip_after_day", ["tripId", "afterDayOrder"]),

  budgetItems: defineTable({
    tripId: v.id("trips"),
    label: v.string(),
    category: v.string(),
    cost: money,
  }).index("by_trip", ["tripId"]),

  shareLinks: defineTable({
    tripId: v.id("trips"),
    token: v.string(),
    status: v.union(v.literal("active"), v.literal("revoked")),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_token_status", ["token", "status"])
    .index("by_trip", ["tripId"]),

  files: defineTable({
    ownerId: v.id("users"),
    storageId: v.id("_storage"),
    kind: v.string(),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),
});
