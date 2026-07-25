import { v } from "convex/values";
import { catalogDeployment } from "../generated/catalogDeployment";
import { internal } from "../_generated/api";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";

const BATCH_SIZE = 25;

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stable(item)]),
    );
  }
  return value;
}

async function verifyArtifact() {
  const { artifactHash, ...payload } = catalogDeployment;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(stable(payload))),
  );
  const actual = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  if (actual !== artifactHash) {
    throw new Error(`Catalog artifact hash mismatch: expected ${artifactHash}, received ${actual}`);
  }
}

export const prepare = internalMutation({
  args: {
    catalogVersion: v.string(),
    artifactHash: v.string(),
    expectedDestinations: v.number(),
    expectedHikes: v.number(),
    expectedCoverage: v.number(),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("catalogState")
      .withIndex("by_key", (query) => query.eq("key", "active"))
      .unique();
    const existing = await ctx.db
      .query("catalogVersions")
      .withIndex("by_version", (query) => query.eq("catalogVersion", args.catalogVersion))
      .unique();
    if (state?.catalogVersion === args.catalogVersion) {
      if (!existing) throw new Error("Active catalog version metadata is missing");
      if (existing.artifactHash && existing.artifactHash !== args.artifactHash) {
        throw new Error("Active catalog artifact hash does not match");
      }
      if (!existing.artifactHash) {
        await ctx.db.patch(existing._id, {
          artifactHash: args.artifactHash,
          expectedCoverage: args.expectedCoverage,
        });
      }
      return { active: true };
    }
    const value = {
      artifactHash: args.artifactHash,
      status: "staging" as const,
      expectedDestinations: args.expectedDestinations,
      expectedHikes: args.expectedHikes,
      expectedCoverage: args.expectedCoverage,
      createdAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, value);
    } else {
      await ctx.db.insert("catalogVersions", { catalogVersion: args.catalogVersion, ...value });
    }
    return { active: false };
  },
});

const provenanceValidator = v.object({
  sourceKey: v.string(),
  sourceUrl: v.string(),
  verifiedAt: v.string(),
  confidence: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
});

export const writeDestinations = internalMutation({
  args: {
    catalogVersion: v.string(),
    destinations: v.array(v.object({
      destinationKey: v.string(),
      aliases: v.array(v.string()),
      name: v.string(),
      region: v.string(),
      country: v.string(),
      countryCode: v.string(),
      coordinates: v.array(v.number()),
      recommendedMonths: v.array(v.number()),
      summary: v.string(),
      character: v.string(),
      hero: v.any(),
      hikeCount: v.number(),
      travel: v.array(v.any()),
      lodgings: v.array(v.any()),
      catalogVersion: v.string(),
      guide: v.object({
        highlights: v.string(),
        terrain: v.string(),
        expectations: v.string(),
      }),
      provenance: v.array(provenanceValidator),
    })),
  },
  handler: async (ctx, { catalogVersion, destinations }) => {
    for (const destination of destinations) {
      if (destination.catalogVersion !== catalogVersion || destination.coordinates.length !== 2) {
        throw new Error(`Invalid destination artifact for ${destination.destinationKey}`);
      }
      const existing = await ctx.db
        .query("catalogDestinations")
        .withIndex("by_version_key", (query) => query.eq("catalogVersion", catalogVersion).eq("destinationKey", destination.destinationKey))
        .unique();
      const value = {
        catalogVersion,
        destinationKey: destination.destinationKey,
        aliases: destination.aliases,
        name: destination.name,
        region: destination.region,
        country: destination.country,
        countryCode: destination.countryCode,
        longitude: destination.coordinates[0],
        latitude: destination.coordinates[1],
        recommendedMonths: destination.recommendedMonths,
        summary: destination.summary,
        character: destination.character,
        guideHighlights: destination.guide.highlights,
        guideTerrain: destination.guide.terrain,
        guideExpectations: destination.guide.expectations,
        hero: destination.hero,
        hikeCount: destination.hikeCount,
        travel: destination.travel,
        lodgings: destination.lodgings,
        provenance: destination.provenance,
      };
      if (existing) await ctx.db.replace(existing._id, value);
      else await ctx.db.insert("catalogDestinations", value);
      for (const alias of destination.aliases) {
        const existingAlias = await ctx.db
          .query("catalogDestinationAliases")
          .withIndex("by_version_alias", (query) =>
            query.eq("catalogVersion", catalogVersion).eq("alias", alias)
          )
          .unique();
        const aliasValue = {
          catalogVersion,
          alias,
          destinationKey: destination.destinationKey,
        };
        if (existingAlias) await ctx.db.replace(existingAlias._id, aliasValue);
        else await ctx.db.insert("catalogDestinationAliases", aliasValue);
      }
    }
  },
});

