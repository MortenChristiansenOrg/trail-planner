import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("core planning flow remains connected", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "The complete mutation flow is covered once on desktop.");

  await expect(page.getByRole("heading", { name: "Find the mountains that fit the journey." })).toBeVisible();
  await expect(page.getByText("Transport budget")).toBeVisible();
  await page.getByRole("button", { name: "Explore destinations" }).click();
  await expect(page.getByRole("heading", { name: /destinations fit/ })).toBeVisible();
  await expect(page).toHaveURL(/month=7/);

  await page.locator(".results-list").getByRole("button", { name: /Innsbruck/ }).click();
  await page.getByRole("button", { name: /Plan this trip/ }).click();
  await expect(page.getByRole("heading", { name: "Choose how to travel" })).toBeVisible();
  await page.getByRole("button", { name: /Airplane/ }).click();
  await expect(page.getByText("2.900 kr.", { exact: false }).first()).toBeVisible();

  await page.getByRole("button", { name: "Add hike to day 2" }).click();
  await page.getByRole("textbox", { name: "Hike name" }).fill("Local ridge exploration");
  await page.getByRole("button", { name: "Add custom hike" }).click();
  await expect(page.getByText("Local ridge exploration").first()).toBeVisible();

  await page.getByRole("button", { name: "Choose" }).first().click();
  await page.getByRole("button", { name: /Known lodging/ }).click();
  await page.getByRole("button", { name: "Save night" }).click();
  await expect(page.getByText("Pfeishütte").first()).toBeVisible();

  await page.getByRole("button", { name: "Add custom cost" }).click();
  await page.getByRole("textbox", { name: "Label" }).fill("Food");
  await page.getByRole("spinbutton", { name: "Amount (DKK)" }).fill("1200");
  await page.getByRole("button", { name: "Add cost" }).click();
  await expect(page.getByText("Food", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Create share link" }).click();
  const token = await page.evaluate(() => {
    const trips = JSON.parse(localStorage.getItem("trail-planner:mvp-trips:v1") ?? "[]");
    return trips[0]?.shareToken as string | undefined;
  });
  expect(token).toBeTruthy();
  await page.goto(`/share/${token}`);
  await expect(page.getByText("Read-only plan")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Day by day" })).toBeVisible();
  await expect(page.getByText("Pfeishütte", { exact: true })).toBeVisible();
});

test("primary pages do not overflow horizontally", async ({ page }) => {
  for (const path of ["/", "/explore", "/trips"]) {
    await page.goto(path);
    await page.waitForLoadState("domcontentloaded");
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  }
});

test("travel stages use provider-backed road geometry and never invent missing detail", async ({ page }) => {
  let routingAvailable = true;
  await page.route("https://router.project-osrm.org/**", (route) => routingAvailable
    ? route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          code: "Ok",
          routes: [{
            distance: 1_300_000,
            duration: 48_600,
            geometry: { coordinates: [[9.922, 57.048], [9.535, 55.711], [11.404, 47.269]] },
          }],
        }),
      })
    : route.abort());

  await page.goto("/explore?month=7&maxLayovers=1");
  await expect(page.locator('.explore-map[data-line-count="1"]')).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Plan this trip" }).click();

  const carChoice = page.locator(".travel-choice-wrap").filter({ hasText: "Own car" });
  await carChoice.getByRole("button", { name: /Own car/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("trail-planner:mvp-trips:v1") ?? "[]")[0]?.selectedTravelOption?.id)).toBe("osrm-driving-aalborg-innsbruck");
  await carChoice.getByRole("button", { name: "Stage details" }).click();
  const carDialog = page.getByRole("dialog", { name: "Drive from Aalborg to Innsbruck" });
  await expect(carDialog.locator('.map-frame[data-line-count="2"]')).toBeVisible({ timeout: 15_000 });
  await expect(carDialog).toContainText("OSRM");
  await expect(carDialog).toContainText("Road geometry and drive time come from OSRM");
  await page.keyboard.press("Escape");

  for (const label of ["Train + bus", "Airplane"]) {
    const choice = page.locator(".travel-choice-wrap").filter({ hasText: label });
    await choice.getByRole("button", { name: "Stage details" }).click();
    await expect(page.getByRole("dialog", { name: "Travel stage details" })).toContainText("Stage detail not available");
    await page.keyboard.press("Escape");
  }

  routingAvailable = false;
  await page.reload();
  await carChoice.getByRole("button", { name: /Own car/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("trail-planner:mvp-trips:v1") ?? "[]")[0]?.selectedTravelOption?.id)).toBe("osrm-driving-aalborg-innsbruck");

  await page.goto("/explore?month=7&selected=innsbruck");
  await page.getByRole("button", { name: "View area details" }).click();
  const carEstimate = page.locator(".detail-travel-list > div").filter({ hasText: "Own car" });
  await carEstimate.getByRole("button", { name: "View stages" }).click();
  await expect(page.getByRole("dialog", { name: "Travel stage details" })).toContainText("The detailed travel option could not be loaded.");
});

