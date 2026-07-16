import { internalAction } from "../_generated/server";

export const importHikes = internalAction({
  args: {},
  handler: async () => {
    return { imported: 0 };
  },
});
