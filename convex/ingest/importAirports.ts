import { internalAction } from "../_generated/server";

export const importAirports = internalAction({
  args: {},
  handler: async () => {
    return { imported: 0 };
  },
});