test("Nordic hub media, attribution, and missing-route states are inspectable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Detailed catalog behavior is covered once on desktop.");

  await page.route("https://commons.wikimedia.org/**", (route) => route.fulfill({
    contentType: "image/svg+xml",
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"/>',
  }));

  await page.goto('/explore?month=7&maxLayovers=2&countries=%5B%22IS%22%5D');
  await page.locator(".results-list").getByRole("button", { name: /Landmannalaugar/ }).click();
  const photo = page.getByAltText("Rhyolite mountains and the Laugavegur trail at Landmannalaugar").first();
  await expect(photo).toHaveAttribute("loading", "lazy");
  await expect(photo).toHaveAttribute("srcset", /480w.*960w.*1440w/);
  await page.getByRole("button", { name: "View area details" }).click();
  const details = page.locator(".destination-sheet");
  await expect(details.getByText("Trail geometry unavailable")).toBeVisible();
  const unavailableTrain = details.locator(".detail-travel-list > div").filter({ hasText: "Train + bus" });
  await expect(unavailableTrain).toContainText("Unavailable");
  await expect(unavailableTrain.getByRole("button", { name: "View stages" })).toHaveCount(0);
  await details.getByText("Photo credit").click();
  await expect(details.getByText("Landmannalaugar by Andreas Tille · CC BY-SA 4.0")).toBeVisible();
  await details.getByAltText("Rhyolite mountains and the Laugavegur trail at Landmannalaugar").evaluate((image) => {
    image.removeAttribute("srcset");
    image.setAttribute("src", "http://127.0.0.1:1/unavailable-catalog-image.jpg");
  });
  await expect(details.getByRole("img", { name: "Terrain image not yet available" })).toBeVisible();

  await page.keyboard.press("Escape");
  await page.locator(".results-list").getByRole("button", { name: /Þórsmörk/ }).click();
  await page.getByRole("button", { name: "View area details" }).click();
  await expect(page.getByRole("img", { name: "Terrain image not yet available" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Plan this trip" }).click();
  await page.getByRole("button", { name: "Add hike to day 2" }).click();
  await expect(page.getByRole("tab", { name: "Your own hike" })).toHaveAttribute("data-state", "active");
  await expect(page.getByRole("tab", { name: "No catalog routes" })).toBeDisabled();
  await page.keyboard.press("Escape");

  await page.evaluate(() => {
    const trips = JSON.parse(localStorage.getItem("trail-planner:mvp-trips:v1") ?? "[]");
    trips[0].days[1].activities = [{
      id: "legacy-activity",
      groupId: "legacy-group",
      kind: "catalog-hike",
      hikeId: "retired-catalog-hike",
      name: "Archived route",
      description: "Saved before the catalog changed",
      letter: "A",
      segment: 1,
      durationDays: 1,
    }];
    trips[0].shareToken = "legacy-catalog-reference";
    localStorage.setItem("trail-planner:mvp-trips:v1", JSON.stringify(trips));
  });
  await page.reload();
  await page.locator(".activity-row__select").filter({ hasText: "Archived route" }).click();
  await expect(page.locator(".map-legend")).toContainText("Saved catalog hike is no longer available");
  await page.goto("/share/legacy-catalog-reference");
  await expect(page.locator(".share-activity.is-unavailable")).toContainText("Saved catalog hike is no longer available");

  await page.goto('/explore?month=7&maxLayovers=2&countries=%5B%22SE%22%5D&selected=abisko');
  await page.getByRole("button", { name: "View area details" }).click();
  const hikeMedia = page.locator(".route-preview-list article.has-media").filter({ hasText: "Kungsleden: Abisko to Abiskojaure" });
  await hikeMedia.getByText("Photo credit").click();
  await expect(hikeMedia.getByText("Kungsleden trail by Shyguy24x7 · CC BY-SA 3.0")).toBeVisible();
  await expect(hikeMedia).not.toContainText(/route geometry unavailable/i);
});

test("trip costs can be overridden, reset, and shared per person", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "The complete budget mutation flow is covered once on desktop.");

  await page.goto("/explore?month=7&participants=2");
  await page.getByRole("button", { name: "Plan this trip" }).click();
  await page.getByRole("button", { name: /Airplane/ }).click();

  const budget = page.locator(".budget-card");
  await budget.getByRole("button", { name: "Edit Return flights and ground transfer" }).click();
  const editor = page.getByRole("dialog", { name: "Edit Return flights and ground transfer" });
  await editor.getByRole("spinbutton", { name: "Use amount (DKK)" }).fill("3100");
  await editor.getByRole("textbox", { name: "Override note" }).fill("Checked fare for this weekend");
  await editor.getByRole("button", { name: "Use override" }).click();
  await expect(budget).toContainText("3.100 kr.");
  await expect(budget).toContainText("1.550 kr. per person");
  await expect(budget).toContainText("estimated 2.900 kr.");
  await expect(budget).toContainText("Checked fare for this weekend");

  await budget.getByRole("button", { name: "Edit Return flights and ground transfer" }).click();
  await page.getByRole("dialog", { name: "Edit Return flights and ground transfer" }).getByRole("button", { name: "Clear override" }).click();
  await expect(budget).toContainText("2.900 kr.");
  await expect(budget).toContainText("1.450 kr. per person");
  await expect(budget).not.toContainText("Checked fare for this weekend");

  await budget.getByRole("button", { name: "Edit Return flights and ground transfer" }).click();
  await page.getByRole("dialog", { name: "Edit Return flights and ground transfer" }).getByRole("spinbutton", { name: "Use amount (DKK)" }).fill("3100");
  await page.getByRole("dialog", { name: "Edit Return flights and ground transfer" }).getByRole("button", { name: "Use override" }).click();
  await page.getByRole("button", { name: "Create share link" }).click();
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem("trail-planner:mvp-trips:v1") ?? "[]")[0]?.shareToken as string);
  await page.goto(`/share/${token}`);
  await expect(page.locator(".share-budget")).toContainText("Using override");
  await expect(page.locator(".share-budget")).toContainText("Group total3.100 kr.");
  await expect(page.locator(".share-budget")).toContainText("Per person1.550 kr.");
});

