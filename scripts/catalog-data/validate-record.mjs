import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const domains = new Set([
  "destination-core", "seasonality", "access", "hikes", "hike-geometry",
  "lodging", "travel-road", "travel-transit", "travel-flight", "media",
]);
const coverageStatuses = new Set(["missing", "partial", "fresh", "stale", "unavailable"]);
const sourceKinds = new Set(["official", "open-data", "provider", "community", "manual"]);
const confidenceLevels = new Set(["low", "medium", "high"]);
const runTools = new Set(["firecrawl-cli", "provider-api"]);

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function validUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && Boolean(value.trim());
}

export function validateCatalogRecord(record) {
  const errors = [];
  if (record?.schemaVersion !== 2) errors.push("schemaVersion must be 2");
  if (!isNonEmptyString(record?.run?.id)) errors.push("run.id is required");
  if (!["add-destination", "refresh-data"].includes(record?.run?.task)) errors.push("run.task is invalid");
  if (!validDate(record?.run?.createdAt)) errors.push("run.createdAt must be an ISO date");
  if (!runTools.has(record?.run?.tool)) errors.push("run.tool is invalid");
  if (typeof record?.destination?.key !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.destination.key)) errors.push("destination.key must be kebab-case");
  if (!["add", "refresh"].includes(record?.destination?.action)) errors.push("destination.action is invalid");
  if (!isNonEmptyString(record?.destination?.name)) errors.push("destination.name is required");
  if (!isNonEmptyString(record?.destination?.region)) errors.push("destination.region is required");
  if (typeof record?.destination?.countryCode !== "string" || !/^[A-Z]{2}$/.test(record.destination.countryCode)) errors.push("destination.countryCode must be a two-letter uppercase code");
  if (!Number.isFinite(record?.destination?.longitude) || record.destination.longitude < -180 || record.destination.longitude > 180) errors.push("destination.longitude must be between -180 and 180");
  if (!Number.isFinite(record?.destination?.latitude) || record.destination.latitude < -90 || record.destination.latitude > 90) errors.push("destination.latitude must be between -90 and 90");
  if (!Array.isArray(record?.claims) || !record.claims.length) errors.push("claims must contain at least one published claim");
  if (!Array.isArray(record?.coverage) || !record.coverage.length) errors.push("coverage must contain at least one domain assessment");

  const claimKeys = new Set();
  const claims = Array.isArray(record?.claims) ? record.claims : [];
  for (const [index, claim] of claims.entries()) {
    const prefix = `claims[${index}]`;
    if (!isObject(claim)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    if (!domains.has(claim.domain)) errors.push(`${prefix}.domain is invalid`);
    if (!isNonEmptyString(claim.subjectKey)) errors.push(`${prefix}.subjectKey is required`);
    if (!isNonEmptyString(claim.field)) errors.push(`${prefix}.field is required`);
    if ("status" in claim) errors.push(`${prefix}.status is forbidden; record claims are published after validation`);
    if (!isObject(claim.source)) errors.push(`${prefix}.source must be an object`);
    if (!isNonEmptyString(claim.source?.key)) errors.push(`${prefix}.source.key is required`);
    if (!validUrl(claim.source?.url)) errors.push(`${prefix}.source.url must be HTTPS`);
    if (!sourceKinds.has(claim.source?.kind)) errors.push(`${prefix}.source.kind is invalid`);
    if (!validDate(claim.retrievedAt)) errors.push(`${prefix}.retrievedAt must be an ISO date`);
    if (claim.observedAt !== undefined && !validDate(claim.observedAt)) errors.push(`${prefix}.observedAt must be an ISO date`);
    if (!validDate(claim.refreshAfter)) errors.push(`${prefix}.refreshAfter must be an ISO date`);
    if (!confidenceLevels.has(claim.confidence)) errors.push(`${prefix}.confidence is invalid`);
    if (!("value" in claim)) errors.push(`${prefix}.value is required; use null only for an evidenced unavailable claim`);
    if (domains.has(claim.domain) && isNonEmptyString(claim.subjectKey) && isNonEmptyString(claim.field) && validUrl(claim.source?.url)) {
      const key = `${claim.domain}:${claim.subjectKey}:${claim.field}:${claim.source.url}`;
      if (claimKeys.has(key)) errors.push(`${prefix} duplicates another claim`);
      claimKeys.add(key);
    }
  }

  const coverageDomains = new Set();
  const coverageItems = Array.isArray(record?.coverage) ? record.coverage : [];
  for (const [index, coverage] of coverageItems.entries()) {
    const prefix = `coverage[${index}]`;
    if (!isObject(coverage)) {
      errors.push(`${prefix} must be an object`);
      continue;
    }
    if (!domains.has(coverage.domain)) errors.push(`${prefix}.domain is invalid`);
    if (!coverageStatuses.has(coverage.status)) errors.push(`${prefix}.status is invalid`);
    if (!Array.isArray(coverage.reasons)) errors.push(`${prefix}.reasons must be an array`);
    if (domains.has(coverage.domain)) {
      if (coverageDomains.has(coverage.domain)) errors.push(`${prefix}.domain is duplicated`);
      coverageDomains.add(coverage.domain);
    }
  }
  for (const claim of claims) {
    if (isObject(claim) && domains.has(claim.domain) && !coverageDomains.has(claim.domain)) errors.push(`coverage is missing claimed domain ${claim.domain}`);
  }
  return errors;
}

async function runCli() {
  const files = process.argv.slice(2).filter((argument) => argument !== "--");
  if (!files.length) {
    console.error("Usage: node scripts/catalog-data/validate-record.mjs <record.json> [...]");
    process.exitCode = 2;
    return;
  }

  let failed = false;
  for (const file of files) {
    try {
      const record = JSON.parse(await readFile(file, "utf8"));
      const errors = validateCatalogRecord(record);
      if (errors.length) {
        failed = true;
        console.error(`${file}: invalid`);
        for (const error of errors) console.error(`  - ${error}`);
      } else {
        console.log(`${file}: valid (${record.claims.length} claims, ${record.coverage.length} domains)`);
      }
    } catch (error) {
      failed = true;
      console.error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (failed) process.exitCode = 1;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await runCli();
