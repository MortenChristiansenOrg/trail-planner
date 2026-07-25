import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateCatalogRecord } from "./validate-record.mjs";
import { assessProductRecord } from "./product-record.mjs";

const recordsDirectory = resolve("data/catalog/records");
const expectationsPath = resolve("data/catalog/expectations.json");
const outputPaths = {
  digest: resolve("data/catalog/generated/digest.json"),
  details: resolve("data/catalog/generated/details.json"),
  deployment: resolve("data/catalog/generated/deployment.json"),
  coverage: resolve("data/catalog/generated/coverage.json"),
  reconciliation: resolve("data/catalog/generated/reconciliation.json"),
  webDigest: resolve("apps/web/src/generated/catalogDigest.ts"),
  webDetails: resolve("apps/web/src/generated/catalogDetails.ts"),
  convex: resolve("convex/generated/catalogDeployment.ts"),
};

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function serialize(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

export function catalogVersionForRecords(records) {
  const versionInputs = [...records]
    .sort((left, right) =>
      left.destination.key.localeCompare(right.destination.key)
    )
    .map((record) => stable({
      schemaVersion: record.schemaVersion,
      destination: record.destination,
      claims: record.claims,
      coverage: record.coverage,
    }));
  return createHash("sha256").update(JSON.stringify(versionInputs)).digest("hex");
}

function provenance(record) {
  const seen = new Set();
  return record.claims.flatMap((claim) => {
    const key = `${claim.source.key}:${claim.source.url}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{
      sourceKey: claim.source.key,
      sourceUrl: claim.source.url,
      verifiedAt: claim.retrievedAt.slice(0, 10),
      confidence: claim.confidence,
    }];
  });
}

function createDigest(record, assessment, catalogVersion) {
  const destinationProvenance = provenance(record).find(({ sourceKey }) =>
    record.claims.some((claim) =>
      claim.domain === "destination-core" &&
      claim.source.key === sourceKey
    )
  );
  if (!destinationProvenance) {
    throw new Error(`${record.destination.key}: destination provenance is missing`);
  }
  return {
    destinationKey: record.destination.key,
    aliases: assessment.aliases,
    name: record.destination.name,
    region: record.destination.region,
    country: assessment.country,
    countryCode: record.destination.countryCode,
    coordinates: [record.destination.longitude, record.destination.latitude],
    recommendedMonths: assessment.recommendedMonths,
    summary: assessment.summary,
    character: assessment.character,
    provenance: destinationProvenance,
    hero: assessment.hero,
    hikeCount: assessment.hikeCount,
    travel: assessment.travel,
    lodgings: assessment.lodgings,
    catalogVersion,
  };
}

async function writeGenerated(path, contents, check) {
  if (check) {
    let current;
    try {
      current = await readFile(path, "utf8");
    } catch {
      throw new Error(`${path} is missing; run pnpm catalog:compile`);
    }
    if (current !== contents) throw new Error(`${path} has generated drift; run pnpm catalog:compile`);
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(temporaryPath, contents);
  await rename(temporaryPath, path);
}

export async function compileCatalog({
  check = false,
  emit = true,
  recordOverrides = new Map(),
} = {}) {
  const expectations = JSON.parse(await readFile(expectationsPath, "utf8"));
  if (
    !Number.isSafeInteger(expectations?.minimumVisibleDestinations) ||
    expectations.minimumVisibleDestinations < 0
  ) {
    throw new Error("data/catalog/expectations.json minimumVisibleDestinations must be a non-negative safe integer");
  }
  const filenames = [...new Set([
    ...(await readdir(recordsDirectory)).filter((filename) => filename.endsWith(".json")),
    ...recordOverrides.keys(),
  ])]
    .filter((filename) => filename.endsWith(".json"))
    .sort();
  const records = [];
  const failures = [];
  for (const filename of filenames) {
    const path = join(recordsDirectory, filename);
    const record = recordOverrides.has(filename)
      ? recordOverrides.get(filename)
      : JSON.parse(await readFile(path, "utf8"));
    const errors = validateCatalogRecord(record);
    if (errors.length) failures.push(...errors.map((error) => `${filename}: ${error}`));
    records.push(record);
  }
  if (failures.length) throw new Error(`Catalog records are invalid:\n${failures.join("\n")}`);

  const productRecords = records.filter((record) => record.schemaVersion === 3);
  const catalogVersion = catalogVersionForRecords(records);
  const coverage = records
    .filter((record) => record.schemaVersion !== 3)
    .map((record) => ({
      destinationKey: record.destination.key,
      visible: false,
      ready: false,
      guideWords: 0,
      hikeCount: 0,
      difficultyCount: 0,
      durationBandCount: 0,
      hasHero: false,
      gaps: record.coverage
        .filter(({ status }) => status !== "fresh")
        .map(({ domain, status }) => `${domain}: ${status}`),
    }));
  const visible = [];
  const identityOwners = new Map();
  for (const record of productRecords) {
    const assessment = assessProductRecord(record);
    const isVisible = record.destination.visibility === "visible";
    coverage.push({
      destinationKey: record.destination.key,
      visible: isVisible,
      ready: assessment.ready,
      guideWords: assessment.guideWords,
      hikeCount: assessment.hikeCount,
      difficultyCount: assessment.difficultyCount,
      durationBandCount: assessment.durationBandCount,
      hasHero: Boolean(assessment.hero),
      gaps: [...assessment.errors, ...assessment.gaps],
    });
    for (const identity of [record.destination.key, ...assessment.aliases]) {
      const owner = identityOwners.get(identity);
      if (owner) failures.push(`ambiguous destination identity ${identity}: ${owner} and ${record.destination.key}`);
      identityOwners.set(identity, record.destination.key);
    }
    if (!isVisible) continue;
    if (assessment.hero?.imageUrl?.startsWith("/catalog-media/")) {
      try {
        const asset = await readFile(resolve("apps/web/public", assessment.hero.imageUrl.slice(1)));
        const assetHash = createHash("sha256").update(asset).digest("hex");
        if (assetHash !== assessment.hero.assetSha256) {
          failures.push(`${record.destination.key}: hero asset hash does not match ${assessment.hero.imageUrl}`);
        }
      } catch {
        failures.push(`${record.destination.key}: hero asset is missing at ${assessment.hero.imageUrl}`);
      }
    }
    if (!assessment.ready) failures.push(`${record.destination.key}: visible record is not ready (${[...assessment.errors, ...assessment.gaps].join(", ")})`);
    visible.push({ record, assessment });
  }
  if (visible.length < expectations.minimumVisibleDestinations) {
    failures.push(`expected at least ${expectations.minimumVisibleDestinations} visible destinations, found ${visible.length}`);
  }
  if (failures.length) throw new Error(`Catalog compilation failed:\n${failures.join("\n")}`);

  const digest = visible.map(({ record, assessment }) => createDigest(record, assessment, catalogVersion));
  const details = Object.fromEntries(visible.map(({ record, assessment }) => [
    record.destination.key,
    {
      destinationKey: record.destination.key,
      guide: assessment.guide,
      hero: assessment.hero,
      hikes: assessment.hikes,
      provenance: provenance(record),
      catalogVersion,
    },
  ]));
  const deploymentPayload = {
    schemaVersion: 1,
    catalogVersion,
    expected: {
      destinations: digest.length,
      hikes: Object.values(details).reduce((sum, detail) => sum + detail.hikes.length, 0),
      coverage: coverage.length,
    },
    digests: digest,
    details,
    coverage,
  };
  const artifactHash = createHash("sha256")
    .update(JSON.stringify(stable(deploymentPayload)))
    .digest("hex");
  const deployment = { ...deploymentPayload, artifactHash };
  const reconciliation = records.map((record) => {
    const canonical = identityOwners.get(record.destination.key);
    return {
      recordKey: record.destination.key,
      status: canonical === record.destination.key
        ? (record.destination.visibility === "visible" ? "exact-match" : "intentionally-separate")
        : canonical ? "alias-merge" : "intentionally-separate",
      canonicalKey: canonical,
      visible: record.destination.visibility === "visible",
    };
  });

  if (emit) {
    await Promise.all([
      writeGenerated(outputPaths.digest, serialize({ catalogVersion, destinations: digest }), check),
      writeGenerated(outputPaths.details, serialize({ catalogVersion, details }), check),
      writeGenerated(outputPaths.deployment, serialize(deployment), check),
      writeGenerated(outputPaths.coverage, serialize({ catalogVersion, destinations: coverage }), check),
      writeGenerated(outputPaths.reconciliation, serialize({ catalogVersion, records: reconciliation }), check),
      writeGenerated(outputPaths.webDigest, `/* Generated by pnpm catalog:compile. Do not edit. */\nimport type { CatalogDestinationDigest } from "@trail-planner/domain";\n\nexport const catalogVersion = ${JSON.stringify(catalogVersion)};\nexport const catalogDigest = ${JSON.stringify(digest, null, 2)} satisfies CatalogDestinationDigest[];\n`, check),
      writeGenerated(outputPaths.webDetails, `/* Generated by pnpm catalog:compile. Do not edit. */\nimport type { CatalogDestinationDetail } from "@trail-planner/domain";\n\nexport const catalogDetails: Record<string, CatalogDestinationDetail> = ${JSON.stringify(details, null, 2)};\n`, check),
      writeGenerated(outputPaths.convex, `/* Generated by pnpm catalog:compile. Do not edit. */\nexport const catalogDeployment = ${JSON.stringify(deployment, null, 2)} as const;\n`, check),
    ]);
  }
  return deployment;
}

async function runCli() {
  const check = process.argv.includes("--check");
  const deployment = await compileCatalog({ check });
  console.log(`${check ? "verified" : "compiled"} catalog ${deployment.catalogVersion} (${deployment.expected.destinations} destinations, ${deployment.expected.hikes} hikes)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    await runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
