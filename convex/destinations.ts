import { query } from "./_generated/server";

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("destinations")
      .withIndex("by_country_visibility")
      .filter((q) => q.eq(q.field("visibility"), "published"))
      .take(50);
  },
});
