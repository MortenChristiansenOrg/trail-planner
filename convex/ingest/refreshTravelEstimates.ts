import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";

export const refreshTravelEstimates = internalAction({
  args: { destinationKey: v.string() },
  returns: v.id("enrichmentJobs"),
  handler: async (ctx, { destinationKey }): Promise<Id<"enrichmentJobs">> => {
    const date = new Date().toISOString().slice(0, 10);
    return await ctx.runMutation(internal.catalogData.enqueue, {
      jobKey: `travel-refresh:${destinationKey}:${date}`,
      task: "refresh-data",
      destinationKey,
      domains: ["travel-road", "travel-transit", "travel-flight"],
      priority: 50,
    });
  },
});
