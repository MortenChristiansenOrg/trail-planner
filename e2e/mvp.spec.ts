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
