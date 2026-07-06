import abiskoImage from "@/assets/hub-abisko.png";
import dolomitesImage from "@/assets/hub-dolomites.png";
import fortWilliamImage from "@/assets/hub-fort-william.png";
import hardangerImage from "@/assets/hub-hardanger.png";
import jotunheimenImage from "@/assets/hub-jotunheimen.png";
import romsdalenImage from "@/assets/hub-romsdalen.png";

export type HubConfidence = "Low" | "Medium" | "High";

export type AccessMode = "drive" | "fly" | "rail" | "ferry" | "bus";

export type TrailHub = {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  heroImageUrl: string;
  summary: string;
  profile: {
    mountainQuality: number;
    accessComplexity: number;
    routeDensity: number;
    lodgingStrength: number;
    publicTransportFit: number;
    seasonFit: number;
    confidence: HubConfidence;
  };
  logistics: {
    driveHoursFromAalborg?: number;
    nearestAirports: string[];
    trunkAccess: string[];
    localAccess: string[];
    lodging: string[];
  };
  season: {
    bestMonths: string;
    caution: string;
  };
  dataSignals: Array<{
    label: string;
    source: "Curated" | "OSM" | "Entur" | "OurAirports" | "Official";
    confidence: HubConfidence;
  }>;
  routeCandidates: Array<{
    name: string;
    durationDays: number;
    type: "day hike" | "ridge traverse" | "hut-to-hut" | "multi-day trek";
    status: "curated seed" | "osm candidate" | "manual follow-up";
    note: string;
  }>;
};

