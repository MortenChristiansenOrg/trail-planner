export type ConfidenceLevel = "low" | "medium" | "high";

export type PriceType = "live" | "sampled" | "estimated" | "manual" | "unavailable";

export type ProvenanceClaim = {
  sourceId: string;
  sourceUrl?: string;
  verifiedAt: string;
  confidence: ConfidenceLevel;
  priceType?: PriceType;
  attribution?: string;
  refreshPolicy?: string;
};
