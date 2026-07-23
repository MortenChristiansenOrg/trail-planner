export const confidenceLevels = ["low", "medium", "high"] as const;

export type ConfidenceLevel = (typeof confidenceLevels)[number];

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
