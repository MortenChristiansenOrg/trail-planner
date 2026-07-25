import {
  catalogMediaLicenses,
  hikeDifficulties,
  hikeRouteTypes,
} from "../../packages/domain/src/catalogData.ts";

const mediaLicenses = new Set(catalogMediaLicenses);
const difficulties = new Set(hikeDifficulties);
const routeTypes = new Set(hikeRouteTypes);
const guideFields = ["guide.highlights", "guide.terrain", "guide.expectations"];
const travelFields = new Map([
  ["travel-road", "car"],
  ["travel-transit", "train"],
  ["travel-flight", "plane"],
]);

export function wordCount(value) {
  return typeof value === "string" ? value.trim().split(/\s+/u).filter(Boolean).length : 0;
}

export function claimsFor(record, domain, field) {
  return Array.isArray(record?.claims)
    ? record.claims.filter((claim) => claim?.domain === domain && (field === undefined || claim.field === field))
    : [];
}

export function claimFor(record, domain, field) {
  return claimsFor(record, domain, field)[0];
}

function validHttps(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validAssetUrl(value) {
  return (typeof value === "string" && value.startsWith("/catalog-media/")) || validHttps(value);
}

function nonEmpty(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function validMonthList(value) {
  return Array.isArray(value)
    && value.length > 0
    && value.every((month) => Number.isInteger(month) && month >= 1 && month <= 12);
}

function validProvenance(source) {
  return nonEmpty(source?.key) && validHttps(source?.url);
}

function validateHero(hero, errors) {
  if (!hero || typeof hero !== "object") {
    errors.push("media.hero is required");
    return;
  }
  if (!validAssetUrl(hero.imageUrl) || !validHttps(hero.sourceUrl)) errors.push("media.hero image URL must use catalog storage and source URL must be HTTPS");
  if (typeof hero.assetSha256 !== "string" || !/^[a-f0-9]{64}$/.test(hero.assetSha256)) errors.push("media.hero.assetSha256 must be a SHA-256 digest");
  if (!validHttps(hero.licenseUrl) || !validHttps(hero.attributionUrl)) errors.push("media.hero license and attribution URLs must be HTTPS");
  if (!Number.isInteger(hero.width) || hero.width < 1 || !Number.isInteger(hero.height) || hero.height < 1) errors.push("media.hero dimensions are invalid");
  for (const field of ["alt", "creator", "attributionText", "verifiedAt"]) {
    if (!nonEmpty(hero[field])) errors.push(`media.hero.${field} is required`);
  }
  if (nonEmpty(hero.verifiedAt) && !/^\d{4}-\d{2}-\d{2}$/.test(hero.verifiedAt)) {
    errors.push("media.hero.verifiedAt must be an ISO calendar date (YYYY-MM-DD)");
  }
  if (hero.subject !== "destination" || hero.kind !== "terrain") errors.push("media.hero must be destination terrain");
  if (!mediaLicenses.has(hero.license)) errors.push(`media.hero license is unsupported: ${String(hero.license)}`);
}

function durationBand(hike) {
  if (hike.durationDays > 1 || hike.durationHours > 8) return "long";
  if (hike.durationHours >= 4) return "medium";
  return "short";
}

function validateHike(hike, claim, errors) {
  const prefix = `hike ${claim.subjectKey}`;
  if (typeof claim.retrievedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T/u.test(claim.retrievedAt)) {
    errors.push(`${prefix} retrievedAt must be an ISO timestamp`);
  }
  if (!hike || typeof hike !== "object") {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if (hike.key !== claim.subjectKey || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(hike.key ?? "")) errors.push(`${prefix} has an invalid key`);
  for (const field of ["name", "description", "trailhead"]) {
    if (!nonEmpty(hike[field])) errors.push(`${prefix}.${field} is required`);
  }
  if (!routeTypes.has(hike.routeType)) errors.push(`${prefix}.routeType is invalid`);
  if (!difficulties.has(hike.difficulty)) errors.push(`${prefix}.difficulty is invalid`);
  if (!Number.isFinite(hike.durationHours) || hike.durationHours <= 0) errors.push(`${prefix}.durationHours must be positive`);
  if (!Number.isInteger(hike.durationDays) || hike.durationDays < 1) errors.push(`${prefix}.durationDays must be a positive integer`);
  for (const field of ["distanceKm", "ascentM", "descentM"]) {
    if (hike[field] !== undefined && (!Number.isFinite(hike[field]) || hike[field] < 0)) errors.push(`${prefix}.${field} is invalid`);
  }
  if (hike.recommendedMonths !== undefined && !validMonthList(hike.recommendedMonths)) errors.push(`${prefix}.recommendedMonths is invalid`);
  if (hike.geometry !== undefined) {
    if (!Array.isArray(hike.geometry.coordinates) || hike.geometry.coordinates.length < 2) errors.push(`${prefix}.geometry requires at least two coordinates`);
    if (!validHttps(hike.geometry.sourceUrl) || !nonEmpty(hike.geometry.attribution) || !nonEmpty(hike.geometry.retrievedAt)) errors.push(`${prefix}.geometry provenance is incomplete`);
  }
  if (!validProvenance(claim.source)) errors.push(`${prefix} provenance is incomplete`);
}

export function assessProductRecord(record) {
  const errors = [];
  const gaps = [];
  const key = record?.destination?.key ?? "";
  const aliasesClaim = claimFor(record, "destination-core", "aliases");
  const aliases = aliasesClaim?.value ?? [];
  if (!Array.isArray(aliases) || aliases.some((alias) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(alias))) errors.push("destination-core.aliases must be kebab-case strings");
  if (new Set(aliases).size !== aliases.length || aliases.includes(key)) errors.push("destination-core.aliases must be unique and cannot include the canonical key");

  const summary = claimFor(record, "destination-core", "summary")?.value;
  const character = claimFor(record, "destination-core", "character")?.value;
  const country = claimFor(record, "destination-core", "country")?.value;
  if (!nonEmpty(summary)) gaps.push("summary");
  if (!nonEmpty(character)) gaps.push("character");
  if (!nonEmpty(country)) gaps.push("country");

  const guide = Object.fromEntries(guideFields.map((field) => [field.slice("guide.".length), claimFor(record, "destination-core", field)?.value]));
  const sectionWords = guideFields.map((field) => wordCount(claimFor(record, "destination-core", field)?.value));
  const guideWords = sectionWords.reduce((sum, count) => sum + count, 0);
  for (const [index, count] of sectionWords.entries()) {
    if (count < 80) gaps.push(`${guideFields[index]} (${count}/80 words)`);
  }
  if (guideWords < 260) gaps.push(`guide total (${guideWords}/260 words)`);

  const hero = claimFor(record, "media", "hero")?.value;
  const heroErrors = [];
  validateHero(hero, heroErrors);
  if (heroErrors.length) gaps.push(...heroErrors);

  const hikeClaims = claimsFor(record, "hikes", "hike");
  const hikeKeys = new Set();
  const hikeErrors = [];
  for (const claim of hikeClaims) {
    if (hikeKeys.has(claim.subjectKey)) hikeErrors.push(`duplicate hike key ${claim.subjectKey}`);
    hikeKeys.add(claim.subjectKey);
    validateHike(claim.value, claim, hikeErrors);
  }
  if (hikeClaims.length < 5) gaps.push(`hikes (${hikeClaims.length}/5)`);
  gaps.push(...hikeErrors);
  const difficultyCount = new Set(hikeClaims.map((claim) => claim.value?.difficulty).filter(Boolean)).size;
  const durationBandCount = new Set(hikeClaims.map((claim) => durationBand(claim.value ?? {}))).size;
  if (difficultyCount < 2) gaps.push("hike difficulty variety");
  if (durationBandCount < 2) gaps.push("hike duration variety");

  const recommendedMonths = claimFor(record, "seasonality", "recommendedMonths")?.value;
  if (!validMonthList(recommendedMonths)) gaps.push("recommendedMonths");

  const travel = [];
  for (const [domain, mode] of travelFields) {
    const value = claimFor(record, domain, "estimate")?.value;
    if (!value || value.mode !== mode) {
      gaps.push(`${domain}.estimate`);
      continue;
    }
    travel.push(value);
  }

  const lodgings = claimsFor(record, "lodging", "lodging").map((claim) => claim.value);
  const ready = errors.length === 0 && gaps.length === 0;
  return {
    errors,
    gaps,
    ready,
    aliases,
    summary,
    character,
    country,
    guide,
    guideWords,
    hero,
    hikes: hikeClaims.map((claim) => ({
      ...claim.value,
      provenance: {
        sourceKey: claim.source.key,
        sourceUrl: claim.source.url,
        verifiedAt: typeof claim.retrievedAt === "string"
          ? claim.retrievedAt.slice(0, 10)
          : "",
        confidence: claim.confidence,
      },
    })),
    hikeCount: hikeClaims.length,
    difficultyCount,
    durationBandCount,
    recommendedMonths,
    travel,
    lodgings,
  };
}

export function validateVisibleProductRecord(record) {
  if (record?.destination?.visibility !== "visible") return [];
  const assessment = assessProductRecord(record);
  return [
    ...assessment.errors,
    ...assessment.gaps.map((gap) => `visible destination is not ready: ${gap}`),
  ];
}
