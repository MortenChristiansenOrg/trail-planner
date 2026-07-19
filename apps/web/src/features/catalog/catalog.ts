export type TravelMode = "car" | "train" | "plane";

export type TravelEstimate = {
  mode: TravelMode;
  available: boolean;
  accessNode: string;
  oneWayHours: number;
  costPerPersonDkk: number;
  layovers?: number;
  note: string;
  confidence: "high" | "medium" | "low";
  optionId?: string;
};

export type CatalogProvenance = {
  sourceUrl: string;
  verifiedAt: string;
  confidence: "high" | "medium" | "low";
};

export type MediaLicense = "CC BY 2.0" | "CC BY-SA 3.0" | "CC BY-SA 4.0" | "CC0" | "Public domain";

export type CatalogMedia = {
  imageUrl: string;
  width: number;
  height: number;
  alt: string;
  subject: "destination" | "hike";
  kind: "terrain" | "trail" | "access";
  creator: string;
  license: MediaLicense;
  attributionText: string;
  attributionUrl: string;
  sourceUrl: string;
  verifiedAt: string;
};

const commonsMedia = {
  landmannalaugar: {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Landmannalaugar.jpeg",
    width: 2_979,
    height: 1_985,
    alt: "Rhyolite mountains and the Laugavegur trail at Landmannalaugar",
    subject: "destination",
    kind: "terrain",
    creator: "Andreas Tille",
    license: "CC BY-SA 4.0",
    attributionText: "Landmannalaugar by Andreas Tille · CC BY-SA 4.0",
    attributionUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Landmannalaugar.jpeg",
    verifiedAt: "2026-07-18",
  },
  kebnekaise: {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kebnekaise.JPEG",
    width: 3_777,
    height: 2_518,
    alt: "Kebnekaise mountain station below the Swedish Lapland massif",
    subject: "destination",
    kind: "terrain",
    creator: "Dianou42",
    license: "CC BY-SA 4.0",
    attributionText: "Kebnekaise by Dianou42 · CC BY-SA 4.0",
    attributionUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kebnekaise.JPEG",
    verifiedAt: "2026-07-18",
  },
  kungsleden: {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kungsleden%20trail.JPG",
    width: 1_600,
    height: 1_200,
    alt: "The Kungsleden trail crossing open fell between Alesjaure and Tjäktja",
    subject: "hike",
    kind: "trail",
    creator: "Shyguy24x7",
    license: "CC BY-SA 3.0",
    attributionText: "Kungsleden trail by Shyguy24x7 · CC BY-SA 3.0",
    attributionUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kungsleden_trail.JPG",
    verifiedAt: "2026-07-18",
  },
} satisfies Record<string, CatalogMedia>;

export type Hike = {
  id: string;
  name: string;
  durationDays: number;
  distanceKm: number;
  ascentM: number;
  difficulty: "Moderate" | "Hard" | "Expert";
  description: string;
  route: [number, number][];
  geometrySourceUrl?: string;
  provenance: CatalogProvenance;
  media?: CatalogMedia;
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
  provenance: CatalogProvenance;
  media?: CatalogMedia;
};

type DestinationSeed = Destination;

const catalogSource = (sourceUrl: string, confidence: CatalogProvenance["confidence"] = "low"): CatalogProvenance => ({
  sourceUrl,
  verifiedAt: "2026-07-18",
  confidence,
});

