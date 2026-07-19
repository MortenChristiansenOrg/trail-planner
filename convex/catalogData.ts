import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

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

const coverageStatus = v.union(
  v.literal("missing"),
  v.literal("partial"),
  v.literal("fresh"),
  v.literal("stale"),
  v.literal("unavailable"),
);

export const coverageForDestination = query({
  args: { destinationKey: v.string() },
  handler: async (ctx, { destinationKey }) => {
    return await ctx.db
      .query("dataCoverage")
      .withIndex("by_destination_domain", (q) => q.eq("destinationKey", destinationKey))
      .collect();
  },
});

export const listQueuedWork = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const safeLimit = Math.max(1, Math.min(Math.floor(limit ?? 25), 100));
    return await ctx.db
      .query("enrichmentJobs")
      .withIndex("by_status_priority", (q) => q.eq("status", "queued"))
      .order("desc")
      .take(safeLimit);
  },
});

export const enqueue = internalMutation({
  args: {
    jobKey: v.string(),
    task: v.union(v.literal("add-destination"), v.literal("refresh-data")),
    destinationKey: v.optional(v.string()),
    domains: v.array(catalogDataDomain),
    priority: v.number(),
    maxAttempts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("enrichmentJobs")
      .withIndex("by_job_key", (q) => q.eq("jobKey", args.jobKey))
      .unique();
    if (existing && existing.status !== "failed") return existing._id;
    const now = Date.now();
    const value = {
      task: args.task,
      destinationKey: args.destinationKey,
      domains: args.domains,
      status: "queued" as const,
      priority: args.priority,
      attempts: 0,
      maxAttempts: args.maxAttempts ?? 3,
      requestedAt: now,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, { ...value, lastError: undefined });
      return existing._id;
    }
    return await ctx.db.insert("enrichmentJobs", { jobKey: args.jobKey, ...value });
  },
});

export const upsertCoverage = internalMutation({
  args: {
    destinationKey: v.string(),
    domain: catalogDataDomain,
    status: coverageStatus,
    claimCount: v.number(),
    staleAt: v.optional(v.number()),
    reasons: v.array(v.string()),
    runId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dataCoverage")
      .withIndex("by_destination_domain", (q) => q.eq("destinationKey", args.destinationKey).eq("domain", args.domain))
      .unique();
    const value = { ...args, assessedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, value);
      return existing._id;
    }
    return await ctx.db.insert("dataCoverage", value);
  },
});
