export type EvidenceConfidence = "High" | "Medium" | "Low" | "Manual";

export type EvaluationEvidence = {
  label: string;
  value: string;
  confidence: EvidenceConfidence;
  note: string;
};

export type TravelOption = {
  id: string;
  label: string;
  summary: string;
  totalTripDays: number;
  timeToTrail: string;
  estimatedCostDkk: number;
  complexity: "Low" | "Medium" | "High" | "Very high";
  verdict: string;
  selected?: boolean;
  tradeoff: string;
};

export type PlanLeg = {
  when: string;
  mode: string;
  title: string;
  detail: string;
  value: string;
  confidence: EvidenceConfidence;
};

export type CostLine = {
  label: string;
  value: number;
  confidence: EvidenceConfidence;
};

export const evaluatedHike = {
  name: "Besseggen Ridge",
  region: "Jotunheimen, Norway",
  origin: "Aalborg, Denmark",
  score: 82,
  verdict: "Worth planning as a 3-night drive-and-ferry trip if the Gjende boat and weather window line up.",
  route: {
    distanceKm: 14,
    ascentM: 1100,
    hikingHours: "7-8h",
    difficulty: "Hard",
    routeType: "Point-to-point ridge hike",
    season: "Late June to September",
    start: "Memurubu or Gjendesheim",
    finish: "Gjendesheim or Memurubu",
  },
  summary: {
    timeToTrail: "17h 40m",
    recommendedLength: "3 nights",
    estimatedCostDkk: 3900,
    totalTravelTime: "26h 10m return",
  },
  ratings: [
    { label: "Hiking quality", value: 92, caption: "High" },
    { label: "Travel friction", value: 62, caption: "Medium" },
    { label: "Cost confidence", value: 55, caption: "Medium" },
    { label: "Season fit", value: 83, caption: "Good" },
  ],
  fragility: [
    "Late arrival near Gjendesheim if the ferry or E18 drive slips by more than 90 minutes.",
    "Boat direction changes the hiking day; missing the morning boat removes the clean plan.",
    "Ridge exposure makes the hike poor value in low cloud or strong wind.",
  ],
  plan: [
    {
      when: "Fri 07:10",
      mode: "Drive",
      title: "Aalborg to Hirtshals ferry terminal",
      detail: "Leave enough buffer for parking, check-in, and summer traffic north of Aalborg.",
      value: "50m",
      confidence: "High",
    },
    {
      when: "Fri 09:30",
      mode: "Ferry",
      title: "Hirtshals to Larvik",
      detail: "Day sailing works without a cabin. Price should be refreshed before booking.",
      value: "3h 45m",
      confidence: "Medium",
    },
    {
      when: "Fri 14:00",
      mode: "Drive",
      title: "Larvik to Gjendesheim area",
      detail: "Long but feasible same-day transfer with one charging and dinner stop.",
      value: "5h 45m",
      confidence: "Medium",
    },
    {
      when: "Fri night",
      mode: "Lodge",
      title: "Budget bed near Gjendesheim",
      detail: "Cabin, hostel, or simple lodge estimate. Availability is the weakest cost input.",
      value: "850 DKK",
      confidence: "Low",
    },
    {
      when: "Sat 08:00",
      mode: "Hike",
      title: "Boat to Memurubu, hike Besseggen back",
      detail: "Classic direction gives the ridge late morning and finishes at lodging/parking.",
      value: "7-8h",
      confidence: "High",
    },
    {
      when: "Sun-Mon",
      mode: "Return",
      title: "Drive, ferry, and drive home",
      detail: "Keep one buffer night so the return is not coupled to the hiking weather window.",
      value: "12h 30m",
      confidence: "Medium",
    },
  ] satisfies PlanLeg[],
  options: [
    {
      id: "drive-ferry",
      label: "Drive + ferry",
      summary: "Aalborg-Hirtshals, ferry to Larvik, drive to Gjendesheim.",
      totalTripDays: 4,
      timeToTrail: "17h 40m",
      estimatedCostDkk: 3900,
      complexity: "Medium",
      verdict: "Recommended",
      selected: true,
      tradeoff: "Best control over the last mile, but tiring without a buffer night.",
    },
    {
      id: "fly-train-bus",
      label: "Fly + public transport",
      summary: "Aalborg-Oslo, train toward Otta, bus/taxi into Gjendesheim.",
      totalTripDays: 4,
      timeToTrail: "18h 30m",
      estimatedCostDkk: 4700,
      complexity: "High",
      verdict: "Workable backup",
      tradeoff: "Less driving, but the last-mile transfer is more fragile.",
    },
    {
      id: "public-only",
      label: "Public transport only",
      summary: "Train/bus/ferry chain from Denmark through Norway.",
      totalTripDays: 6,
      timeToTrail: "31h",
      estimatedCostDkk: 3600,
      complexity: "Very high",
      verdict: "Too slow",
      tradeoff: "Cheaper on paper, but consumes too many days for a single hike.",
    },
  ] satisfies TravelOption[],
  costs: [
    { label: "EV energy and charging", value: 820, confidence: "Medium" },
    { label: "Ferry return with car", value: 1450, confidence: "Medium" },
    { label: "Two simple lodging nights", value: 1450, confidence: "Low" },
    { label: "Gjende boat and parking", value: 180, confidence: "Manual" },
  ] satisfies CostLine[],
  evidence: [
    {
      label: "Route geometry",
      value: "14 km / 1,100 m",
      confidence: "High",
      note: "Curated route shape aligns with common Besseggen descriptions.",
    },
    {
      label: "Road travel time",
      value: "OSRM-style drive estimate",
      confidence: "Medium",
      note: "Good for planning, but summer congestion and charging stops need padding.",
    },
    {
      label: "Ferry schedule and fare",
      value: "Operator/manual sample",
      confidence: "Medium",
      note: "Enough for a POC comparison; not a bookable price quote.",
    },
    {
      label: "Lodging availability",
      value: "Manual estimate",
      confidence: "Low",
      note: "Availability can dominate the real decision in peak season.",
    },
    {
      label: "Weather window",
      value: "Open-Meteo trail forecast",
      confidence: "High",
      note: "Useful close to departure; climatology only for early planning.",
    },
    {
      label: "Gjende boat",
      value: "Manual check required",
      confidence: "Manual",
      note: "Direction and departure time decide whether the recommended day works.",
    },
  ] satisfies EvaluationEvidence[],
};
