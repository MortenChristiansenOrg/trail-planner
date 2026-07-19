import { readFile } from "node:fs/promises";

const domains = new Set([
  "destination-core", "seasonality", "access", "hikes", "hike-geometry",
  "lodging", "travel-road", "travel-transit", "travel-flight", "media",
]);
const coverageStatuses = new Set(["missing", "partial", "fresh", "stale", "unavailable"]);
const sourceKinds = new Set(["official", "open-data", "provider", "community", "manual"]);
const confidenceLevels = new Set(["low", "medium", "high"]);

const files = process.argv.slice(2).filter((argument) => argument !== "--");
if (!files.length) {
  console.error("Usage: node scripts/catalog-data/validate-dossier.mjs <dossier.json> [...]");
  process.exit(2);
}

function validDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validate(dossier) {
  const errors = [];
  if (dossier?.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!dossier?.run?.id?.trim()) errors.push("run.id is required");
  if (!["add-destination", "refresh-data"].includes(dossier?.run?.task)) errors.push("run.task is invalid");
  if (!validDate(dossier?.run?.createdAt)) errors.push("run.createdAt must be an ISO date");
  if (dossier?.run?.tool !== "firecrawl-cli") errors.push("run.tool must be firecrawl-cli");
  if (!dossier?.destination?.key?.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) errors.push("destination.key must be kebab-case");
  if (!["add", "refresh"].includes(dossier?.destination?.action)) errors.push("destination.action is invalid");
  if (!Array.isArray(dossier?.claims) || !dossier.claims.length) errors.push("claims must contain at least one draft claim");
  if (!Array.isArray(dossier?.coverage) || !dossier.coverage.length) errors.push("coverage must contain at least one domain assessment");

  const claimKeys = new Set();
  for (const [index, claim] of (dossier?.claims ?? []).entries()) {
    const prefix = `claims[${index}]`;
    if (!domains.has(claim.domain)) errors.push(`${prefix}.domain is invalid`);
    if (!claim.subjectKey?.trim()) errors.push(`${prefix}.subjectKey is required`);
    if (!claim.field?.trim()) errors.push(`${prefix}.field is required`);
    if (claim.status !== "draft") errors.push(`${prefix}.status must be draft`);
    if (!claim.source?.key?.trim()) errors.push(`${prefix}.source.key is required`);
    if (!validUrl(claim.source?.url)) errors.push(`${prefix}.source.url must be HTTPS`);
    if (!sourceKinds.has(claim.source?.kind)) errors.push(`${prefix}.source.kind is invalid`);
    if (!validDate(claim.retrievedAt)) errors.push(`${prefix}.retrievedAt must be an ISO date`);
    if (claim.observedAt !== undefined && !validDate(claim.observedAt)) errors.push(`${prefix}.observedAt must be an ISO date`);
    if (claim.refreshAfter !== undefined && !validDate(claim.refreshAfter)) errors.push(`${prefix}.refreshAfter must be an ISO date`);
    if (!confidenceLevels.has(claim.confidence)) errors.push(`${prefix}.confidence is invalid`);
    if (!("value" in claim)) errors.push(`${prefix}.value is required; use null only for an evidenced unavailable claim`);
    const key = `${claim.domain}:${claim.subjectKey}:${claim.field}:${claim.source?.url}`;
    if (claimKeys.has(key)) errors.push(`${prefix} duplicates another claim`);
    claimKeys.add(key);
  }

  const coverageDomains = new Set();
  for (const [index, coverage] of (dossier?.coverage ?? []).entries()) {
    const prefix = `coverage[${index}]`;
    if (!domains.has(coverage.domain)) errors.push(`${prefix}.domain is invalid`);
    if (!coverageStatuses.has(coverage.status)) errors.push(`${prefix}.status is invalid`);
    if (!Array.isArray(coverage.reasons)) errors.push(`${prefix}.reasons must be an array`);
    if (coverageDomains.has(coverage.domain)) errors.push(`${prefix}.domain is duplicated`);
    coverageDomains.add(coverage.domain);
  }
  for (const claim of dossier?.claims ?? []) {
    if (!coverageDomains.has(claim.domain)) errors.push(`coverage is missing claimed domain ${claim.domain}`);
  }
  return errors;
}

let failed = false;
for (const file of files) {
  try {
    const dossier = JSON.parse(await readFile(file, "utf8"));
    const errors = validate(dossier);
    if (errors.length) {
      failed = true;
      console.error(`${file}: invalid`);
      for (const error of errors) console.error(`  - ${error}`);
    } else {
      console.log(`${file}: valid (${dossier.claims.length} claims, ${dossier.coverage.length} domains)`);
    }
  } catch (error) {
    failed = true;
    console.error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failed) process.exitCode = 1;
