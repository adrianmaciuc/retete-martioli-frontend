import { test, expect } from "@playwright/test";

const SECRET = process.env.VITE_ACCESS_SECRET || "random";

// Ensure clean state before each test
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("access gate - happy flow", async ({ page }) => {
  // Open access from home via "+" footer button
  await page.getByTestId("chef-access-button").click();
  await expect(page).toHaveURL(/\/access$/);
  await expect(page.getByTestId("access-title")).toBeVisible();

  // Correct login
  await page.getByTestId("access-name-input").fill("Adrian");
  await page.getByTestId("access-secret-input").fill(SECRET);
  await page.getByTestId("access-submit-button").click();

  // Secret page confirmation
  await expect(page).toHaveURL(/\/secret$/);
  await expect(page.getByTestId("secret-title")).toContainText(
    "Access Granted"
  );
  await expect(page.getByTestId("secret-greeting")).toContainText("Adrian");
  await expect(page.getByTestId("secret-redirect-message")).toBeVisible();

  // Auto-redirect to home within ~5s, badge visible
  await page.waitForURL(/\/$/, { timeout: 7000 });
  await expect(page.getByTestId("admin-mode-badge")).toBeVisible();

  // Logout clears access and returns to /access
  await page.getByTestId("admin-logout-button").click();
  await expect(page.getByTestId("admin-mode-badge")).toHaveCount(0);

  // Re-login and manually skip redirect
  await page.goto("/access");
  await page.getByTestId("access-name-input").fill("Adrian");
  await page.getByTestId("access-secret-input").fill(SECRET);
  await page.getByTestId("access-submit-button").click();
  await expect(page).toHaveURL(/\/secret$/);
  await page.getByTestId("secret-go-home-button").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("admin-mode-badge")).toBeVisible();
});

// Negative path: wrong secret shows error and stays on /access, badge absent on home
test("access gate - negative path", async ({ page }) => {
  // Open access from home
  await page.getByTestId("chef-access-button").click();
  await expect(page).toHaveURL(/\/access$/);

  // Wrong secret
  await page.getByTestId("access-name-input").fill("Adrian");
  await page.getByTestId("access-secret-input").fill("wrongsecret");
  await page.getByTestId("access-submit-button").click();

  // Stay on access, show error
  await expect(page).toHaveURL(/\/access$/);
  await expect(page.getByTestId("access-error")).toBeVisible();

  // Home should not show admin badge
  await page.goto("/");
  await expect(page.getByTestId("admin-mode-badge")).toHaveCount(0);
});