export const trailHubs: TrailHub[] = [
  {
    id: "jotunheimen-gjendesheim",
    name: "Gjendesheim / Jotunheimen",
    region: "Jotunheimen",
    country: "Norway",
    latitude: 61.4947,
    longitude: 8.8105,
    heroImageUrl: jotunheimenImage,
    summary:
      "A staging area for classic ridge walks, lake boats, DNT lodging, and high mountain day hikes.",
    profile: {
      mountainQuality: 96,
      accessComplexity: 68,
      routeDensity: 86,
      lodgingStrength: 82,
      publicTransportFit: 58,
      seasonFit: 76,
      confidence: "High",
    },
    logistics: {
      driveHoursFromAalborg: 11.5,
      nearestAirports: ["OSL Oslo", "TRD Trondheim"],
      trunkAccess: ["Drive via ferry/bridge", "Train/bus to Vågå/Lom area"],
      localAccess: ["Gjende boat", "Seasonal bus links", "Trailhead parking"],
      lodging: ["DNT lodge", "Nearby huts", "Campsites"],
    },
    season: {
      bestMonths: "July-September",
      caution: "Boat season and snow conditions determine route practicality.",
    },
    dataSignals: [
      { label: "Besseggen curated seed route", source: "Curated", confidence: "High" },
      { label: "Huts, campsites, ferry terminal, transit stops", source: "OSM", confidence: "Medium" },
      { label: "Norway trunk transit testable by Entur", source: "Entur", confidence: "Medium" },
      { label: "Gjende boat needs local operator modeling", source: "Official", confidence: "Medium" },
    ],
    routeCandidates: [
      {
        name: "Besseggen Ridge",
        durationDays: 1,
        type: "ridge traverse",
        status: "curated seed",
        note: "Needs boat schedule and start-direction decision.",
      },
      {
        name: "Gjendesheim local summit day",
        durationDays: 1,
        type: "day hike",
        status: "manual follow-up",
        note: "Good filler candidate for arrival or weather buffer day.",
      },
      {
        name: "Multi-hut Jotunheimen extension",
        durationDays: 3,
        type: "hut-to-hut",
        status: "osm candidate",
        note: "Requires DNT hut and stage validation.",
      },
    ],
  },
  {
    id: "hardanger-odda",
    name: "Odda / Skjeggedal",
    region: "Hardanger",
    country: "Norway",
    latitude: 60.1241,
    longitude: 6.7394,
    heroImageUrl: hardangerImage,
    summary:
      "A high-demand base for Trolltunga and Hardanger mountain days with shuttle and parking constraints.",
    profile: {
      mountainQuality: 88,
      accessComplexity: 74,
      routeDensity: 70,
      lodgingStrength: 78,
      publicTransportFit: 54,
      seasonFit: 72,
      confidence: "High",
    },
    logistics: {
      driveHoursFromAalborg: 12.2,
      nearestAirports: ["BGO Bergen", "HAU Haugesund"],
      trunkAccess: ["Bus from Bergen to Odda", "Drive via Norway ferry corridor"],
      localAccess: ["Trolltunga shuttle", "P2/P3 parking", "Taxi fallback"],
      lodging: ["Odda hotels", "Campsites", "Mountain huts/shelters"],
    },
    season: {
      bestMonths: "June-September",
      caution: "Parking, shuttle, guided-season rules, and snow advice are date-sensitive.",
    },
    dataSignals: [
      { label: "Trolltunga curated seed route", source: "Curated", confidence: "High" },
      { label: "Bergen-Odda public transport works", source: "Entur", confidence: "High" },
      { label: "Odda-Skjeggedal returned as transit gap", source: "Entur", confidence: "Medium" },
      { label: "Viewpoints, shelters, information points", source: "OSM", confidence: "Medium" },
    ],
    routeCandidates: [
      {
        name: "Trolltunga",
        durationDays: 1,
        type: "day hike",
        status: "curated seed",
        note: "Core route, but parking and shuttle modeling is essential.",
      },
      {
        name: "Hardangervidda edge route",
        durationDays: 2,
        type: "multi-day trek",
        status: "manual follow-up",
        note: "Needs official route and weather validation.",
      },
      {
        name: "Odda valley recovery hike",
        durationDays: 1,
        type: "day hike",
        status: "osm candidate",
        note: "Potential lower-risk filler day near town.",
      },
    ],
  },
  {
    id: "romsdalen-andalsnes",
    name: "Åndalsnes / Romsdalen",
    region: "Romsdalen",
    country: "Norway",
    latitude: 62.5675,
    longitude: 7.6871,
    heroImageUrl: romsdalenImage,
    summary:
      "A rail-accessible mountain town with ridge traverses, valley hikes, viewpoints, and strong weather sensitivity.",
    profile: {
      mountainQuality: 92,
      accessComplexity: 60,
      routeDensity: 82,
      lodgingStrength: 74,
      publicTransportFit: 68,
      seasonFit: 70,
      confidence: "High",
    },
    logistics: {
      driveHoursFromAalborg: 14.2,
      nearestAirports: ["AES Ålesund", "MOL Molde", "TRD Trondheim"],
      trunkAccess: ["Rail to Åndalsnes", "Regional bus", "Drive via Norway corridor"],
      localAccess: ["Romsdalseggen bus", "Trailhead taxi", "Town-based trailheads"],
      lodging: ["Town hotels", "Campsites", "Mountain cabins"],
    },
    season: {
      bestMonths: "July-September",
      caution: "Ridge routes need good visibility and local shuttle confirmation.",
    },
    dataSignals: [
      { label: "Romsdalseggen curated seed route", source: "Curated", confidence: "High" },
      { label: "Åndalsnes area transit exists, trailhead shuttle gap remains", source: "Entur", confidence: "Medium" },
      { label: "Town lodging and access POIs are OSM-visible", source: "OSM", confidence: "Medium" },
      { label: "Nearest airport candidates from static metadata", source: "OurAirports", confidence: "High" },
    ],
    routeCandidates: [
      {
        name: "Romsdalseggen Ridge",
        durationDays: 1,
        type: "ridge traverse",
        status: "curated seed",
        note: "Needs seasonal bus and route variant source.",
      },
      {
        name: "Rampestreken / Nesaksla",
        durationDays: 1,
        type: "day hike",
        status: "manual follow-up",
        note: "Useful short day from town if weather blocks the ridge.",
      },
      {
        name: "Romsdalen multi-day extension",
        durationDays: 2,
        type: "multi-day trek",
        status: "osm candidate",
        note: "Needs hut/campsite and stage validation.",
      },
    ],
  },
  {
    id: "fort-william-nevis",
    name: "Fort William / Lochaber",
    region: "Scottish Highlands",
    country: "United Kingdom",
    latitude: 56.8198,
    longitude: -5.1052,
    heroImageUrl: fortWilliamImage,
    summary:
      "A major walking base with town lodging, rail access, Ben Nevis routes, and wet-weather fallback options.",
    profile: {
      mountainQuality: 86,
      accessComplexity: 56,
      routeDensity: 90,
      lodgingStrength: 88,
      publicTransportFit: 72,
      seasonFit: 64,
      confidence: "High",
    },
    logistics: {
      nearestAirports: ["GLA Glasgow", "EDI Edinburgh", "INV Inverness"],
      trunkAccess: ["Flight plus rail/bus", "Rail to Fort William", "Long drive with ferry/channel complexity"],
      localAccess: ["Town buses", "Trailhead taxi", "Walkable low-level starts"],
      lodging: ["Hotels", "Hostels", "Campsites", "Bunkhouses"],
    },
    season: {
      bestMonths: "May-September",
      caution: "Weather and winter condition checks matter even outside winter.",
    },
    dataSignals: [
      { label: "Ben Nevis CMD curated seed route", source: "Curated", confidence: "High" },
      { label: "Fort William geocoding worked in Photon/Nominatim", source: "OSM", confidence: "High" },
      { label: "High OSM amenity count around town", source: "OSM", confidence: "Medium" },
      { label: "Airport set available from static metadata", source: "OurAirports", confidence: "High" },
    ],
    routeCandidates: [
      {
        name: "Ben Nevis via Carn Mor Dearg Arete",
        durationDays: 1,
        type: "ridge traverse",
        status: "curated seed",
        note: "High quality, weather-sensitive, not a casual summit route.",
      },
      {
        name: "Glen Nevis lower day",
        durationDays: 1,
        type: "day hike",
        status: "osm candidate",
        note: "Good bad-weather or arrival-day candidate.",
      },
      {
        name: "Mamores traverse sample",
        durationDays: 1,
        type: "ridge traverse",
        status: "manual follow-up",
        note: "Needs exact route variant and transport assumptions.",
      },
    ],
  },
  {
    id: "abisko-lapland",
    name: "Abisko / Swedish Lapland",
    region: "Norrbotten",
    country: "Sweden",
    latitude: 68.358,
    longitude: 18.783,
    heroImageUrl: abiskoImage,
    summary:
      "A rail-linked arctic hiking hub for Kungsleden sections, huts, lakes, and long daylight summer trips.",
    profile: {
      mountainQuality: 84,
      accessComplexity: 62,
      routeDensity: 76,
      lodgingStrength: 70,
      publicTransportFit: 78,
      seasonFit: 60,
      confidence: "Medium",
    },
    logistics: {
      driveHoursFromAalborg: 23.5,
      nearestAirports: ["KRN Kiruna", "EVE Harstad/Narvik"],
      trunkAccess: ["Night train corridor", "Flight to Kiruna", "Long drive"],
      localAccess: ["Trailhead rail station", "Boat stages for some routes", "Hut network"],
      lodging: ["STF station", "Huts", "Camping"],
    },
    season: {
      bestMonths: "July-September",
      caution: "Mosquito season, boat stages, snow timing, and hut booking affect plans.",
    },
    dataSignals: [
      { label: "Kungsleden curated seed route", source: "Curated", confidence: "High" },
      { label: "Airport candidates available", source: "OurAirports", confidence: "High" },
      { label: "Hut and route network requires official STF validation", source: "Official", confidence: "Medium" },
      { label: "OSM can identify trail and hut candidates", source: "OSM", confidence: "Medium" },
    ],
    routeCandidates: [
      {
        name: "Kungsleden: Abisko starter section",
        durationDays: 3,
        type: "hut-to-hut",
        status: "curated seed",
        note: "Good hub proof for multi-day planning rather than single route search.",
      },
      {
        name: "Nuolja / Abisko day",
        durationDays: 1,
        type: "day hike",
        status: "manual follow-up",
        note: "Possible shorter option near base.",
      },
      {
        name: "Lake and canyon route candidates",
        durationDays: 1,
        type: "day hike",
        status: "osm candidate",
        note: "Needs route geometry and condition validation.",
      },
    ],
  },
  {
    id: "dolomites-cortina",
    name: "Cortina / Dolomites",
    region: "Dolomites",
    country: "Italy",
    latitude: 46.5405,
    longitude: 12.1357,
    heroImageUrl: dolomitesImage,
    summary:
      "A dense alpine base with rifugios, iconic day hikes, buses, toll roads, and strong seasonality.",
    profile: {
      mountainQuality: 94,
      accessComplexity: 72,
      routeDensity: 94,
      lodgingStrength: 86,
      publicTransportFit: 62,
      seasonFit: 72,
      confidence: "Medium",
    },
    logistics: {
      driveHoursFromAalborg: 16.5,
      nearestAirports: ["VCE Venice", "INN Innsbruck", "VRN Verona"],
      trunkAccess: ["Flight plus bus/rental car", "Long drive via Germany/Austria"],
      localAccess: ["Seasonal buses", "Toll roads", "Rifugio access roads"],
      lodging: ["Town hotels", "Rifugios", "Campsites"],
    },
    season: {
      bestMonths: "June-September",
      caution: "Road access, parking reservations, storms, and hut availability drive feasibility.",
    },
    dataSignals: [
      { label: "Tre Cime curated seed route", source: "Curated", confidence: "High" },
      { label: "Airport candidates available", source: "OurAirports", confidence: "High" },
      { label: "Rifugio/lodging density expected from OSM", source: "OSM", confidence: "Medium" },
      { label: "Official road and parking rules need manual source records", source: "Official", confidence: "Medium" },
    ],
    routeCandidates: [
      {
        name: "Tre Cime di Lavaredo Loop",
        durationDays: 1,
        type: "day hike",
        status: "curated seed",
        note: "Needs road, parking, and bus season data.",
      },
      {
        name: "Rifugio-linked hut day",
        durationDays: 1,
        type: "day hike",
        status: "osm candidate",
        note: "Good fit for filling non-travel days after base choice.",
      },
      {
        name: "Short Alta Via sample",
        durationDays: 3,
        type: "hut-to-hut",
        status: "manual follow-up",
        note: "Requires hut availability and stage source validation.",
      },
    ],
  },
];
