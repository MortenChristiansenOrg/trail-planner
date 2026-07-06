import { internalAction } from "../_generated/server";

export const importDestinations = internalAction({
  args: {},
  handler: async () => {
    return { imported: 0 };
  },
});
