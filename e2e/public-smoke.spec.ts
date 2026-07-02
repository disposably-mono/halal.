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