export const writeHikes = internalMutation({
  args: {
    catalogVersion: v.string(),
    hikes: v.array(v.object({
      destinationKey: v.string(),
      hike: v.any(),
    })),
  },
  handler: async (ctx, { catalogVersion, hikes }) => {
    for (const { destinationKey, hike } of hikes) {
      const existing = await ctx.db
        .query("catalogHikes")
        .withIndex("by_version_key", (query) => query.eq("catalogVersion", catalogVersion).eq("hikeKey", hike.key))
        .unique();
      const { key: hikeKey, ...hikeWithGeometry } = hike;
      const { geometry, ...value } = hikeWithGeometry;
      const document = { ...value, catalogVersion, destinationKey, hikeKey };
      if (existing) await ctx.db.replace(existing._id, document);
      else await ctx.db.insert("catalogHikes", document);
      if (geometry) {
        const existingGeometry = await ctx.db
          .query("catalogGeometries")
          .withIndex("by_version_hike", (query) => query.eq("catalogVersion", catalogVersion).eq("hikeKey", hikeKey))
          .unique();
        const geometryValue = {
          catalogVersion,
          hikeKey,
          coordinates: geometry.coordinates as number[][],
          sourceUrl: geometry.sourceUrl as string,
          attribution: geometry.attribution as string,
          retrievedAt: geometry.retrievedAt as string,
          sourceObjectId: geometry.sourceObjectId as string | undefined,
        };
        if (existingGeometry) await ctx.db.replace(existingGeometry._id, geometryValue);
        else await ctx.db.insert("catalogGeometries", geometryValue);
      }
    }
  },
});

export const writeCoverage = internalMutation({
  args: {
    catalogVersion: v.string(),
    coverage: v.array(v.object({
      destinationKey: v.string(),
      visible: v.boolean(),
      ready: v.boolean(),
      guideWords: v.number(),
      hikeCount: v.number(),
      difficultyCount: v.number(),
      durationBandCount: v.number(),
      hasHero: v.boolean(),
      gaps: v.array(v.string()),
    })),
  },
  handler: async (ctx, { catalogVersion, coverage }) => {
    for (const entry of coverage) {
      const existing = await ctx.db
        .query("catalogCoverage")
        .withIndex("by_version_key", (query) =>
          query.eq("catalogVersion", catalogVersion).eq("destinationKey", entry.destinationKey)
        )
        .unique();
      const value = { ...entry, catalogVersion };
      if (existing) await ctx.db.replace(existing._id, value);
      else await ctx.db.insert("catalogCoverage", value);
    }
  },
});

