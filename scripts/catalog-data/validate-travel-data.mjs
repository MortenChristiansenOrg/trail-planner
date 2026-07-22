import { readFile, readdir } from "node:fs/promises";
import { validateCatalogTravelData } from "../../packages/domain/src/catalogTravel.ts";

const [partFile, planFile, recordFiles] = await Promise.all([
  readFile("data/catalog/travel-parts.json", "utf8").then(JSON.parse),
  readFile("data/catalog/trip-plans.json", "utf8").then(JSON.parse),
  readdir("data/catalog/records").then((files) => files.filter((file) => file.endsWith(".json"))),
]);
const records = await Promise.all(recordFiles.map((file) =>
  readFile(`data/catalog/records/${file}`, "utf8").then(JSON.parse),
));
const exploreNorwayDestinations = ["andalsnes", "gjendesheim", "odda", "svolvaer"];
const destinationKeys = [...records.map((record) => record.destination.key), ...exploreNorwayDestinations];
const countryCodeByDestination = new Map([
  ...records.map((record) => [record.destination.key, record.destination.countryCode]),
  ...exploreNorwayDestinations.map((key) => [key, "NO"]),
]);
const errors = validateCatalogTravelData(partFile, planFile, destinationKeys, countryCodeByDestination);

const requiredMajorFerryParts = [
  "color-line-hirtshals-kristiansand",
  "color-line-hirtshals-larvik",
  "fjord-fstr-hirtshals-kristiansand",
  "fjord-cruise-hirtshals-kristiansand",
  "fjord-line-hirtshals-stavanger",
  "fjord-line-hirtshals-bergen",
  "go-nordic-copenhagen-oslo",
  "stena-frederikshavn-gothenburg",
  "scandlines-rodby-puttgarden",
  "scandlines-gedser-rostock",
  "oresundslinjen-helsingor-helsingborg",
  "smyril-hirtshals-torshavn",
  "smyril-hirtshals-seydisfjordur",
];
const partKeys = new Set(partFile.parts.map((part) => part.key));
for (const key of requiredMajorFerryParts) {
  if (!partKeys.has(key)) errors.push(`missing major ferry part ${key}`);
}

if (errors.length) {
  console.error("Catalog travel data is invalid:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const unavailableModes = planFile.plans.reduce((count, plan) =>
  count + Object.values(plan.modes).filter((mode) => mode.status === "details-unavailable").length, 0);
console.log(`Catalog travel data is valid (${partFile.parts.length} reusable parts, ${planFile.plans.length} complete destination matrices, ${unavailableModes} explicit unavailable mode states)`);
