import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

async function currentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
}

async function ensureCurrentUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
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

async function ownedTrip(ctx: QueryCtx | MutationCtx, tripId: Id<"trips">) {
  const user = await currentUser(ctx);
  if (!user) throw new Error("User profile not found");
  const trip = await ctx.db.get(tripId);
  if (!trip || !("ownerId" in trip) || trip.ownerId !== user._id) throw new Error("Unauthorized");
  return trip;
}

export const mineStates = query({
  args: {},
  handler: async (ctx) => {
    const user = await currentUser(ctx);
    if (!user) return [];
    const trips = await ctx.db
      .query("trips")
      .withIndex("by_owner_planned_month", (q) => q.eq("ownerId", user._id))
      .collect();
    return trips.map((trip) => trip.stateJson);
  },
});

export const createState = mutation({
  args: {
    destinationKey: v.string(),
    plannedMonth: v.number(),
    stateJson: v.string(),
  },
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.plannedMonth) || args.plannedMonth < 1 || args.plannedMonth > 12) {
      throw new Error("plannedMonth must be an integer from 1 through 12");
    }
    const user = await ensureCurrentUser(ctx);
    const parsed = JSON.parse(args.stateJson) as Record<string, unknown>;
    if (!Array.isArray(parsed.days) || !Array.isArray(parsed.nights)) {
      throw new Error("Invalid trip state");
    }
    const now = Date.now();
    const tripId = await ctx.db.insert("trips", {
      ownerId: user._id,
      destinationKey: args.destinationKey,
      plannedMonth: String(args.plannedMonth).padStart(2, "0"),
      selectedTravelMode: typeof parsed.selectedTravelMode === "string" ? parsed.selectedTravelMode : undefined,
      estimatedTotalCost: { amount: 0, currency: "DKK" },
      exploreSnapshotJson: JSON.stringify(parsed.exploreSnapshot ?? {}),
      stateJson: args.stateJson,
      createdAt: now,
      updatedAt: now,
    });
    const stateJson = JSON.stringify({ ...parsed, id: tripId, createdAt: now, updatedAt: now });
    await ctx.db.patch(tripId, { stateJson });
    return stateJson;
  },
});

export const updateState = mutation({
  args: { tripId: v.id("trips"), stateJson: v.string() },
  handler: async (ctx, args) => {
    const trip = await ownedTrip(ctx, args.tripId);
    const parsed = JSON.parse(args.stateJson) as Record<string, unknown>;
    if (parsed.id !== args.tripId || !Array.isArray(parsed.days) || !Array.isArray(parsed.nights)) {
      throw new Error("Invalid trip state");
    }
    const updatedAt = Date.now();
    const stateJson = JSON.stringify({ ...parsed, updatedAt });
    await ctx.db.patch(args.tripId, {
      stateJson,
      selectedTravelMode: typeof parsed.selectedTravelMode === "string" ? parsed.selectedTravelMode : undefined,
      updatedAt,
    });
    return stateJson;
  },
});

export const removeMine = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await ownedTrip(ctx, args.tripId);
    const [days, activities, nights, costs, shares] = await Promise.all([
      ctx.db.query("itineraryDays").withIndex("by_trip_day_order", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("itineraryActivities").withIndex("by_trip_day", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("lodgingNights").withIndex("by_trip_after_day", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("budgetItems").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
      ctx.db.query("shareLinks").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect(),
    ]);
    for (const document of [...days, ...activities, ...nights, ...costs, ...shares]) await ctx.db.delete(document._id);
    await ctx.db.delete(args.tripId);
  },
});
