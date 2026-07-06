import { query } from "./_generated/server";
import { v } from "convex/values";

export const byToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shareLinks")
      .withIndex("by_token_status", (q) =>
        q.eq("token", args.token).eq("status", "active"),
      )
      .unique();
  },
});
