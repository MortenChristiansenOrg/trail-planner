import type { Money } from "./budget";

export type LodgingKind = "tent-free" | "tent-camping" | "hut" | "hotel" | "other";

export type LodgingChoice = {
  id: string;
  name: string;
  kind: LodgingKind;
  nightlyCost?: Money;
};
