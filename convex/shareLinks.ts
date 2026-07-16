import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

function generateShareToken() {
  // Convex mutations replace Math.random with a seeded strong PRNG while
  // preserving deterministic retries. Four 32-bit samples provide 128 bits.
  return Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0x1_0000_0000)
      .toString(16)
      .padStart(8, "0"),
  ).join("");
}

async function requireOwnedTrip(ctx: MutationCtx, tripId: Id<"trips">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
  if (!user) throw new Error("User profile not found");
  const trip = await ctx.db.get(tripId);
  if (!trip || trip.ownerId !== user._id) throw new Error("Unauthorized");
  return trip;
}

export const createOrGet = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const trip = await requireOwnedTrip(ctx, args.tripId);
    const links = await ctx.db.query("shareLinks").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
    const active = links.find((link) => link.status === "active");
    let token = active?.token;
    if (!token) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = generateShareToken();
        const collision = await ctx.db
          .query("shareLinks")
          .withIndex("by_token", (q) => q.eq("token", candidate))
          .first();
        if (collision) continue;
        token = candidate;
        await ctx.db.insert("shareLinks", {
          tripId: args.tripId,
          token,
          status: "active",
          createdAt: Date.now(),
        });
        break;
      }
    }
    if (!token) throw new Error("Unable to create a unique share link");
    const state = JSON.parse(trip.stateJson) as Record<string, unknown>;
    await ctx.db.patch(args.tripId, { stateJson: JSON.stringify({ ...state, shareToken: token }), updatedAt: Date.now() });
    return token;
  },
});

export const revoke = mutation({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    await requireOwnedTrip(ctx, args.tripId);
    const links = await ctx.db.query("shareLinks").withIndex("by_trip", (q) => q.eq("tripId", args.tripId)).collect();
    for (const link of links) if (link.status === "active") await ctx.db.patch(link._id, { status: "revoked" });
  },
});

export const read = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("shareLinks")
      .withIndex("by_token_status", (q) => q.eq("token", args.token).eq("status", "active"))
      .unique();
    if (!link) return null;
    const trip = await ctx.db.get(link.tripId);
    if (!trip) return null;
    const state = JSON.parse(trip.stateJson) as Record<string, unknown>;
    const { ownerId: _ownerId, ...sanitized } = state;
    return JSON.stringify(sanitized);
  },
});
