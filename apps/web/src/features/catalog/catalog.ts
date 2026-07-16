export type TravelMode = "car" | "train" | "plane";

export type TravelEstimate = {
  mode: TravelMode;
  available: boolean;
  oneWayHours: number;
  costPerPersonDkk: number;
  layovers?: number;
  note: string;
  confidence: "high" | "medium" | "low";
};

export type Hike = {
  id: string;
  name: string;
  durationDays: number;
  distanceKm: number;
  ascentM: number;
  difficulty: "Moderate" | "Hard" | "Expert";
  description: string;
  route: [number, number][];
};

export type KnownLodging = {
  id: string;
  name: string;
  kind: "hut" | "camping";
  nightlyCostDkk: number;
};

export type Destination = {
  id: string;
  name: string;
  region: string;
  country: string;
  countryCode: string;
  coordinates: [number, number];
  recommendedMonths: number[];
  summary: string;
  character: string;
  travel: TravelEstimate[];
  hikes: Hike[];
  lodgings: KnownLodging[];
};

const route = (id: string, lng: number, lat: number, scale = 1): [number, number][] => {
  const seed = Array.from(id).reduce((value, character) => value + character.charCodeAt(0), 0);
  const angle = ((seed % 160) - 80) * (Math.PI / 180);
  const phase = (seed % 360) * (Math.PI / 180);
  const curve = ((seed % 11) - 5) * 0.018;
  const longitudinalScale = 0.075 * scale;
  const latitudinalScale = 0.045 * scale;
  const points = Array.from({ length: 7 }, (_, index): [number, number] => {
    const progress = index / 6 - 0.5;
    const bend =
      Math.sin((progress + 0.5) * Math.PI) * curve +
      Math.sin((progress + 0.5) * Math.PI * 2 + phase) * 0.035;
    const x = progress * Math.cos(angle) - bend * Math.sin(angle);
    const y = progress * Math.sin(angle) + bend * Math.cos(angle);
    return [lng + x * longitudinalScale, lat + y * latitudinalScale];
  });
  return points;
};

const travel = (
  car: [number, number],
  train: [number, number] | null,
  plane: [number, number, number] | null,
): TravelEstimate[] => [
  {
    mode: "car",
    available: true,
    oneWayHours: car[0],
    costPerPersonDkk: car[1],
    note: "One-way drive time with estimated return costs, including road charges and crossings where relevant.",
    confidence: "medium",
  },
  train
    ? {
        mode: "train",
        available: true,
        oneWayHours: train[0],
        costPerPersonDkk: train[1],
        note: "One-way rail and bus time with estimated return costs; local reservations may be required.",
        confidence: "medium",
      }
    : {
        mode: "train",
        available: false,
        oneWayHours: 0,
        costPerPersonDkk: 0,
        note: "No practical public-transport chain within the MVP trip window.",
        confidence: "high",
      },
  plane
    ? {
        mode: "plane",
        available: true,
        oneWayHours: plane[0],
        costPerPersonDkk: plane[1],
        layovers: plane[2],
        note: "One-way journey time with sampled return airfare and ground transfers; not a live fare.",
        confidence: "low",
      }
    : {
        mode: "plane",
        available: false,
        oneWayHours: 0,
        costPerPersonDkk: 0,
        layovers: 0,
        note: "No useful flight connection for this planning model.",
        confidence: "high",
      },
];

const hike = (
  id: string,
  name: string,
  days: number,
  distanceKm: number,
  ascentM: number,
  difficulty: Hike["difficulty"],
  description: string,
  center: [number, number],
  scale = 1,
): Hike => ({
  id,
  name,
  durationDays: days,
  distanceKm,
  ascentM,
  difficulty,
  description,
  route: route(id, center[0], center[1], scale),
});

