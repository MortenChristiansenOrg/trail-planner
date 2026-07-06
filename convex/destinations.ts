import { query } from "./_generated/server";

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("destinations")
      .withIndex("by_visibility", (q) => q.eq("visibility", "published"))
      .take(50);
  },
});
