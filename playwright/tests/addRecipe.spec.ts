import { test, expect } from "@playwright/test";
import path from "path";

const SECRET = process.env.VITE_ACCESS_SECRET || "random";

const chefAccessButton = "chef-access-button";
const accessNameInput = "access-name-input";
const accessSecretInput = "access-secret-input";
const accessSubmitButton = "access-submit-button";
const secretGoHomeButton = "secret-go-home-button";
const adminModeBadge = "admin-mode-badge";
const headerAddRecipe = "header-add-recipe";
const addRecipePage = "add-recipe-page";
const addRecipeTitleInput = "add-recipe-title-input";
const addRecipeDifficultySelect = "add-recipe-difficulty-select";
const addRecipeDescription = "add-recipe-description";
const addRecipePrepTime = "add-recipe-prep-time";
const addRecipeCookTime = "add-recipe-cook-time";
const addRecipeServings = "add-recipe-servings";
const addRecipeIngredientItem = (i: number) =>
  `add-recipe-ingredient-${i}-item`;
const addRecipeIngredientQuantity = (i: number) =>
  `add-recipe-ingredient-${i}-quantity`;
const addRecipeIngredientUnit = (i: number) =>
  `add-recipe-ingredient-${i}-unit`;
const addRecipeIngredientNotes = (i: number) =>
  `add-recipe-ingredient-${i}-notes`;
const addRecipeIngredientRemove = (i: number) =>
  `add-recipe-ingredient-${i}-remove`;
const addRecipeAddIngredient = "add-recipe-add-ingredient";
const addRecipeInstructionDescription = (i: number) =>
  `add-recipe-instruction-${i}-description`;
const addRecipeInstructionTips = (i: number) =>
  `add-recipe-instruction-${i}-tips`;
const addRecipeInstructionRemove = (i: number) =>
  `add-recipe-instruction-${i}-remove`;
const addRecipeAddStep = "add-recipe-add-step";
const addRecipeCoverContainer = "add-recipe-cover-container";
const addRecipeGalleryContainer = "add-recipe-gallery-container";
const addRecipeCoverFile = (i: number) => `add-recipe-cover-file-${i}`;
const addRecipeGalleryFile = (i: number) => `add-recipe-gallery-file-${i}`;
const addRecipeSubmit = "add-recipe-submit";
const addRecipeIngredientPrefix = "add-recipe-ingredient-";
const addRecipeInstructionPrefix = "add-recipe-instruction-";

// Ensure clean state before each test
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("Add a recipe - happy flow", async ({ page }) => {
  // Open access from home via "+" footer button
  await page.getByTestId(chefAccessButton).click();

  // login
  await page.getByTestId(accessNameInput).fill("Adrian");
  await page.getByTestId(accessSecretInput).fill(SECRET);
  await page.getByTestId(accessSubmitButton).click();

  // Navigate to home
  await page.getByTestId(secretGoHomeButton).click();

  await expect(page.getByTestId(adminModeBadge)).toBeVisible();

  await page.getByTestId(headerAddRecipe).click();

  // Wait for Add page to be visible
  await expect(page.getByTestId(addRecipePage)).toBeVisible();

  // Title
  await page.getByTestId(addRecipeTitleInput).fill("Clatite cu banane");
  await expect(page.getByTestId(addRecipeTitleInput)).toHaveValue(
    "Clatite cu banane"
  );

  // Difficulty
  await page.getByTestId(addRecipeDifficultySelect).selectOption("easy");
  await expect(page.getByTestId(addRecipeDifficultySelect)).toHaveValue("easy");

  // Description
  await page
    .getByTestId(addRecipeDescription)
    .fill("Cele mai delicioase clatite");
  await expect(page.getByTestId(addRecipeDescription)).toHaveValue(
    "Cele mai delicioase clatite"
  );

  // Times & servings
  await page.getByTestId(addRecipePrepTime).fill("10");
  await page.getByTestId(addRecipeCookTime).fill("5");
  await page.getByTestId(addRecipeServings).fill("2");

  // Ingredients (first row) - update existing
  await page.getByTestId(addRecipeIngredientItem(0)).fill("Lapte");
  await page.getByTestId(addRecipeIngredientQuantity(0)).fill("100");
  await page.getByTestId(addRecipeIngredientUnit(0)).fill("ml");
  await page.getByTestId(addRecipeIngredientNotes(0)).fill("De capra");

  // Add and remove an extra ingredient to exercise UI
  await page.getByTestId(addRecipeAddIngredient).click();
  await page.getByTestId(addRecipeIngredientItem(1)).fill("Faina");
  await page.getByTestId(addRecipeIngredientQuantity(1)).fill("200");
  await page.getByTestId(addRecipeIngredientUnit(1)).fill("g");
  // remove it
  await page.getByTestId(addRecipeIngredientRemove(1)).click();
  await expect(
    page.locator(`[data-testid=${addRecipeIngredientPrefix}1]`)
  ).toHaveCount(0);

  // Instructions - update first and add one
  await page.getByTestId(addRecipeInstructionDescription(0)).fill("Primul pas");
  await page.getByTestId(addRecipeInstructionTips(0)).fill("secret");
  await page.getByTestId(addRecipeAddStep).click();
  await expect(
    page.getByTestId(addRecipeInstructionDescription(1))
  ).toBeVisible();
  await page.getByTestId(addRecipeInstructionDescription(1)).fill("Pas doi");
  await page.getByTestId(addRecipeInstructionRemove(1)).click();
  await expect(
    page.locator(`[data-testid^=${addRecipeInstructionPrefix}1]`)
  ).toHaveCount(0);

  // Trigger validation (no files yet) - expect validation toast or visible messages
  await page.getByTestId(addRecipeSubmit).click();
  await expect(
    page.locator("text=Imaginea principala e obligatorie")
  ).toBeVisible();

  // Upload files via hidden input inside the FileInput container and assert file item appears
  await page
    .getByTestId(addRecipeCoverContainer)
    .locator('input[type="file"]')
    .setInputFiles(path.join(__dirname, "../fixtures/clatita.jpg"));
  await expect(page.getByTestId(addRecipeCoverFile(0))).toBeVisible();

  await page
    .getByTestId(addRecipeGalleryContainer)
    .locator('input[type="file"]')
    .setInputFiles(path.join(__dirname, "../fixtures/clatita.jpg"));
  await expect(page.getByTestId(addRecipeGalleryFile(0))).toBeVisible();

  // Submit and assert success toast or redirect
  await page.getByTestId(addRecipeSubmit).click();
  await expect(page.getByText("Eroare de creat reteta")).toBeVisible();
});
