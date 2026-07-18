import { deriveTravelOptionTotals, type TravelOptionSnapshot } from "@trail-planner/domain";

export async function loadTravelOption(optionId: string): Promise<TravelOptionSnapshot | undefined> {
  const { travelOptionById } = await import("@/features/catalog/travelOptions");
  const option = travelOptionById.get(optionId);
  if (!option) return undefined;
  deriveTravelOptionTotals(option);
  return structuredClone(option);
}
