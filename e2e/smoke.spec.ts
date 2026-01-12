import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});

test("portal auth page is reachable", async ({ page }) => {
  await page.goto("/portal/auth");
  await expect(page.getByRole("button")).toBeVisible();
});
