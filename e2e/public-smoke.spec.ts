import { expect, test } from "@playwright/test";

test("public and admin entry pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/halal/i);
  await expect(page.getByRole("link", { name: /view results/i })).toBeVisible();

  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Admin Sign In" })).toBeVisible();

  await page.goto("/vote");
  await expect(page.locator("body")).toContainText(/Voter Login|Voting Not Open/i);

  await page.goto("/results");
  await expect(page).toHaveTitle(/halal/i);
  await expect(page.locator("body")).toContainText(/Results|Election|Pending/i);
});

test("about page does not log hydration mismatches", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.includes("hydrated but some attributes of the server rendered HTML didn't match")) {
      consoleErrors.push(text);
    }
  });

  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "COMELEC", exact: true })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("officers page images include responsive sizes hints", async ({ page }) => {
  const imageWarnings: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (text.includes('has "fill" but is missing "sizes" prop')) {
      imageWarnings.push(text);
    }
  });

  await page.goto("/officers");
  await expect(page.getByRole("heading", { name: "Officers" })).toBeVisible();

  expect(imageWarnings).toEqual([]);
});

test("help and privacy pages explain current ballot privacy flows", async ({ page }) => {
  await page.goto("/voter-help");
  await expect(page.getByRole("heading", { name: "Voter Help" })).toBeVisible();
  await expect(page.locator("body")).toContainText("Receipt code");
  await expect(page.locator("body")).toContainText("Verify your receipt");

  await page.goto("/admin-help");
  await expect(page.getByRole("heading", { name: "Officer Help" })).toBeVisible();
  await expect(page.locator("body")).toContainText("two-officer sign-in");
  await expect(page.locator("body")).toContainText("Officer verification is required");

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
  await expect(page.locator("body")).toContainText("Receipt hashes");
  await expect(page.locator("body")).toContainText("Operational logs do not contain ballot choices");
});