export const validateAndActivate = internalMutation({
  args: {
    catalogVersion: v.string(),
    expectedDestinations: v.number(),
    expectedHikes: v.number(),
    expectedCoverage: v.number(),
    artifactHash: v.string(),
  },
  handler: async (ctx, args) => {
    const [destinations, aliases, hikes, coverage] = await Promise.all([
      ctx.db.query("catalogDestinations").withIndex("by_version", (query) => query.eq("catalogVersion", args.catalogVersion)).collect(),
      ctx.db.query("catalogDestinationAliases").withIndex("by_version", (query) => query.eq("catalogVersion", args.catalogVersion)).collect(),
      ctx.db.query("catalogHikes").withIndex("by_version_destination", (query) => query.eq("catalogVersion", args.catalogVersion)).collect(),
      ctx.db.query("catalogCoverage").withIndex("by_version", (query) => query.eq("catalogVersion", args.catalogVersion)).collect(),
    ]);
    if (
      destinations.length !== args.expectedDestinations ||
      hikes.length !== args.expectedHikes ||
      coverage.length !== args.expectedCoverage
    ) {
      throw new Error(`Catalog ${args.catalogVersion} is incomplete: ${destinations.length}/${args.expectedDestinations} destinations, ${hikes.length}/${args.expectedHikes} hikes, ${coverage.length}/${args.expectedCoverage} coverage rows`);
    }
    const destinationKeys = new Set(destinations.map((destination) => destination.destinationKey));
    if (destinationKeys.size !== destinations.length) throw new Error("Catalog contains duplicate destination keys");
    const expectedAliases = destinations.reduce(
      (count, destination) => count + destination.aliases.length,
      0,
    );
    if (aliases.length !== expectedAliases) {
      throw new Error(`Catalog ${args.catalogVersion} is incomplete: ${aliases.length}/${expectedAliases} aliases`);
    }
    for (const alias of aliases) {
      if (!destinationKeys.has(alias.destinationKey)) {
        throw new Error(`Alias ${alias.alias} references an unknown destination`);
      }
    }
    const coverageKeys = new Set(coverage.map((entry) => entry.destinationKey));
    if (coverageKeys.size !== coverage.length) {
      throw new Error("Catalog contains duplicate coverage keys");
    }
    for (const destination of destinations) {
      const entry = coverage.find((candidate) =>
        candidate.destinationKey === destination.destinationKey
      );
      if (!entry?.visible || !entry.ready) {
        throw new Error(`${destination.destinationKey} is active without visible, ready coverage`);
      }
    }
    for (const hike of hikes) {
      if (!destinationKeys.has(hike.destinationKey)) throw new Error(`Hike ${hike.hikeKey} references an unknown destination`);
    }
    for (const destination of destinations) {
      const count = hikes.filter((hike) => hike.destinationKey === destination.destinationKey).length;
      if (count !== destination.hikeCount) throw new Error(`${destination.destinationKey} expected ${destination.hikeCount} hikes, found ${count}`);
    }

    const now = Date.now();
    const version = await ctx.db
      .query("catalogVersions")
      .withIndex("by_version", (query) => query.eq("catalogVersion", args.catalogVersion))
      .unique();
    if (!version) throw new Error("Catalog staging version is missing");
    if (version.artifactHash !== args.artifactHash) {
      throw new Error("Catalog staging artifact hash does not match");
    }
    const previousState = await ctx.db
      .query("catalogState")
      .withIndex("by_key", (query) => query.eq("key", "active"))
      .unique();
    if (previousState && previousState.catalogVersion !== args.catalogVersion) {
      const previousVersion = await ctx.db
        .query("catalogVersions")
        .withIndex("by_version", (query) => query.eq("catalogVersion", previousState.catalogVersion))
        .unique();
      if (previousVersion) await ctx.db.patch(previousVersion._id, { status: "retained" });
    }
    await ctx.db.patch(version._id, { status: "active", validatedAt: now, activatedAt: now });
    if (previousState) await ctx.db.patch(previousState._id, { catalogVersion: args.catalogVersion, updatedAt: now });
    else await ctx.db.insert("catalogState", { key: "active", catalogVersion: args.catalogVersion, updatedAt: now });
    return { catalogVersion: args.catalogVersion, destinations: destinations.length, hikes: hikes.length };
  },
});

export const versionsToPrune = internalQuery({
  args: {},
  handler: async (ctx) => {
    const versions = await ctx.db.query("catalogVersions").collect();
    const active = versions.find((version) => version.status === "active");
    const retained = versions
      .filter((version) => version.status === "retained")
      .sort((left, right) =>
        (right.activatedAt ?? right.createdAt) - (left.activatedAt ?? left.createdAt)
      );
    const keep = new Set([
      active?.catalogVersion,
      retained[0]?.catalogVersion,
    ].filter((version): version is string => Boolean(version)));
    return versions
      .filter((version) => version.status !== "staging" && !keep.has(version.catalogVersion))
      .map((version) => version.catalogVersion);
  },
});

