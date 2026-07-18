import { deriveTravelOptionTotals, type TravelOptionSnapshot } from "@trail-planner/domain";
import { drivingRoutePoints, loadRoadRoute } from "@/features/maps/drivingRoute";
import { createInnsbruckDrivingOption, innsbruckCoordinates, innsbruckDrivingOptionId } from "@/features/catalog/travelOptions";

export async function loadTravelOption(optionId: string): Promise<TravelOptionSnapshot | undefined> {
  if (optionId !== innsbruckDrivingOptionId) return undefined;
  const outboundPoints = drivingRoutePoints(innsbruckCoordinates, true);
  const [outbound, inbound] = await Promise.all([
    loadRoadRoute(outboundPoints),
    loadRoadRoute([...outboundPoints].reverse()),
  ]);
  const option = createInnsbruckDrivingOption(outbound, inbound);
  deriveTravelOptionTotals(option);
  return option;
}
