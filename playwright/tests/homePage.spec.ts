import { test, expect } from "@playwright/test";
import { categoriesMockedResponse } from "../fixtures/test_data.js";

// Search bar
const searchBarInput = "search-bar-input";
const searchBarClearButton = "search-bar-clear-button";

// Recipe grid
const recipeGrid = "recipe-grid";

// Categories
const categoryFilterAll = "category-filter-all-button";
const categoryFilterPreferateCopiilor =
  "category-filter-preferatele-copiilor-button";

// Recipe cards
const firstCard = "recipe-card-1";
const allRecipesCards = /^recipe-card-content-/;

test("home page search", async ({ page }) => {
  await page.goto("/");

  // Get search input
  const searchInput = page.getByTestId(searchBarInput);
  await expect(searchInput).toBeVisible();

  // Type search query
  await searchInput.fill("pizza");

  // Verify recipe grid is still visible
  await expect(page.getByTestId(recipeGrid)).toBeVisible();

  // Verify that only one result contains "pizza" in the URL or title
  const pizzaCard = page.getByTestId("recipe-card-1");
  await expect(pizzaCard).toBeVisible();
  const pizzaCard2 = page.getByTestId("recipe-card-2");
  await expect(pizzaCard2).not.toBeVisible();

  // Test clear button
  await page.getByTestId(searchBarClearButton).click();

  // Verify search input is cleared
  await expect(searchInput).toHaveValue("");

  // Search for non-existent recipe
  await searchInput.fill("nonexistentrecipe123");

  // Verify empty state or no results
  await expect(page.getByTestId(allRecipesCards)).toHaveCount(0);
});

test("home page filters", async ({ page }) => {
  await page.route("**/api/categories", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(categoriesMockedResponse),
    });
  });

  await page.goto("/");

  // Verify all recipes are shown initially
  await expect(page.getByTestId(recipeGrid)).toBeVisible();
  await expect(page.getByTestId(allRecipesCards)).toHaveCount(6);

  // Click on Preferatele copiilor category
  await page.getByTestId(categoryFilterPreferateCopiilor).click();

  // Verify no cards visible
  await expect(page.getByTestId(firstCard)).not.toBeVisible();

  // Click back to "All" category
  await page.getByTestId(categoryFilterAll).click();

  // Verify total number of recipes is shown again
  expect(page.getByTestId(allRecipesCards)).toHaveCount(6);
});
