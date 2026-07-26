import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { catalogDataDomain, confidence, coverageStatus } from "./catalogValidators";

const money = v.object({
  amount: v.number(),
  currency: v.string(),
});

const provenanceClaim = v.object({
  sourceId: v.string(),
  sourceUrl: v.optional(v.string()),
  verifiedAt: v.string(),
  confidence,
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

const catalogConfidence = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));
const catalogProvenance = v.object({
  sourceKey: v.string(),
  sourceUrl: v.string(),
  verifiedAt: v.string(),
  confidence: catalogConfidence,
});
const catalogMedia = v.object({
  imageUrl: v.string(),
  // Optional only for retained pre-versioning rollback documents.
  // Every current generated artifact requires and writes this digest.
  assetSha256: v.optional(v.string()),
  width: v.number(),
  height: v.number(),
  alt: v.string(),
  subject: v.literal("destination"),
  kind: v.literal("terrain"),
  creator: v.string(),
  license: v.union(
    v.literal("CC BY 2.0"),
    v.literal("CC BY 3.0"),
    v.literal("CC BY-SA 2.0"),
    v.literal("CC BY-SA 2.5"),
    v.literal("CC BY-SA 3.0"),
    v.literal("CC BY-SA 4.0"),
    v.literal("CC0"),
    v.literal("Public domain"),
  ),
  licenseUrl: v.string(),
  attributionText: v.string(),
  attributionUrl: v.string(),
  sourceUrl: v.string(),
  verifiedAt: v.string(),
});
const catalogTravelEstimate = v.object({
  mode: v.union(v.literal("car"), v.literal("train"), v.literal("plane")),
  available: v.boolean(),
  accessNode: v.string(),
  oneWayHours: v.number(),
  costPerPersonDkk: v.number(),
  layovers: v.optional(v.number()),
  note: v.string(),
  confidence: catalogConfidence,
  optionId: v.optional(v.string()),
});
const catalogLodging = v.object({
  id: v.string(),
  name: v.string(),
  kind: v.union(v.literal("hut"), v.literal("camping")),
  nightlyCostDkk: v.number(),
});

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    displayName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  userPreferences: defineTable({
    ownerId: v.id("users"),
    version: v.number(),
    homeCity: v.object({
      key: v.string(),
      name: v.string(),
      countryCode: v.literal("DK"),
      municipality: v.optional(v.string()),
      coordinates: v.array(v.number()),
    }),
    vehicle: v.object({
      version: v.number(),
      powertrain: v.union(
        v.literal("petrol"),
        v.literal("diesel"),
        v.literal("ev"),
      ),
      consumptionPer100Km: v.number(),
      energyPricePerUnit: v.number(),
      costPerKmOverrideDkk: v.optional(v.number()),
      // Deprecated storage-only fields retained so existing preference
      // documents remain valid. New writes replace the vehicle without them.
      tollsDkk: v.optional(v.number()),
      ferriesDkk: v.optional(v.number()),
      parkingDkk: v.optional(v.number()),
      chargingPlan: v.optional(
        v.object({
          name: v.string(),
          pricePerKwh: v.number(),
        }),
      ),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  destinations: defineTable({
    name: v.string(),
    countryCode: v.string(),
    region: v.string(),
    recommendedMonths: v.array(v.string()),
    visibility: v.union(v.literal("published"), v.literal("archived")),
    provenance: v.array(provenanceClaim),
  })
    .index("by_country_visibility", ["countryCode", "visibility"])
    .index("by_region_visibility", ["region", "visibility"])
    .index("by_visibility", ["visibility"]),

  catalogVersions: defineTable({
    catalogVersion: v.string(),
    artifactHash: v.optional(v.string()),
    status: v.union(v.literal("staging"), v.literal("active"), v.literal("retained")),
    expectedDestinations: v.number(),
    expectedHikes: v.number(),
    expectedCoverage: v.optional(v.number()),
    createdAt: v.number(),
    validatedAt: v.optional(v.number()),
    activatedAt: v.optional(v.number()),
  }).index("by_version", ["catalogVersion"]),

  catalogState: defineTable({
    key: v.literal("active"),
    catalogVersion: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  catalogDestinations: defineTable({
    catalogVersion: v.string(),
    destinationKey: v.string(),
    aliases: v.array(v.string()),
    name: v.string(),
    region: v.string(),
    country: v.string(),
    countryCode: v.string(),
    longitude: v.number(),
    latitude: v.number(),
    recommendedMonths: v.array(v.number()),
    summary: v.string(),
    character: v.string(),
    guideHighlights: v.string(),
    guideTerrain: v.string(),
    guideExpectations: v.string(),
    hero: catalogMedia,
    hikeCount: v.number(),
    travel: v.array(catalogTravelEstimate),
    lodgings: v.array(catalogLodging),
    provenance: v.array(catalogProvenance),
  })
    .index("by_version_key", ["catalogVersion", "destinationKey"])
    .index("by_version", ["catalogVersion"]),

  catalogDestinationAliases: defineTable({
    catalogVersion: v.string(),
    alias: v.string(),
    destinationKey: v.string(),
  })
    .index("by_version_alias", ["catalogVersion", "alias"])
    .index("by_version", ["catalogVersion"]),

  catalogCoverage: defineTable({
    catalogVersion: v.string(),
    destinationKey: v.string(),
    visible: v.boolean(),
    ready: v.boolean(),
    guideWords: v.number(),
    hikeCount: v.number(),
    difficultyCount: v.number(),
    durationBandCount: v.number(),
    hasHero: v.boolean(),
    gaps: v.array(v.string()),
  })
    .index("by_version_key", ["catalogVersion", "destinationKey"])
    .index("by_version", ["catalogVersion"]),

  catalogHikes: defineTable({
    catalogVersion: v.string(),
    destinationKey: v.string(),
    hikeKey: v.string(),
    name: v.string(),
    routeType: v.union(v.literal("out-and-back"), v.literal("loop"), v.literal("point-to-point"), v.literal("multi-day")),
    description: v.string(),
    difficulty: v.union(v.literal("Easy"), v.literal("Moderate"), v.literal("Hard"), v.literal("Expert")),
    durationHours: v.number(),
    durationDays: v.number(),
    distanceKm: v.optional(v.number()),
    ascentM: v.optional(v.number()),
    descentM: v.optional(v.number()),
    trailhead: v.string(),
    recommendedMonths: v.optional(v.array(v.number())),
    accessCaveat: v.optional(v.string()),
    provenance: catalogProvenance,
  })
    .index("by_version_destination", ["catalogVersion", "destinationKey"])
    .index("by_version_key", ["catalogVersion", "hikeKey"]),

  catalogGeometries: defineTable({
    catalogVersion: v.string(),
    hikeKey: v.string(),
    coordinates: v.array(v.array(v.number())),
    sourceUrl: v.string(),
    attribution: v.string(),
    retrievedAt: v.string(),
    sourceObjectId: v.optional(v.string()),
  })
    .index("by_version_hike", ["catalogVersion", "hikeKey"])
    .index("by_version", ["catalogVersion"]),

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
    vehicleProfileKey: v.string(),
    month: v.string(),
    mode: v.string(),
    available: v.boolean(),
    durationHours: v.optional(v.number()),
    costPerPerson: v.optional(money),
    provenance: v.array(provenanceClaim),
  }).index("by_destination_origin_vehicle_month_mode", [
    "destinationId",
    "originKey",
    "vehicleProfileKey",
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
    sourceKey: v.string(),
    sourceUrl: v.string(),
    retrievedAt: v.number(),
    observedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    confidence,
    runId: v.string(),
    notes: v.optional(v.string()),
  })
    .index("by_destination_domain", ["destinationKey", "domain"])
    .index("by_source", ["sourceKey"])
    .index("by_run", ["runId"]),

  dataCoverage: defineTable({
    destinationKey: v.string(),
    domain: catalogDataDomain,
    status: coverageStatus,
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
