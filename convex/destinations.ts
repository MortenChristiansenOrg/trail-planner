import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";

async function activeCatalogVersion(ctx: QueryCtx) {
  return await ctx.db
    .query("catalogState")
    .withIndex("by_key", (builder) => builder.eq("key", "active"))
    .unique();
}

export const listExplore = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const state = await activeCatalogVersion(ctx);
    if (!state) return { catalogVersion: null, page: [], isDone: true, continueCursor: "" };
    const result = await ctx.db
      .query("catalogDestinations")
      .withIndex("by_version", (builder) => builder.eq("catalogVersion", state.catalogVersion))
      .paginate(paginationOpts);
    return {
      ...result,
      catalogVersion: state.catalogVersion,
      page: result.page.map((destination) => ({
        destinationKey: destination.destinationKey,
        aliases: destination.aliases,
        name: destination.name,
        region: destination.region,
        country: destination.country,
        countryCode: destination.countryCode,
        coordinates: [destination.longitude, destination.latitude],
        recommendedMonths: destination.recommendedMonths,
        summary: destination.summary,
        character: destination.character,
        provenance: destination.provenance[0],
        hero: destination.hero,
        hikeCount: destination.hikeCount,
        travel: destination.travel,
        lodgings: destination.lodgings,
        catalogVersion: destination.catalogVersion,
      })),
    };
  },
});

async function destinationDetail(
  ctx: QueryCtx,
  catalogVersion: string,
  destinationKey: string,
) {
    let canonicalKey = destinationKey;
    let destination = await ctx.db
      .query("catalogDestinations")
      .withIndex("by_version_key", (builder) => builder.eq("catalogVersion", catalogVersion).eq("destinationKey", destinationKey))
      .unique();
    if (!destination) {
      const alias = await ctx.db
        .query("catalogDestinationAliases")
        .withIndex("by_version_alias", (builder) =>
          builder.eq("catalogVersion", catalogVersion).eq("alias", destinationKey)
        )
        .unique();
      if (!alias) return null;
      canonicalKey = alias.destinationKey;
      destination = await ctx.db
        .query("catalogDestinations")
        .withIndex("by_version_key", (builder) =>
          builder.eq("catalogVersion", catalogVersion).eq("destinationKey", canonicalKey)
        )
        .unique();
    }
    if (!destination) return null;
    const hikes = await ctx.db
      .query("catalogHikes")
      .withIndex("by_version_destination", (builder) => builder.eq("catalogVersion", catalogVersion).eq("destinationKey", destination.destinationKey))
      .collect();
    return {
      destinationKey: destination.destinationKey,
      guide: {
        highlights: destination.guideHighlights,
        terrain: destination.guideTerrain,
        expectations: destination.guideExpectations,
      },
      hero: destination.hero,
      hikes: hikes.map((hike) => ({
        key: hike.hikeKey,
        name: hike.name,
        routeType: hike.routeType,
        description: hike.description,
        difficulty: hike.difficulty,
        durationHours: hike.durationHours,
        durationDays: hike.durationDays,
        distanceKm: hike.distanceKm,
        ascentM: hike.ascentM,
        descentM: hike.descentM,
        trailhead: hike.trailhead,
        recommendedMonths: hike.recommendedMonths,
        accessCaveat: hike.accessCaveat,
        provenance: hike.provenance,
      })),
      provenance: destination.provenance,
      catalogVersion,
    };
}

export const detailByKey = query({
  args: { destinationKey: v.string() },
  handler: async (ctx, { destinationKey }) => {
    const state = await activeCatalogVersion(ctx);
    if (!state) return null;
    return await destinationDetail(ctx, state.catalogVersion, destinationKey);
  },
});

export const detailsByKeys = query({
  args: { destinationKeys: v.array(v.string()) },
  handler: async (ctx, { destinationKeys }) => {
    if (destinationKeys.length > 20) throw new Error("At most 20 destination details may be requested");
    const state = await activeCatalogVersion(ctx);
    if (!state) return [];
    return await Promise.all(
      [...new Set(destinationKeys)].map((key) =>
        destinationDetail(ctx, state.catalogVersion, key)
      ),
    );
  },
});

export const hikeGeometry = query({
  args: { hikeKey: v.string() },
  handler: async (ctx, { hikeKey }) => {
    const state = await activeCatalogVersion(ctx);
    if (!state) return null;
    const geometry = await ctx.db
      .query("catalogGeometries")
      .withIndex("by_version_hike", (builder) => builder.eq("catalogVersion", state.catalogVersion).eq("hikeKey", hikeKey))
      .unique();
    if (!geometry) return null;
    return {
      coordinates: geometry.coordinates,
      sourceUrl: geometry.sourceUrl,
      attribution: geometry.attribution,
      retrievedAt: geometry.retrievedAt,
      sourceObjectId: geometry.sourceObjectId,
    };
  },
});
