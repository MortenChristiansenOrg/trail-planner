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

const catalogDataDomain = v.union(
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

const confidence = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));

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

  sourceRegistry: defineTable({
    key: v.string(),
    name: v.string(),
    baseUrl: v.string(),
    kind: v.union(
      v.literal("official"),
      v.literal("open-data"),
      v.literal("provider"),
      v.literal("community"),
      v.literal("manual"),
    ),
    enabled: v.boolean(),
    defaultRefreshDays: v.optional(v.number()),
    termsUrl: v.optional(v.string()),
    attribution: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_enabled_kind", ["enabled", "kind"]),

  dataClaims: defineTable({
    destinationKey: v.string(),
    domain: catalogDataDomain,
    subjectKey: v.string(),
    field: v.string(),
    valueJson: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("superseded"),
    ),
    sourceKey: v.string(),
    sourceUrl: v.string(),
    retrievedAt: v.number(),
    observedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    confidence,
    runId: v.string(),
    notes: v.optional(v.string()),
  })
    .index("by_destination_domain_status", ["destinationKey", "domain", "status"])
    .index("by_source", ["sourceKey"])
    .index("by_run", ["runId"]),

  dataCoverage: defineTable({
    destinationKey: v.string(),
    domain: catalogDataDomain,
    status: v.union(
      v.literal("missing"),
      v.literal("partial"),
      v.literal("fresh"),
      v.literal("stale"),
      v.literal("unavailable"),
    ),
    claimCount: v.number(),
    assessedAt: v.number(),
    staleAt: v.optional(v.number()),
    reasons: v.array(v.string()),
    runId: v.optional(v.string()),
  })
    .index("by_destination_domain", ["destinationKey", "domain"])
    .index("by_status_stale_at", ["status", "staleAt"]),

  enrichmentJobs: defineTable({
    jobKey: v.string(),
    task: v.union(v.literal("add-destination"), v.literal("refresh-data")),
    destinationKey: v.optional(v.string()),
    domains: v.array(catalogDataDomain),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("needs-review"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    priority: v.number(),
    attempts: v.number(),
    maxAttempts: v.number(),
    requestedAt: v.number(),
    updatedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    cursor: v.optional(v.string()),
    runId: v.optional(v.string()),
    lastError: v.optional(v.string()),
  })
    .index("by_job_key", ["jobKey"])
    .index("by_status_priority", ["status", "priority"])
    .index("by_destination_status", ["destinationKey", "status"]),

  providerCache: defineTable({
    cacheKey: v.string(),
    provider: v.string(),
    sourceUrl: v.string(),
    responseJson: v.string(),
    fetchedAt: v.number(),
    expiresAt: v.number(),
    creditCost: v.optional(v.number()),
  })
    .index("by_cache_key", ["cacheKey"])
    .index("by_provider_expires_at", ["provider", "expiresAt"]),

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
