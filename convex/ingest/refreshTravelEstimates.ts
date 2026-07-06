import { internalAction } from "../_generated/server";

export const refreshTravelEstimates = internalAction({
  args: {},
  handler: async () => {
    return { refreshed: 0 };
  },
});
