import { query } from "./_generated/server";

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("trips")
      .withIndex("by_owner_planned_month", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});