const travel = (
  car: [number, number],
  train: [number, number] | null,
  plane: [number, number, number] | null,
  accessNode: string,
): TravelEstimate[] => [
  {
    mode: "car",
    available: true,
    accessNode: `${accessNode} road access`,
    oneWayHours: car[0],
    costPerPersonDkk: car[1],
    note: "One-way drive time with estimated return costs, including road charges and crossings where relevant.",
    confidence: "medium",
  },
  train
    ? {
        mode: "train",
        available: true,
        accessNode: `${accessNode} public-transport stop`,
        oneWayHours: train[0],
        costPerPersonDkk: train[1],
        note: "One-way rail and bus time with estimated return costs; local reservations may be required.",
        confidence: "medium",
      }
    : {
        mode: "train",
        available: false,
        accessNode: `${accessNode} public-transport access`,
        oneWayHours: 0,
        costPerPersonDkk: 0,
        note: "No practical public-transport chain within the MVP trip window.",
        confidence: "high",
      },
  plane
    ? {
        mode: "plane",
        available: true,
        accessNode: `${accessNode} airport transfer`,
        oneWayHours: plane[0],
        costPerPersonDkk: plane[1],
        layovers: plane[2],
        note: "One-way journey time with estimated return airfare and ground transfers; not a live fare.",
        confidence: "low",
      }
    : {
        mode: "plane",
        available: false,
        accessNode: `${accessNode} airport transfer`,
        oneWayHours: 0,
        costPerPersonDkk: 0,
        layovers: 0,
        note: "No useful flight connection for this planning model.",
        confidence: "high",
      },
];

const withOption = (estimates: TravelEstimate[], mode: TravelMode, optionId: string) => estimates.map((estimate) => estimate.mode === mode ? { ...estimate, optionId } : estimate);