test("lodging choices can be reused and a trip can be discarded safely", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "The complete trip mutation flow is covered once on desktop.");

  await page.goto("/explore?month=7");
  await page.locator(".results-list").getByRole("button", { name: /Innsbruck/ }).click();
  await page.getByRole("button", { name: "Plan this trip" }).click();

  await page.getByRole("button", { name: "Choose" }).first().click();
  await page.getByRole("button", { name: /Known lodging/ }).click();
  await page.getByRole("button", { name: /Apply to remaining unplanned/ }).click();
  const nights = page.locator(".night-row");
  await expect(nights).toHaveCount(4);
  await expect(nights.filter({ hasText: "Pfeishütte" })).toHaveCount(4);

  await nights.nth(1).getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: /Tent · free/ }).click();
  await page.getByRole("button", { name: "Save night" }).click();
  await expect(nights.nth(1)).toContainText("Wild tent");
  await expect(nights.filter({ hasText: "Pfeishütte" })).toHaveCount(3);

  await page.getByRole("button", { name: "Discard trip" }).click();
  await expect(page.getByRole("dialog", { name: /Discard .* in July/ })).toBeVisible();
  await page.getByRole("button", { name: "Keep trip" }).click();
  await expect(page.getByRole("heading", { name: /in July/ })).toBeVisible();

  await page.getByRole("button", { name: "Discard trip" }).click();
  await page.getByRole("dialog", { name: /Discard .* in July/ }).getByRole("button", { name: "Discard trip" }).click();
  await expect(page).toHaveURL(/\/explore\?.*month=7/);
  await expect(page.getByRole("heading", { name: /destinations fit/ })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("trail-planner:mvp-trips:v1") ?? "[]"))).toEqual([]);
});