export const destinations: Destination[] = [
  {
    id: "romsdalen",
    name: "Åndalsnes",
    region: "Romsdalen",
    country: "Norway",
    countryCode: "NO",
    coordinates: [7.687, 62.567],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A compact fjord-and-ridge base with serious mountain days directly above town.",
    character: "Sharp ridges, deep valleys, exposed viewpoints and unusually easy access from the rail terminus.",
    travel: travel([12.4, 1700], [18.2, 2050], [7.3, 2550, 1]),
    hikes: [
      hike("romsdalseggen", "Romsdalseggen Ridge", 1, 10.3, 970, "Hard", "A sustained point-to-point ridge above Romsdalen.", [7.66, 62.55]),
      hike("rampestreken", "Rampestreken and Nesaksla", 1, 7.2, 715, "Moderate", "A steep local ascent with a broad fjord outlook.", [7.69, 62.57], 0.55),
      hike("trollveggen", "Trollveggen valley approach", 1, 12, 520, "Moderate", "A quieter valley day beneath the Troll Wall.", [7.74, 62.51], 0.7),
    ],
    lodgings: [
      { id: "andalsnes-camping", name: "Åndalsnes Camping", kind: "camping", nightlyCostDkk: 260 },
      { id: "aak-hut", name: "Aak mountain lodge", kind: "hut", nightlyCostDkk: 760 },
    ],
  },
  {
    id: "jotunheimen",
    name: "Gjendesheim",
    region: "Jotunheimen",
    country: "Norway",
    countryCode: "NO",
    coordinates: [8.997, 61.495],
    recommendedMonths: [7, 8, 9],
    summary: "A high-mountain gateway for classic ridge walks and hut-to-hut stages.",
    character: "Open alpine plateaus, turquoise lakes and rugged ridges, with the Gjende boat shaping several route days.",
    travel: travel([13.7, 1850], [20.4, 1850], [8.4, 2400, 1]),
    hikes: [
      hike("besseggen", "Besseggen Ridge", 1, 14, 1100, "Hard", "The classic exposed ridge between Gjende and Bessvatnet.", [8.94, 61.5], 0.9),
      hike("knutshoe", "Knutshøe Ridge", 1, 13, 750, "Hard", "A quieter ridge loop with hands-on sections.", [9.08, 61.44], 0.7),
      hike("gjende-huts", "Gjende hut circuit", 3, 42, 2100, "Hard", "A multi-day circuit linking staffed mountain huts.", [8.82, 61.55], 1.8),
    ],
    lodgings: [
      { id: "gjendesheim-turisthytte", name: "Gjendesheim Turisthytte", kind: "hut", nightlyCostDkk: 930 },
      { id: "memurubu", name: "Memurubu lodge", kind: "hut", nightlyCostDkk: 980 },
    ],
  },
  {
    id: "hardanger",
    name: "Odda",
    region: "Hardanger",
    country: "Norway",
    countryCode: "NO",
    coordinates: [6.546, 60.069],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A fjord town with access to long viewpoint hikes, glaciers and plateau terrain.",
    character: "Big vertical relief, waterfalls and long days where weather and shuttle timing matter.",
    travel: travel([11.8, 1650], [18.8, 1950], [7.8, 2450, 1]),
    hikes: [
      hike("trolltunga", "Trolltunga", 1, 27, 800, "Hard", "A very long out-and-back to the famous cliff above Ringedalsvatnet.", [6.74, 60.13], 1.25),
      hike("buerbreen", "Buerbreen valley", 1, 6, 350, "Moderate", "A shorter glacier-view hike west of Odda.", [6.59, 60.03], 0.45),
    ],
    lodgings: [
      { id: "odda-camping", name: "Odda Camping", kind: "camping", nightlyCostDkk: 285 },
      { id: "reinaskorsbu", name: "Reinaskorsbu trail lodge", kind: "hut", nightlyCostDkk: 720 },
    ],
  },
  {
    id: "lofoten",
    name: "Svolvær",
    region: "Lofoten",
    country: "Norway",
    countryCode: "NO",
    coordinates: [14.568, 68.234],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A sea-level base for short, steep hikes into dramatic coastal mountains.",
    character: "Granite peaks rising straight from the sea, rapidly changing weather and compact but demanding routes.",
    travel: travel([24.5, 3100], [31, 2850], [8.2, 3100, 1]),
    hikes: [
      hike("floya", "Fløya and Djevelporten", 1, 5.5, 590, "Hard", "A steep local climb above Svolvær.", [14.59, 68.24], 0.5),
      hike("matmora", "Matmora", 1, 14, 820, "Hard", "A longer ridge day on Austvågøya.", [14.71, 68.36], 0.7),
    ],
    lodgings: [{ id: "svolvaer-camping", name: "Svolvær coastal camping", kind: "camping", nightlyCostDkk: 320 }],
  },
  {
    id: "abisko",
    name: "Abisko",
    region: "Swedish Lapland",
    country: "Sweden",
    countryCode: "SE",
    coordinates: [18.829, 68.35],
    recommendedMonths: [7, 8, 9],
    summary: "A rail-accessible Arctic trailhead for valleys, high viewpoints and Kungsleden stages.",
    character: "Broad glacial valleys, birch forest and open fell with a reliable trail network but a short snow-free season.",
    travel: travel([22.5, 2550], [25.5, 1950], [8.7, 2850, 1]),
    hikes: [
      hike("lapporten", "Lapporten viewpoint", 1, 20, 720, "Hard", "A long approach to the iconic U-shaped valley.", [18.87, 68.31], 1.1),
      hike("kungsleden-abiskojaure", "Kungsleden to Abiskojaure", 2, 35, 620, "Moderate", "An accessible first overnight stage on Kungsleden.", [18.7, 68.25], 1.6),
    ],
    lodgings: [
      { id: "abiskojaure", name: "Abiskojaure mountain hut", kind: "hut", nightlyCostDkk: 610 },
      { id: "abisko-camping", name: "Abisko STF camping", kind: "camping", nightlyCostDkk: 210 },
    ],
  },
  {
    id: "fort-william",
    name: "Fort William",
    region: "West Highlands",
    country: "United Kingdom",
    countryCode: "GB",
    coordinates: [-5.105, 56.819],
    recommendedMonths: [5, 6, 7, 8, 9],
    summary: "A practical base below Ben Nevis with direct access to several of Scotland’s biggest mountain days.",
    character: "Wet, rugged mountains, long ridges and strong public-transport access by Highland standards.",
    travel: travel([17.9, 2250], [22.6, 2200], [8.1, 2100, 1]),
    hikes: [
      hike("ben-nevis", "Ben Nevis mountain track", 1, 17, 1350, "Hard", "A long ascent to Britain’s highest summit.", [-5.03, 56.8], 0.8),
      hike("ring-steall", "Ring of Steall", 1, 16, 1450, "Expert", "A committing ridge circuit with exposed scrambling.", [-5.0, 56.75], 0.95),
    ],
    lodgings: [
      { id: "glen-nevis", name: "Glen Nevis campsite", kind: "camping", nightlyCostDkk: 250 },
      { id: "loch-ossian", name: "Loch Ossian youth hostel", kind: "hut", nightlyCostDkk: 390 },
    ],
  },
  {
    id: "cairngorms",
    name: "Aviemore",
    region: "Cairngorms",
    country: "United Kingdom",
    countryCode: "GB",
    coordinates: [-3.829, 57.195],
    recommendedMonths: [5, 6, 7, 8, 9],
    summary: "A rail-connected base for broad plateaus, corries and long mountain traverses.",
    character: "Large-scale upland terrain where navigation, wind and distance matter more than technical ground.",
    travel: travel([18.8, 2300], [21.4, 2150], [7.8, 2050, 1]),
    hikes: [
      hike("cairn-gorm", "Cairn Gorm and Ben Macdui", 1, 18, 1050, "Hard", "A substantial plateau circuit over two Munros.", [-3.66, 57.08], 1),
      hike("lairig-ghru", "Lairig Ghru traverse", 1, 30, 650, "Hard", "A long point-to-point through the heart of the range.", [-3.72, 57.05], 1.5),
    ],
    lodgings: [{ id: "glenmore", name: "Glenmore campsite", kind: "camping", nightlyCostDkk: 240 }],
  },
  {
    id: "snowdonia",
    name: "Llanberis",
    region: "Eryri / Snowdonia",
    country: "United Kingdom",
    countryCode: "GB",
    coordinates: [-4.13, 53.119],
    recommendedMonths: [4, 5, 6, 7, 8, 9, 10],
    summary: "A walkable mountain village for Yr Wyddfa and the rough ridges of northern Eryri.",
    character: "Rocky ridges and glacial cwms packed into a compact area, with many routes starting near villages.",
    travel: travel([14.6, 1950], [18.2, 2050], [7.1, 1950, 1]),
    hikes: [
      hike("snowdon-horseshoe", "Snowdon Horseshoe", 1, 12, 1100, "Expert", "An exposed scrambling circuit over Crib Goch.", [-4.07, 53.07], 0.65),
      hike("glyderau", "Glyderau traverse", 1, 12, 1050, "Hard", "Rocky summits and distinctive high-level terrain.", [-4.03, 53.1], 0.7),
    ],
    lodgings: [{ id: "llyn-gwynant", name: "Llyn Gwynant campsite", kind: "camping", nightlyCostDkk: 230 }],
  },
  {
    id: "chamonix",
    name: "Chamonix",
    region: "Mont Blanc massif",
    country: "France",
    countryCode: "FR",
    coordinates: [6.87, 45.923],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A dense alpine hub with lifts, trains and trails reaching every side of the valley.",
    character: "Glaciers, balcony paths and high passes, with excellent local transport and busy summer trails.",
    travel: travel([14.2, 2050], [18.3, 1950], [6.2, 1650, 0]),
    hikes: [
      hike("lac-blanc", "Lac Blanc via Flégère", 1, 12, 850, "Hard", "A balcony route facing the Mont Blanc range.", [6.88, 45.98], 0.55),
      hike("tour-mont-blanc", "Tour du Mont Blanc section", 3, 52, 2800, "Hard", "A three-day sample of the classic circuit.", [6.86, 45.88], 1.4),
    ],
    lodgings: [
      { id: "refuge-lac-blanc", name: "Refuge du Lac Blanc", kind: "hut", nightlyCostDkk: 720 },
      { id: "mer-de-glace-camp", name: "Les Arolles camping", kind: "camping", nightlyCostDkk: 260 },
    ],
  },
  {
    id: "zermatt",
    name: "Zermatt",
    region: "Valais Alps",
    country: "Switzerland",
    countryCode: "CH",
    coordinates: [7.748, 46.02],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A car-free high-alpine base below the Matterhorn with a dense network of marked routes.",
    character: "Big glaciated scenery, excellent rail access and expensive but efficient mountain infrastructure.",
    travel: travel([15.7, 2200], [17.6, 2100], [6.8, 1900, 0]),
    hikes: [
      hike("hornli", "Hörnlihütte trail", 1, 12, 1200, "Hard", "A steep approach toward the Matterhorn’s northeast ridge.", [7.68, 45.99], 0.65),
      hike("five-lakes", "Five Lakes walk", 1, 11, 620, "Moderate", "A varied circuit with repeated Matterhorn views.", [7.76, 46.01], 0.55),
    ],
    lodgings: [
      { id: "hornli-hut", name: "Hörnlihütte", kind: "hut", nightlyCostDkk: 1150 },
      { id: "taesch-camping", name: "Täsch campsite", kind: "camping", nightlyCostDkk: 330 },
    ],
  },
  {
    id: "cortina",
    name: "Cortina d’Ampezzo",
    region: "Dolomites",
    country: "Italy",
    countryCode: "IT",
    coordinates: [12.135, 46.54],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A central Dolomites base for high passes, rifugi and pale limestone towers.",
    character: "Well-served trailheads, dramatic rock architecture and a mix of ordinary hiking and protected routes.",
    travel: travel([15.1, 2200], [19.2, 2050], [7, 1750, 0]),
    hikes: [
      hike("tre-cime", "Tre Cime circuit", 1, 10, 480, "Moderate", "A famous loop beneath the three towers.", [12.3, 46.62], 0.55),
      hike("sorapis", "Lago di Sorapis", 1, 13, 650, "Hard", "A narrow and busy approach to a turquoise alpine lake.", [12.23, 46.55], 0.65),
      hike("alta-via", "Alta Via 1 opening stages", 3, 45, 2500, "Hard", "A multi-day rifugio journey through the northern Dolomites.", [12.05, 46.62], 1.5),
    ],
    lodgings: [
      { id: "locatelli", name: "Rifugio Locatelli", kind: "hut", nightlyCostDkk: 760 },
      { id: "roc-chetta", name: "Camping Rocchetta", kind: "camping", nightlyCostDkk: 250 },
    ],
  },
  {
    id: "innsbruck",
    name: "Innsbruck",
    region: "Tyrol",
    country: "Austria",
    countryCode: "AT",
    coordinates: [11.404, 47.269],
    recommendedMonths: [5, 6, 7, 8, 9, 10],
    summary: "An exceptionally connected city base with mountain routes beginning at the edge of town.",
    character: "A practical blend of urban transport, cable-car access and long limestone or alpine ridge days.",
    travel: travel([13.5, 1950], [15.8, 1750], [5.5, 1450, 0]),
    hikes: [
      hike("nordkette", "Nordkette traverse", 1, 13, 950, "Hard", "A high traverse directly above the city.", [11.39, 47.31], 0.6),
      hike("patscherkofel", "Patscherkofel ridge", 1, 16, 760, "Moderate", "A broad and accessible ridge south of Innsbruck.", [11.46, 47.2], 0.7),
    ],
    lodgings: [{ id: "pfeishutte", name: "Pfeishütte", kind: "hut", nightlyCostDkk: 680 }],
  },
  {
    id: "berchtesgaden",
    name: "Berchtesgaden",
    region: "Bavarian Alps",
    country: "Germany",
    countryCode: "DE",
    coordinates: [13.0, 47.63],
    recommendedMonths: [5, 6, 7, 8, 9, 10],
    summary: "A compact alpine valley around Königssee with well-developed trail and hut access.",
    character: "Steep limestone walls, forested approaches and high routes overlooking the lake.",
    travel: travel([12.3, 1800], [14.6, 1550], [5.9, 1450, 0]),
    hikes: [
      hike("watzmannhaus", "Watzmannhaus approach", 1, 14, 1320, "Hard", "A sustained climb to the hut below the Watzmann.", [12.92, 47.57], 0.7),
      hike("jenner", "Jenner to Königsbachalm", 1, 13, 620, "Moderate", "A high-level route above Königssee.", [13.03, 47.58], 0.65),
    ],
    lodgings: [
      { id: "watzmannhaus", name: "Watzmannhaus", kind: "hut", nightlyCostDkk: 650 },
      { id: "allweglehen", name: "Camping Allweglehen", kind: "camping", nightlyCostDkk: 245 },
    ],
  },
  {
    id: "kranjska-gora",
    name: "Kranjska Gora",
    region: "Julian Alps",
    country: "Slovenia",
    countryCode: "SI",
    coordinates: [13.786, 46.486],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A small alpine town for limestone summits, passes and Triglav approaches.",
    character: "Rugged white peaks, clear rivers and compact access, with some routes requiring secure scrambling.",
    travel: travel([15.3, 2150], [19.8, 1850], [6.8, 1650, 0]),
    hikes: [
      hike("slemenova", "Slemenova Špica", 1, 7, 620, "Moderate", "A short high-quality route from Vršič Pass.", [13.75, 46.45], 0.45),
      hike("triglav", "Triglav hut approach", 2, 26, 2100, "Expert", "A two-day high-mountain route with protected sections.", [13.84, 46.38], 1.1),
    ],
    lodgings: [
      { id: "triglavski-dom", name: "Triglavski dom", kind: "hut", nightlyCostDkk: 540 },
      { id: "spik-camping", name: "Špik alpine camping", kind: "camping", nightlyCostDkk: 210 },
    ],
  },
  {
    id: "zakopane",
    name: "Zakopane",
    region: "High Tatras",
    country: "Poland",
    countryCode: "PL",
    coordinates: [19.95, 49.299],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A busy but capable base for rugged Tatra ridges, valleys and mountain huts.",
    character: "Compact granite mountains with excellent marked trails, crowds on classics and frequent afternoon weather.",
    travel: travel([13.8, 1850], [17.4, 1550], [6.9, 1350, 0]),
    hikes: [
      hike("koscielec", "Kościelec", 1, 17, 1250, "Expert", "A steep and exposed granite summit day.", [20.0, 49.23], 0.75),
      hike("five-ponds", "Valley of Five Polish Ponds", 1, 20, 980, "Hard", "A long valley and lake circuit through the central Tatras.", [20.04, 49.21], 0.9),
    ],
    lodgings: [{ id: "murowaniec", name: "Murowaniec mountain hut", kind: "hut", nightlyCostDkk: 310 }],
  },
  {
    id: "picos",
    name: "Potes",
    region: "Picos de Europa",
    country: "Spain",
    countryCode: "ES",
    coordinates: [-4.62, 43.154],
    recommendedMonths: [5, 6, 7, 8, 9, 10],
    summary: "A stone-built valley base below steep limestone massifs and deep gorges.",
    character: "Dry-looking but weather-prone limestone, shepherd paths and major relief close to the coast.",
    travel: travel([20.7, 2600], [27.5, 2450], [8.2, 1950, 1]),
    hikes: [
      hike("fuente-de", "Fuente Dé to Horcados Rojos", 1, 15, 980, "Hard", "A high limestone route from the cable-car station.", [-4.79, 43.17], 0.8),
      hike("cares", "Cares Gorge", 1, 24, 620, "Hard", "A long path cut through the dramatic gorge walls.", [-4.87, 43.23], 1.1),
    ],
    lodgings: [{ id: "aliva", name: "Refugio de Áliva", kind: "hut", nightlyCostDkk: 430 }],
  },
  {
    id: "madeira",
    name: "Curral das Freiras",
    region: "Madeira",
    country: "Portugal",
    countryCode: "PT",
    coordinates: [-16.969, 32.72],
    recommendedMonths: [3, 4, 5, 6, 9, 10, 11],
    summary: "A volcanic mountain base for steep paths, cloud-forest traverses and high ridges.",
    character: "Deep green valleys and engineered levadas, with exposed paths and rapidly shifting cloud.",
    travel: travel([39, 4200], null, [8.6, 2450, 1]),
    hikes: [
      hike("pico-ruivo", "Pico do Arieiro to Pico Ruivo", 1, 12, 1050, "Hard", "A dramatic paved and stepped traverse over Madeira’s highest ridges.", [-16.93, 32.75], 0.55),
      hike("encumeada", "Encumeada ridge", 1, 14, 1150, "Hard", "A quieter ridge route across the island’s central spine.", [-17.02, 32.75], 0.7),
    ],
    lodgings: [{ id: "pico-camp", name: "Central mountain campsite", kind: "camping", nightlyCostDkk: 140 }],
  },
  {
    id: "corsica",
    name: "Corte",
    region: "Corsica",
    country: "France",
    countryCode: "FR",
    coordinates: [9.15, 42.306],
    recommendedMonths: [5, 6, 7, 8, 9, 10],
    summary: "A historic inland base for granite gorges and central sections of the GR20.",
    character: "Dry granite, clear pools and hard multi-day walking with significant heat and exposure.",
    travel: travel([24, 3200], [29, 2950], [8.4, 2250, 1]),
    hikes: [
      hike("restonica", "Restonica lakes", 1, 12, 980, "Hard", "A steep granite route to Melo and Capitello lakes.", [9.04, 42.22], 0.7),
      hike("gr20-central", "GR20 central stages", 3, 38, 2800, "Expert", "A demanding three-day section of the GR20.", [9.08, 42.16], 1.4),
    ],
    lodgings: [{ id: "manganu", name: "Refuge de Manganu", kind: "hut", nightlyCostDkk: 310 }],
  },
  {
    id: "durmitor",
    name: "Žabljak",
    region: "Durmitor",
    country: "Montenegro",
    countryCode: "ME",
    coordinates: [19.123, 43.155],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A high plateau town surrounded by limestone summits, glacial lakes and deep canyons.",
    character: "Quiet rugged peaks, straightforward local access and fewer transport options than the central Alps.",
    travel: travel([21.2, 2650], [31, 2550], [9.4, 2150, 1]),
    hikes: [
      hike("bobotov-kuk", "Bobotov Kuk", 1, 13, 1100, "Hard", "A rocky ascent to the highest commonly climbed Durmitor summit.", [19.09, 43.13], 0.7),
      hike("crvena-greda", "Crvena Greda", 1, 12, 760, "Moderate", "A quieter ridge with wide views across the plateau.", [19.1, 43.2], 0.65),
    ],
    lodgings: [{ id: "ivan-do", name: "Ivan Do campsite", kind: "camping", nightlyCostDkk: 130 }],
  },
];

export const destinationById = new Map(destinations.map((item) => [item.id, item]));

export const countryOptions = Array.from(
  new Map(destinations.map((item) => [item.countryCode, item.country])).entries(),
).map(([code, name]) => ({ code, name }));

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatHours(value: number) {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}