const catalogSeeds: DestinationSeed[] = [
  {
    id: "romsdalen",
    name: "Åndalsnes",
    region: "Romsdalen",
    country: "Norway",
    countryCode: "NO",
    coordinates: [7.687, 62.567],
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=62.567&mlon=7.687#map=12/62.567/7.687"),
    recommendedMonths: [6, 7, 8, 9],
    summary: "A compact fjord-and-ridge base with serious mountain days directly above town.",
    character: "Sharp ridges, deep valleys, exposed viewpoints and unusually easy access from the rail terminus.",
    travel: travel([12.4, 1700], [18.2, 2050], [7.3, 2550, 1], "Åndalsnes"),
    hikes: [],
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
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=61.495&mlon=8.997#map=12/61.495/8.997"),
    recommendedMonths: [7, 8, 9],
    summary: "A high-mountain gateway for classic ridge walks and hut-to-hut stages.",
    character: "Open alpine plateaus, turquoise lakes and rugged ridges, with the Gjende boat shaping several route days.",
    travel: travel([13.7, 1850], [20.4, 1850], [8.4, 2400, 1], "Gjendesheim"),
    hikes: [],
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
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=60.069&mlon=6.546#map=12/60.069/6.546"),
    recommendedMonths: [6, 7, 8, 9],
    summary: "A fjord town with access to long viewpoint hikes, glaciers and plateau terrain.",
    character: "Big vertical relief, waterfalls and long days where weather and shuttle timing matter.",
    travel: travel([11.8, 1650], [18.8, 1950], [7.8, 2450, 1], "Odda"),
    hikes: [],
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
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=68.234&mlon=14.568#map=12/68.234/14.568"),
    recommendedMonths: [6, 7, 8, 9],
    summary: "A sea-level base for short, steep hikes into dramatic coastal mountains.",
    character: "Granite peaks rising straight from the sea, rapidly changing weather and compact but demanding routes.",
    travel: travel([24.5, 3100], [31, 2850], [8.2, 3100, 1], "Svolvær"),
    hikes: [],
    lodgings: [{ id: "svolvaer-camping", name: "Svolvær coastal camping", kind: "camping", nightlyCostDkk: 320 }],
  },
  {
    id: "abisko",
    name: "Abisko",
    region: "Swedish Lapland",
    country: "Sweden",
    countryCode: "SE",
    coordinates: [18.829, 68.35],
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=68.35&mlon=18.829#map=12/68.35/18.829"),
    recommendedMonths: [7, 8, 9],
    summary: "A rail-accessible Arctic trailhead for valleys, high viewpoints and Kungsleden stages.",
    character: "Broad glacial valleys, birch forest and open fell with a reliable trail network but a short snow-free season.",
    travel: travel([22.5, 2550], [25.5, 1950], [8.7, 2850, 1], "Abisko"),
    hikes: [
      {
        id: "kungsleden-abisko-abiskojaure",
        name: "Kungsleden: Abisko to Abiskojaure",
        durationDays: 1,
        distanceKm: 15,
        ascentM: 100,
        difficulty: "Moderate",
        description: "The opening Kungsleden stage from Abisko through Abiskojåkka valley to Abiskojaure.",
        route: [
          [18.7777307, 68.3591456], [18.7755681, 68.3585646], [18.7729463, 68.3562157],
          [18.7668735, 68.3521157], [18.7641061, 68.3460663], [18.7643883, 68.3402696],
          [18.7589112, 68.3339583], [18.7568799, 68.3289019], [18.7451616, 68.3227214],
          [18.7380043, 68.3177102], [18.7227416, 68.3146239], [18.70224, 68.3128073],
          [18.680847, 68.3108586], [18.6650195, 68.3066996], [18.6498078, 68.2999424],
          [18.6274034, 68.2936046], [18.6103537, 68.2884782], [18.5931172, 68.2837446],
          [18.5903962, 68.2860527],
        ],
        geometrySourceUrl: "https://www.openstreetmap.org/relation/6289365",
        provenance: catalogSource("https://www.swedishtouristassociation.com/activities/kungsleden-abisko-kebnekaise-with-guide/", "high"),
        media: commonsMedia.kungsleden,
      },
      {
        id: "kungsleden-abiskojaure-alesjaure",
        name: "Kungsleden: Abiskojaure to Alesjaure",
        durationDays: 1,
        distanceKm: 21,
        ascentM: 300,
        difficulty: "Moderate",
        description: "The second Kungsleden stage, continuing south from Abiskojaure to Alesjaure.",
        route: [
          [18.5903962, 68.2860527], [18.591329, 68.282957], [18.585327, 68.276764],
          [18.580145, 68.266733], [18.5823092, 68.2621045], [18.59287, 68.255468],
          [18.599505, 68.237346], [18.575001, 68.22347], [18.558825, 68.214669],
          [18.532054, 68.204746], [18.4995726, 68.1972116], [18.488326, 68.1897325],
          [18.4702923, 68.1827565], [18.454842, 68.173925], [18.433837, 68.162164],
          [18.422763, 68.154664], [18.4165419, 68.1486247], [18.414216, 68.140748],
          [18.4141497, 68.136757],
        ],
        geometrySourceUrl: "https://www.openstreetmap.org/relation/8928539",
        provenance: catalogSource("https://www.swedishtouristassociation.com/activities/kungsleden-abisko-kebnekaise-with-guide/", "high"),
      },
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
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=56.819&mlon=-5.105#map=12/56.819/-5.105"),
    recommendedMonths: [5, 6, 7, 8, 9],
    summary: "A practical base below Ben Nevis with direct access to several of Scotland’s biggest mountain days.",
    character: "Wet, rugged mountains, long ridges and strong public-transport access by Highland standards.",
    travel: travel([17.9, 2250], [22.6, 2200], [8.1, 2100, 1], "Fort William"),
    hikes: [],
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
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=57.195&mlon=-3.829#map=12/57.195/-3.829"),
    recommendedMonths: [5, 6, 7, 8, 9],
    summary: "A rail-connected base for broad plateaus, corries and long mountain traverses.",
    character: "Large-scale upland terrain where navigation, wind and distance matter more than technical ground.",
    travel: travel([18.8, 2300], [21.4, 2150], [7.8, 2050, 1], "Aviemore"),
    hikes: [],
    lodgings: [{ id: "glenmore", name: "Glenmore campsite", kind: "camping", nightlyCostDkk: 240 }],
  },
  {
    id: "snowdonia",
    name: "Llanberis",
    region: "Eryri / Snowdonia",
    country: "United Kingdom",
    countryCode: "GB",
    coordinates: [-4.13, 53.119],
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=53.119&mlon=-4.13#map=12/53.119/-4.13"),
    recommendedMonths: [4, 5, 6, 7, 8, 9, 10],
    summary: "A walkable mountain village for Yr Wyddfa and the rough ridges of northern Eryri.",
    character: "Rocky ridges and glacial cwms packed into a compact area, with many routes starting near villages.",
    travel: travel([14.6, 1950], [18.2, 2050], [7.1, 1950, 1], "Llanberis"),
    hikes: [],
    lodgings: [{ id: "llyn-gwynant", name: "Llyn Gwynant campsite", kind: "camping", nightlyCostDkk: 230 }],
  },
  {
    id: "chamonix",
    name: "Chamonix",
    region: "Mont Blanc massif",
    country: "France",
    countryCode: "FR",
    coordinates: [6.87, 45.923],
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=45.923&mlon=6.87#map=12/45.923/6.87"),
    recommendedMonths: [6, 7, 8, 9],
    summary: "A dense alpine hub with lifts, trains and trails reaching every side of the valley.",
    character: "Glaciers, balcony paths and high passes, with excellent local transport and busy summer trails.",
    travel: travel([14.2, 2050], [18.3, 1950], [6.2, 1650, 0], "Chamonix"),
    hikes: [],
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
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=46.02&mlon=7.748#map=12/46.02/7.748"),
    recommendedMonths: [6, 7, 8, 9],
    summary: "A car-free high-alpine base below the Matterhorn with a dense network of marked routes.",
    character: "Big glaciated scenery, excellent rail access and expensive but efficient mountain infrastructure.",
    travel: travel([15.7, 2200], [17.6, 2100], [6.8, 1900, 0], "Zermatt"),
    hikes: [],
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
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=46.54&mlon=12.135#map=12/46.54/12.135"),
    recommendedMonths: [6, 7, 8, 9],
    summary: "A central Dolomites base for high passes, rifugi and pale limestone towers.",
    character: "Well-served trailheads, dramatic rock architecture and a mix of ordinary hiking and protected routes.",
    travel: travel([15.1, 2200], [19.2, 2050], [7, 1750, 0], "Cortina d’Ampezzo"),
    hikes: [],
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
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=47.269&mlon=11.404#map=12/47.269/11.404"),
    recommendedMonths: [5, 6, 7, 8, 9, 10],
    summary: "An exceptionally connected city base with mountain routes beginning at the edge of town.",
    character: "A practical blend of urban transport, cable-car access and long limestone or alpine ridge days.",
    travel: withOption(travel([13.5, 1950], [15.8, 1750], [5.5, 1450, 0], "Innsbruck"), "car", "osrm-driving-aalborg-innsbruck"),
    hikes: [],
    lodgings: [{ id: "pfeishutte", name: "Pfeishütte", kind: "hut", nightlyCostDkk: 680 }],
  },
  {
    id: "berchtesgaden",
    name: "Berchtesgaden",
    region: "Bavarian Alps",
    country: "Germany",
    countryCode: "DE",
    coordinates: [13.0, 47.63],
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=47.63&mlon=13.0#map=12/47.63/13.0"),
    recommendedMonths: [5, 6, 7, 8, 9, 10],
    summary: "A compact alpine valley around Königssee with well-developed trail and hut access.",
    character: "Steep limestone walls, forested approaches and high routes overlooking the lake.",
    travel: travel([12.3, 1800], [14.6, 1550], [5.9, 1450, 0], "Berchtesgaden"),
    hikes: [],
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
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=46.486&mlon=13.786#map=12/46.486/13.786"),
    recommendedMonths: [6, 7, 8, 9],
    summary: "A small alpine town for limestone summits, passes and Triglav approaches.",
    character: "Rugged white peaks, clear rivers and compact access, with some routes requiring secure scrambling.",
    travel: travel([15.3, 2150], [19.8, 1850], [6.8, 1650, 0], "Kranjska Gora"),
    hikes: [],
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
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=49.299&mlon=19.95#map=12/49.299/19.95"),
    recommendedMonths: [6, 7, 8, 9],
    summary: "A busy but capable base for rugged Tatra ridges, valleys and mountain huts.",
    character: "Compact granite mountains with excellent marked trails, crowds on classics and frequent afternoon weather.",
    travel: travel([13.8, 1850], [17.4, 1550], [6.9, 1350, 0], "Zakopane"),
    hikes: [],
    lodgings: [{ id: "murowaniec", name: "Murowaniec mountain hut", kind: "hut", nightlyCostDkk: 310 }],
  },
  {
    id: "picos",
    name: "Potes",
    region: "Picos de Europa",
    country: "Spain",
    countryCode: "ES",
    coordinates: [-4.62, 43.154],
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=43.154&mlon=-4.62#map=12/43.154/-4.62"),
    recommendedMonths: [5, 6, 7, 8, 9, 10],
    summary: "A stone-built valley base below steep limestone massifs and deep gorges.",
    character: "Dry-looking but weather-prone limestone, shepherd paths and major relief close to the coast.",
    travel: travel([20.7, 2600], [27.5, 2450], [8.2, 1950, 1], "Potes"),
    hikes: [],
    lodgings: [{ id: "aliva", name: "Refugio de Áliva", kind: "hut", nightlyCostDkk: 430 }],
  },
  {
    id: "madeira",
    name: "Curral das Freiras",
    region: "Madeira",
    country: "Portugal",
    countryCode: "PT",
    coordinates: [-16.969, 32.72],
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=32.72&mlon=-16.969#map=12/32.72/-16.969"),
    recommendedMonths: [3, 4, 5, 6, 9, 10, 11],
    summary: "A volcanic mountain base for steep paths, cloud-forest traverses and high ridges.",
    character: "Deep green valleys and engineered levadas, with exposed paths and rapidly shifting cloud.",
    travel: travel([39, 4200], null, [8.6, 2450, 1], "Curral das Freiras"),
    hikes: [],
    lodgings: [{ id: "pico-camp", name: "Central mountain campsite", kind: "camping", nightlyCostDkk: 140 }],
  },
  {
    id: "corsica",
    name: "Corte",
    region: "Corsica",
    country: "France",
    countryCode: "FR",
    coordinates: [9.15, 42.306],
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=42.306&mlon=9.15#map=12/42.306/9.15"),
    recommendedMonths: [5, 6, 7, 8, 9, 10],
    summary: "A historic inland base for granite gorges and central sections of the GR20.",
    character: "Dry granite, clear pools and hard multi-day walking with significant heat and exposure.",
    travel: travel([24, 3200], [29, 2950], [8.4, 2250, 1], "Corte"),
    hikes: [],
    lodgings: [{ id: "manganu", name: "Refuge de Manganu", kind: "hut", nightlyCostDkk: 310 }],
  },
  {
    id: "durmitor",
    name: "Žabljak",
    region: "Durmitor",
    country: "Montenegro",
    countryCode: "ME",
    coordinates: [19.123, 43.155],
    provenance: catalogSource("https://www.openstreetmap.org/?mlat=43.155&mlon=19.123#map=12/43.155/19.123"),
    recommendedMonths: [6, 7, 8, 9],
    summary: "A high plateau town surrounded by limestone summits, glacial lakes and deep canyons.",
    character: "Quiet rugged peaks, straightforward local access and fewer transport options than the central Alps.",
    travel: travel([21.2, 2650], [31, 2550], [9.4, 2150, 1], "Žabljak"),
    hikes: [],
    lodgings: [{ id: "ivan-do", name: "Ivan Do campsite", kind: "camping", nightlyCostDkk: 130 }],
  },
  {
    id: "landmannalaugar",
    name: "Landmannalaugar",
    region: "Fjallabak Highlands",
    country: "Iceland",
    countryCode: "IS",
    coordinates: [-19.06, 63.992],
    recommendedMonths: [7, 8, 9],
    summary: "A seasonal highland-bus trailhead among rhyolite ridges, lava fields and hot springs.",
    character: "Colourful volcanic terrain with exposed highland weather and river-crossing logistics on the access roads.",
    travel: travel([45, 6900], null, [8.2, 3800, 1], "Landmannalaugar"),
    hikes: [],
    lodgings: [{ id: "landmannalaugar-hut", name: "FÍ Landmannalaugar hut", kind: "hut", nightlyCostDkk: 820 }],
    provenance: {
      sourceUrl: "https://www.fi.is/en/hiking-trails/landmannalaugar",
      verifiedAt: "2026-07-18",
      confidence: "high",
    },
    media: commonsMedia.landmannalaugar,
  },
  {
    id: "thorsmork",
    name: "Þórsmörk",
    region: "Southern Highlands",
    country: "Iceland",
    countryCode: "IS",
    coordinates: [-19.482, 63.683],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A sheltered highland valley and major Laugavegur access point between glaciers and braided rivers.",
    character: "Birch-covered ridges, dark volcanic gullies and glacier views, reached by specialist highland buses.",
    travel: travel([44, 6800], null, [7.7, 3700, 1], "Þórsmörk"),
    hikes: [],
    lodgings: [{ id: "basar-hut", name: "Básar hut and campsite", kind: "hut", nightlyCostDkk: 760 }],
    provenance: {
      sourceUrl: "https://www.utivist.is/english/basar-hut/",
      verifiedAt: "2026-07-18",
      confidence: "medium",
    },
  },
  {
    id: "skaftafell",
    name: "Skaftafell",
    region: "Vatnajökull National Park",
    country: "Iceland",
    countryCode: "IS",
    coordinates: [-16.966, 64.016],
    recommendedMonths: [5, 6, 7, 8, 9],
    summary: "A staffed national-park hub for waterfalls, glacier viewpoints and varied day walks.",
    character: "Green slopes beneath ice-capped peaks, with marked paths radiating from a visitor centre and campground.",
    travel: travel([49, 7400], null, [9.1, 4100, 1], "Skaftafell"),
    hikes: [],
    lodgings: [{ id: "skaftafell-camping", name: "Skaftafell campground", kind: "camping", nightlyCostDkk: 190 }],
    provenance: {
      sourceUrl: "https://www.vatnajokulsthjodgardur.is/en/areas/skaftafell",
      verifiedAt: "2026-07-18",
      confidence: "high",
    },
  },
  {
    id: "akureyri",
    name: "Akureyri",
    region: "North Iceland",
    country: "Iceland",
    countryCode: "IS",
    coordinates: [-18.09, 65.683],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A practical northern transport base for the Mývatn region, Tröllaskagi and longer onward journeys.",
    character: "A fjord-side logistics hub linking gentler geothermal landscapes with steep peninsula mountains.",
    travel: travel([51, 7600], null, [7.5, 3900, 1], "Akureyri"),
    hikes: [],
    lodgings: [{ id: "hamrar-camping", name: "Hamrar campsite", kind: "camping", nightlyCostDkk: 165 }],
    provenance: {
      sourceUrl: "https://www.visitakureyri.is/en/see-and-do/hiking",
      verifiedAt: "2026-07-18",
      confidence: "medium",
    },
  },
  {
    id: "nikkaluokta",
    name: "Nikkaluokta",
    region: "Kebnekaise massif",
    country: "Sweden",
    countryCode: "SE",
    coordinates: [19.01, 67.85],
    recommendedMonths: [7, 8, 9],
    summary: "The road-end gateway for Kebnekaise mountain station and the surrounding Lapland valleys.",
    character: "Mountain birch forest opening into broad glacial valleys beneath Sweden’s highest massif.",
    travel: travel([22.3, 2600], [26, 2100], [8.5, 2900, 1], "Nikkaluokta"),
    hikes: [],
    lodgings: [{ id: "nikkaluokta-sarri", name: "Nikkaluokta Sarri", kind: "hut", nightlyCostDkk: 690 }],
    provenance: {
      sourceUrl: "https://nikkaluokta.com/en/what-to-do/summer-activities/mountain-hiking",
      verifiedAt: "2026-07-18",
      confidence: "high",
    },
    media: commonsMedia.kebnekaise,
  },
  {
    id: "hemavan",
    name: "Hemavan",
    region: "Vindelfjällen",
    country: "Sweden",
    countryCode: "SE",
    coordinates: [15.086, 65.82],
    recommendedMonths: [6, 7, 8, 9],
    summary: "The southern Kungsleden terminus with direct access to marked fell routes and serviced huts.",
    character: "Rounded fells, large protected valleys and a gentle transition from village access to multi-day wilderness.",
    travel: travel([18.4, 2200], [24, 1950], [7.6, 2700, 1], "Hemavan"),
    hikes: [],
    lodgings: [{ id: "hemavan-fjallcenter", name: "Hemavan Fjällcenter", kind: "hut", nightlyCostDkk: 620 }],
    provenance: {
      sourceUrl: "https://hemavan.nu/en/see-and-do-summer/hiking/",
      verifiedAt: "2026-07-18",
      confidence: "high",
    },
  },
  {
    id: "are",
    name: "Åre",
    region: "Jämtland",
    country: "Sweden",
    countryCode: "SE",
    coordinates: [13.081, 63.399],
    recommendedMonths: [6, 7, 8, 9],
    summary: "A rail-connected mountain town with lifts, services and access into the Jämtland trail network.",
    character: "Accessible fell terrain, waterfalls and broad viewpoints supported by unusually strong village logistics.",
    travel: travel([13.2, 1800], [17.5, 1450], [7.2, 2600, 1], "Åre"),
    hikes: [],
    lodgings: [{ id: "are-camping", name: "Åre camping", kind: "camping", nightlyCostDkk: 235 }],
    provenance: {
      sourceUrl: "https://aresweden.com/en/hiking-in-are/",
      verifiedAt: "2026-07-18",
      confidence: "medium",
    },
  },
];

const supportedLicenses = new Set<MediaLicense>(["CC BY 2.0", "CC BY-SA 3.0", "CC BY-SA 4.0", "CC0", "Public domain"]);
const confidenceLevels = new Set<CatalogProvenance["confidence"]>(["high", "medium", "low"]);
const mediaKinds = new Set<CatalogMedia["kind"]>(["terrain", "trail", "access"]);
const travelModes = new Set<TravelMode>(["car", "train", "plane"]);

function validateSource(provenance: CatalogProvenance, label: string) {
  if (!isHttpsUrl(provenance.sourceUrl) || !isVerificationDate(provenance.verifiedAt)) throw new Error(`${label}: missing or invalid provenance`);
  if (!confidenceLevels.has(provenance.confidence)) throw new Error(`${label}: invalid provenance confidence`);
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isVerificationDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validCoordinates([longitude, latitude]: [number, number]) {
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

export function validateCatalog(items: Destination[]) {
  const ids = new Set<string>();
  for (const destination of items) {
    if (ids.has(destination.id)) throw new Error(`Duplicate destination id: ${destination.id}`);
    ids.add(destination.id);
    validateSource(destination.provenance, destination.name);
    if (!destination.character.trim()) throw new Error(`${destination.name}: missing terrain character`);
    if (!destination.recommendedMonths.length || destination.recommendedMonths.some((month) => !Number.isInteger(month) || month < 1 || month > 12)) throw new Error(`${destination.name}: invalid recommended months`);
    if (!validCoordinates(destination.coordinates)) throw new Error(`${destination.name}: invalid coordinates`);
    const destinationModes = new Set(destination.travel.map((estimate) => estimate.mode));
    if (destination.travel.length !== travelModes.size || destinationModes.size !== travelModes.size || [...travelModes].some((mode) => !destinationModes.has(mode))) throw new Error(`${destination.name}: missing travel nodes`);
    for (const estimate of destination.travel) {
      if (!confidenceLevels.has(estimate.confidence)) throw new Error(`${destination.name}: invalid travel confidence`);
      if (!estimate.accessNode.trim() || !estimate.note.trim() || typeof estimate.available !== "boolean") throw new Error(`${destination.name}: invalid travel node`);
      if (!Number.isFinite(estimate.oneWayHours) || estimate.oneWayHours < 0 || !Number.isFinite(estimate.costPerPersonDkk) || estimate.costPerPersonDkk < 0) throw new Error(`${destination.name}: invalid travel estimate`);
      if (estimate.layovers !== undefined && (!Number.isInteger(estimate.layovers) || estimate.layovers < 0)) throw new Error(`${destination.name}: invalid layover count`);
    }
    const hikeIds = new Set<string>();
    for (const hike of destination.hikes) {
      if (hikeIds.has(hike.id)) throw new Error(`${destination.name}: duplicate hike id ${hike.id}`);
      hikeIds.add(hike.id);
      validateSource(hike.provenance, hike.name);
      if (!Number.isInteger(hike.durationDays) || hike.durationDays < 1 || !Number.isFinite(hike.distanceKm) || hike.distanceKm <= 0 || !Number.isFinite(hike.ascentM) || hike.ascentM < 0) throw new Error(`${hike.name}: invalid route metrics`);
      if (hike.route.length === 1) throw new Error(`${hike.name}: route must contain at least two coordinates`);
      if (hike.route.length && !hike.geometrySourceUrl) throw new Error(`${hike.name}: published geometry is missing provenance`);
      if (hike.geometrySourceUrl && !isHttpsUrl(hike.geometrySourceUrl)) throw new Error(`${hike.name}: invalid geometry provenance`);
      if (hike.route.some((coordinates) => !validCoordinates(coordinates))) throw new Error(`${hike.name}: invalid route coordinates`);
      if (hike.media) validateMedia(hike.media, hike.name, "hike");
    }
    for (const lodging of destination.lodgings) {
      if (!lodging.id.trim() || !lodging.name.trim() || !Number.isFinite(lodging.nightlyCostDkk) || lodging.nightlyCostDkk < 0) throw new Error(`${destination.name}: invalid lodging`);
    }
    if (destination.media) validateMedia(destination.media, destination.name, "destination");
  }
  return items;
}

function validateMedia(media: CatalogMedia, label: string, expectedSubject: CatalogMedia["subject"]) {
  if (!mediaKinds.has(media.kind)) throw new Error(`${label}: invalid media kind`);
  if (!isHttpsUrl(media.imageUrl) || !media.alt.trim() || !media.creator.trim() || !media.attributionText.trim() || !isHttpsUrl(media.attributionUrl) || !isHttpsUrl(media.sourceUrl) || !isVerificationDate(media.verifiedAt)) throw new Error(`${label}: incomplete media provenance`);
  if (!Number.isInteger(media.width) || media.width < 1 || !Number.isInteger(media.height) || media.height < 1) throw new Error(`${label}: invalid media dimensions`);
  if (!supportedLicenses.has(media.license)) throw new Error(`${label}: unsupported media license`);
  if (media.subject !== expectedSubject) throw new Error(`${label}: media subject must be ${expectedSubject}`);
}

export const destinations: Destination[] = validateCatalog(catalogSeeds);

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