test("Explore filters edit month and travellers through shareable search state", async ({ page }) => {
  await page.goto("/explore");
  await page.locator(".destination-row").filter({ hasText: "Fort William" }).click();
  await expect(page).toHaveURL(/selected=fort-william/);

  await page.getByRole("button", { name: "Filters" }).click();
  const historyLength = await page.evaluate(() => history.length);
  const travellers = page.getByRole("slider", { name: "Travellers" });
  await travellers.press("ArrowRight");
  await expect(page).toHaveURL(/participants=3/);
  await expect(page.locator(".filter-range").filter({ hasText: "Travellers" }).getByText("3 people", { exact: true })).toBeVisible();

  const month = page.getByRole("slider", { name: "Travel month" });
  await month.press("Home");
  await expect(page).toHaveURL(/month=1/);
  await expect(page.getByText("No destination fits every limit")).toBeVisible();
  await expect(page).not.toHaveURL(/selected=/);
  expect(await page.evaluate(() => history.length)).toBe(historyLength);

  await page.reload();
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(page.getByRole("slider", { name: "Travel month" })).toHaveAttribute("aria-valuenow", "1");
  await expect(page.getByRole("slider", { name: "Travellers" })).toHaveAttribute("aria-valuenow", "3");
});

test("full-height pages fill the viewport without the optional preview ribbon", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Find the mountains that fit the journey." })).toBeVisible();

  await page.locator(".app-shell--fixed").evaluate((shell) => {
    shell.querySelector(":scope > .preview-ribbon")?.remove();
    shell.classList.remove("app-shell--with-ribbon");
  });

  const stage = await page.locator(".landing-stage").boundingBox();
  const viewport = page.viewportSize();
  expect(stage).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(stage!.y + stage!.height).toBeGreaterThanOrEqual(viewport!.height - 1);
  await expect(page.getByRole("heading", { name: "Find the mountains that fit the journey." })).toBeVisible();
});

