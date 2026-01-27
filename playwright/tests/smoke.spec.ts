import { test, expect } from "@playwright/test";

// Page structure
const homePage = "home-page";
const homeMain = "home-main";

// Header
const header = "header";
const headerTitle = "header-title";
const headerSubtitle = "header-subtitle";

// Hero section
const heroSection = "hero-section";
const heroTitle = "hero-title";
const heroSubtitleHighlight = "hero-subtitle-highlight";
const heroDescription = "hero-description";
const heroRecipeCount = "hero-recipe-count";
const heroRecipeNumber = "hero-recipe-number";
const heroRecipeLabel = "hero-recipe-label";

// Search bar
const searchBarInput = "search-bar-input";

// Alerts
const backendErrorAlert = "backend-error-alert";
const backendErrorMessage = "backend-error-message";

// Recipe grid
const recipeGrid = "recipe-grid";

// Footer
const homeFooter = "home-footer";
const footerText = "footer-text";

test("home page smoke test - validate all elements", async ({ page }) => {
  await page.goto("/");

  // Page structure
  await expect(page.getByTestId(homePage)).toBeVisible();
  await expect(page.getByTestId(homeMain)).toBeVisible();

  // Header
  await expect(page.getByTestId(header)).toBeVisible();
  await expect(page.getByTestId(headerTitle)).toHaveText("Retete");
  await expect(page.getByTestId(headerSubtitle)).toHaveText("Pentru iepurasi");

  // Hero section
  await expect(page.getByTestId(heroSection)).toBeVisible();
  await expect(page.getByTestId(heroTitle)).toContainText("Retete delicioase");
  await expect(page.getByTestId(heroSubtitleHighlight)).toHaveText(
    "Pentru iepurasi pofticiosi"
  );
  await expect(page.getByTestId(heroDescription)).toHaveText(
    "Colectie de retete delicioase pentru orice ocazie"
  );

  // Recipe count
  await expect(page.getByTestId(heroRecipeCount)).toBeVisible();
  await expect(page.getByTestId(heroRecipeNumber)).toHaveText("6");
  await expect(page.getByTestId(heroRecipeLabel)).toHaveText(
    "retete in colectie"
  );

  // Search bar
  const searchInput = page.getByTestId(searchBarInput);
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toBeEnabled();
  await expect(searchInput).toHaveAttribute(
    "placeholder",
    "Cauta dupa nume sau ingredient..."
  );

  // Sample data alert
  await expect(page.getByTestId(backendErrorAlert)).toBeVisible();
  await expect(page.getByTestId(backendErrorMessage)).toContainText(
    "Using sample data:"
  );

  // Category filter buttons
  const categories = [
    "all",
    "italian",
    "seafood",
    "thai",
    "desserts",
    "healthy",
  ];
  for (const category of categories) {
    await expect(
      page.getByTestId(`category-filter-${category}-button`)
    ).toBeVisible();
  }

  // Recipe cards - check by slug
  const recipeIndexes = [1, 2, 3, 4, 5, 6];

  for (const id of recipeIndexes) {
    const card = page.getByTestId(`recipe-card-${id}`);
    await expect(card).toBeVisible();
    await expect(page.getByTestId(`recipe-card-title-${id}`)).toBeVisible();
    await expect(
      page.getByTestId(`recipe-card-difficulty-${id}`)
    ).toBeVisible();
    await expect(page.getByTestId(`recipe-card-time-${id}`)).toBeVisible();
    await expect(page.getByTestId(`recipe-card-servings-${id}`)).toBeVisible();
  }

  // Recipe grid
  await expect(page.getByTestId(recipeGrid)).toBeVisible();

  // Footer
  await expect(page.getByTestId(homeFooter)).toBeVisible();
  await expect(page.getByTestId(footerText)).toContainText("Creat cu");
});
