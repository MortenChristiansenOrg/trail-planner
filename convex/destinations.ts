import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";

export const listPublished = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db
      .query("destinations")
      .withIndex("by_visibility", (q) => q.eq("visibility", "published"))
      .paginate(paginationOpts);
  },
});