test("feedback fixes remain visible and interactive", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Detailed interaction and layout checks run once on desktop.");

  await page.goto("/explore");
  await expect(page.getByText("Numbers show overall fit rank; 1 is the strongest match.")).toBeVisible();
  await expect(page.getByText("Selected month is in the area’s recommended hiking season.")).toBeVisible();
  await expect(page.getByText("Best match").first()).toBeVisible();
  await expect(page.locator('.explore-map[data-line-count="1"]')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".explore-map .maplibregl-ctrl-attrib")).not.toHaveClass(/maplibregl-compact-show/);
  await expect(page.getByText("Map line: OSRM driving route from Aalborg")).toBeVisible();

  await page.waitForTimeout(750);
  const markerA = page.getByRole("button", { name: "Innsbruck, Austria" });
  const markerB = page.getByRole("button", { name: "Berchtesgaden, Germany" });
  const [beforeA, beforeB] = await Promise.all([markerA.boundingBox(), markerB.boundingBox()]);
  const mapBox = await page.locator(".explore-map").boundingBox();
  await page.mouse.move(mapBox!.x + mapBox!.width * 0.58, mapBox!.y + mapBox!.height * 0.42);
  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(500);
  const [afterA, afterB] = await Promise.all([markerA.boundingBox(), markerB.boundingBox()]);
  const beforeDistance = Math.hypot(beforeA!.x - beforeB!.x, beforeA!.y - beforeB!.y);
  const afterDistance = Math.hypot(afterA!.x - afterB!.x, afterA!.y - afterB!.y);
  expect(afterDistance).toBeGreaterThan(beforeDistance + 2);

  const mapNode = page.locator(".explore-map .maplibregl-map");
  await mapNode.evaluate((element) => element.setAttribute("data-map-instance", "original"));
  await page.getByRole("button", { name: "View area details" }).click();
  await expect(page.locator('[data-map-instance="original"]')).toHaveCount(1);
  await page.keyboard.press("Escape");

  const controls = page.locator(".explore-map .maplibregl-ctrl-group").first();
  const destinationCard = page.locator(".selected-destination");
  const [controlBox, cardBox] = await Promise.all([controls.boundingBox(), destinationCard.boundingBox()]);
  expect(controlBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  expect(controlBox!.y + controlBox!.height).toBeLessThan(cardBox!.y);
  await page.screenshot({ fullPage: true, path: testInfo.outputPath("feedback-explore.png") });

  await page.goto('/explore?month=7&maxLayovers=2&countries=%5B%22SE%22%5D&selected=abisko');
  await page.getByRole("button", { name: "Plan this trip" }).click();
  await page.getByRole("button", { name: "Add hike to day 2" }).click();
  await page.getByRole("button", { name: "Add to itinerary" }).click();
  await page.getByRole("button", { name: "Add hike to day 3" }).click();
  await page.getByRole("dialog", { name: "Add a hike" }).locator("select").first().selectOption("kungsleden-abiskojaure-alesjaure");
  await page.getByRole("button", { name: "Add to itinerary" }).click();

  await page.locator(".activity-row__select").filter({ hasText: "Abiskojaure to Alesjaure" }).click();
  await expect(page.locator(".map-legend")).toContainText("B · Kungsleden: Abiskojaure to Alesjaure");
  await expect(page.locator(".map-legend")).toContainText("source-backed route");
  await expect(page.locator(".activity-row.is-selected")).toContainText("Abiskojaure to Alesjaure");

  const dateInput = page.getByLabel("Trip start date");
  await dateInput.fill("2026-07-26");
  await expect(dateInput).toHaveValue("2026-07-26");
  await expect(page.getByText("Mon, Jul 27")).toBeVisible();

  await page.getByRole("button", { name: "Choose" }).first().click();
  await page.getByRole("button", { name: /Tent · free/ }).click();
  await page.getByRole("button", { name: "Save night" }).click();
  const night = page.locator(".night-row").first();
  await expect(night).toContainText("Wild tent");
  const [nightBox, copyBox] = await Promise.all([night.boundingBox(), night.locator(".night-copy").boundingBox()]);
  expect(copyBox!.x).toBeGreaterThan(nightBox!.x + 75);

  await page.screenshot({ fullPage: true, path: testInfo.outputPath("feedback-trip-detail.png") });

  await page.getByRole("link", { name: /Planned trips/ }).first().click();
  const openPlan = page.getByRole("link", { name: /Open plan/ });
  const colours = await openPlan.evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, foreground: style.color };
  });
  expect(colours.foreground).not.toBe(colours.background);
  await expect(page.locator(".trips-map .maplibregl-ctrl-attrib")).not.toHaveClass(/maplibregl-compact-show/);
  await page.waitForTimeout(1_000);
  await page.screenshot({ fullPage: true, path: testInfo.outputPath("feedback-planned-trips.png") });
});