export const pruneVersionBatch = internalMutation({
  args: { catalogVersion: v.string() },
  handler: async (ctx, { catalogVersion }) => {
    const state = await ctx.db
      .query("catalogState")
      .withIndex("by_key", (query) => query.eq("key", "active"))
      .unique();
    if (state?.catalogVersion === catalogVersion) {
      throw new Error("Refusing to prune the active catalog version");
    }
    const [destinations, aliases, hikes, geometries, coverage] = await Promise.all([
      ctx.db.query("catalogDestinations").withIndex("by_version", (query) => query.eq("catalogVersion", catalogVersion)).take(BATCH_SIZE),
      ctx.db.query("catalogDestinationAliases").withIndex("by_version", (query) => query.eq("catalogVersion", catalogVersion)).take(BATCH_SIZE),
      ctx.db.query("catalogHikes").withIndex("by_version_destination", (query) => query.eq("catalogVersion", catalogVersion)).take(BATCH_SIZE),
      ctx.db.query("catalogGeometries").withIndex("by_version", (query) => query.eq("catalogVersion", catalogVersion)).take(BATCH_SIZE),
      ctx.db.query("catalogCoverage").withIndex("by_version", (query) => query.eq("catalogVersion", catalogVersion)).take(BATCH_SIZE),
    ]);
    const documents = [...destinations, ...aliases, ...hikes, ...geometries, ...coverage];
    for (const document of documents) await ctx.db.delete(document._id);
    if (documents.length) return { done: false };
    const version = await ctx.db
      .query("catalogVersions")
      .withIndex("by_version", (query) => query.eq("catalogVersion", catalogVersion))
      .unique();
    if (version) await ctx.db.delete(version._id);
    return { done: true };
  },
});

export const synchronize = internalAction({
  args: {},
  handler: async (ctx): Promise<{ status: "unchanged" | "activated"; catalogVersion: string; destinations: number; hikes: number; coverage: number }> => {
    const artifact = catalogDeployment;
    await verifyArtifact();
    const prepared = await ctx.runMutation(internal.ingest.catalogSync.prepare, {
      catalogVersion: artifact.catalogVersion,
      artifactHash: artifact.artifactHash,
      expectedDestinations: artifact.expected.destinations,
      expectedHikes: artifact.expected.hikes,
      expectedCoverage: artifact.expected.coverage,
    });
    if (prepared.active) {
      return { status: "unchanged", catalogVersion: artifact.catalogVersion, destinations: artifact.expected.destinations, hikes: artifact.expected.hikes, coverage: artifact.expected.coverage };
    }
    const destinationRows = artifact.digests.map((digest) => ({
      ...digest,
      aliases: [...digest.aliases],
      coordinates: [...digest.coordinates],
      recommendedMonths: [...digest.recommendedMonths],
      travel: digest.travel.map((estimate) => ({ ...estimate })),
      lodgings: digest.lodgings.map((lodging) => ({ ...lodging })),
      guide: artifact.details[digest.destinationKey].guide,
      provenance: artifact.details[digest.destinationKey].provenance.map((item) => ({ ...item })),
    }));
    for (let offset = 0; offset < destinationRows.length; offset += BATCH_SIZE) {
      await ctx.runMutation(internal.ingest.catalogSync.writeDestinations, {
        catalogVersion: artifact.catalogVersion,
        destinations: destinationRows.slice(offset, offset + BATCH_SIZE),
      });
    }
    const hikeRows = artifact.digests.flatMap((digest) => artifact.details[digest.destinationKey].hikes.map((hike) => ({
      destinationKey: digest.destinationKey,
      hike,
    })));
    for (let offset = 0; offset < hikeRows.length; offset += BATCH_SIZE) {
      await ctx.runMutation(internal.ingest.catalogSync.writeHikes, {
        catalogVersion: artifact.catalogVersion,
        hikes: hikeRows.slice(offset, offset + BATCH_SIZE),
      });
    }
    for (let offset = 0; offset < artifact.coverage.length; offset += BATCH_SIZE) {
      await ctx.runMutation(internal.ingest.catalogSync.writeCoverage, {
        catalogVersion: artifact.catalogVersion,
        coverage: artifact.coverage
          .slice(offset, offset + BATCH_SIZE)
          .map((entry) => ({ ...entry, gaps: [...entry.gaps] })),
      });
    }
    const activated = await ctx.runMutation(internal.ingest.catalogSync.validateAndActivate, {
      catalogVersion: artifact.catalogVersion,
      expectedDestinations: artifact.expected.destinations,
      expectedHikes: artifact.expected.hikes,
      expectedCoverage: artifact.expected.coverage,
      artifactHash: artifact.artifactHash,
    });
    const prunableVersions = await ctx.runQuery(
      internal.ingest.catalogSync.versionsToPrune,
      {},
    );
    for (const catalogVersion of prunableVersions) {
      let done = false;
      while (!done) {
        ({ done } = await ctx.runMutation(
          internal.ingest.catalogSync.pruneVersionBatch,
          { catalogVersion },
        ));
      }
    }
    return { status: "activated", coverage: artifact.expected.coverage, ...activated };
  },
});
