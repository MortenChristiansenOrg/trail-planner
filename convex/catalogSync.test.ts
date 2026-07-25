import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("versioned catalog synchronization", () => {
  test("populates a fresh deployment and is a safe no-op on reapply", async () => {
    const t = convexTest(schema, modules);
    const first = await t.action(internal.ingest.catalogSync.synchronize, {});
    const second = await t.action(internal.ingest.catalogSync.synchronize, {});

    expect(first).toMatchObject({ status: "activated", destinations: 26, hikes: 130, coverage: 47 });
    expect(second).toEqual({ ...first, status: "unchanged" });

    const list = await t.query(api.destinations.listExplore, {
      paginationOpts: { numItems: 50, cursor: null },
    });
    expect(list.page).toHaveLength(26);
    expect(list.page.every((destination) => destination.hikeCount >= 5)).toBe(true);
    expect(list.page.every((destination) => !("guide" in destination))).toBe(true);
    expect(list.page.every((destination) => destination.provenance.sourceUrl.startsWith("https://"))).toBe(true);

    const detail = await t.query(api.destinations.detailByKey, {
      destinationKey: "odda",
    });
    expect(detail?.destinationKey).toBe("hardanger");
    expect(detail?.hikes).toHaveLength(5);
    expect(detail?.guide.highlights.split(/\s+/u).length).toBeGreaterThanOrEqual(80);
    const coverage = await t.run((ctx) =>
      ctx.db
        .query("catalogCoverage")
        .withIndex("by_version", (query) =>
          query.eq("catalogVersion", first.catalogVersion)
        )
        .collect()
    );
    expect(coverage).toHaveLength(47);
    expect(coverage.filter((entry) => entry.visible)).toHaveLength(26);
  });

  test("does not switch the active pointer when staging validation fails", async () => {
    const t = convexTest(schema, modules);
    const active = await t.action(internal.ingest.catalogSync.synchronize, {});
    await t.mutation(internal.ingest.catalogSync.prepare, {
      catalogVersion: "incomplete-version",
      artifactHash: "incomplete-artifact",
      expectedDestinations: 1,
      expectedHikes: 5,
      expectedCoverage: 1,
    });

    await expect(t.mutation(internal.ingest.catalogSync.validateAndActivate, {
      catalogVersion: "incomplete-version",
      expectedDestinations: 1,
      expectedHikes: 5,
      expectedCoverage: 1,
      artifactHash: "incomplete-artifact",
    })).rejects.toThrow(/incomplete/);

    const list = await t.query(api.destinations.listExplore, {
      paginationOpts: { numItems: 50, cursor: null },
    });
    expect(list.catalogVersion).toBe(active.catalogVersion);
    expect(list.page).toHaveLength(26);
  });
});
