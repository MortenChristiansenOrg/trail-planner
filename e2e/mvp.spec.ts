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
  await page.getByRole("button", { name: "Add to itinerary" }).click();
  await expect(page.getByText("Nordkette traverse").first()).toBeVisible();

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
  await expect(page.getByText("Pfeishütte")).toBeVisible();
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

test("travel stages show connecting flights, mixed rail, costs, and return differences", async ({ page }) => {

  await page.goto("/explore?month=7&maxLayovers=1");
  await page.getByRole("button", { name: "Plan this trip" }).click();

  const flightChoice = page.locator(".travel-choice-wrap").filter({ hasText: "Airplane" });
  await expect(flightChoice).toContainText("1 layover");
  await flightChoice.getByRole("button", { name: /Airplane/ }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("trail-planner:mvp-trips:v1") ?? "[]")[0]?.selectedTravelOption?.id)).toBe("innsbruck-flight-sample");
  await flightChoice.getByRole("button", { name: "Stage details" }).click();
  const flightDialog = page.getByRole("dialog", { name: "Flights via Copenhagen" });
  await expect(flightDialog).toContainText("Flight layover");
  await expect(flightDialog).toContainText("Copenhagen Airport (CPH)");
  await expect(flightDialog).toContainText("08.00–08.45");
  await expect(flightDialog.locator('.map-frame[data-line-count="8"]')).toBeVisible({ timeout: 15_000 });
  await expect(flightDialog).toContainText("Sampled return airfare");
  await expect(flightDialog).toContainText("Provider total 1.450 kr. · difference 0 kr.");
  await flightDialog.getByRole("tab", { name: /Return/ }).click();
  await expect(flightDialog).toContainText("1h 20m");
  await page.keyboard.press("Escape");

  const railChoice = page.locator(".travel-choice-wrap").filter({ hasText: "Train + bus" });
  await railChoice.getByRole("button", { name: "Stage details" }).click();
  const railDialog = page.getByRole("dialog", { name: "Rail via Hamburg and Munich" });
  await expect(railDialog).toContainText("Aalborg Station");
  await expect(railDialog).toContainText("ÖBB");
  await expect(railDialog.getByRole("tab", { name: "Outbound · 15h 20m" })).toBeVisible();
  await expect(railDialog.getByRole("tab", { name: "Return · 15h 48m" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.goto("/explore?month=7&selected=zermatt");
  await page.getByRole("button", { name: "View area details" }).click();
  const directFlight = page.locator(".detail-travel-list > div").filter({ hasText: "Airplane" });
  await directFlight.getByRole("button", { name: "View stages" }).click();
  const directDialog = page.getByRole("dialog", { name: "Direct flight and rail to Zermatt" });
  await expect(directDialog.getByLabel("0 flight layovers")).toBeVisible();
  await expect(directDialog).toContainText("Zermatt is car-free");
  await page.keyboard.press("Escape");

  await page.goto("/explore?month=7&selected=berchtesgaden");
  await page.getByRole("button", { name: "View area details" }).click();
  const carEstimate = page.locator(".detail-travel-list > div").filter({ hasText: "Own car" });
  await carEstimate.getByRole("button", { name: "View stages" }).click();
  await expect(page.getByRole("dialog", { name: "Travel stage details" })).toContainText("Stage detail not available");
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
  await expect(page.getByText("Map line: indicative driving route from Aalborg")).toBeVisible();

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

  await page.locator(".destination-row").filter({ hasText: "Fort William" }).click();
  await page.getByRole("button", { name: "Plan this trip" }).click();
  await page.getByRole("button", { name: "Add hike to day 2" }).click();
  await page.getByRole("button", { name: "Add to itinerary" }).click();
  await page.getByRole("button", { name: "Add hike to day 3" }).click();
  await page.getByRole("dialog", { name: "Add a hike" }).locator("select").first().selectOption("ring-steall");
  await page.getByRole("button", { name: "Add to itinerary" }).click();

  await page.getByRole("button", { name: "Trail B: Ring of Steall" }).click();
  await expect(page.locator(".map-legend")).toContainText("B · Ring of Steall");
  await expect(page.locator(".activity-row.is-selected")).toContainText("Ring of Steall");

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
