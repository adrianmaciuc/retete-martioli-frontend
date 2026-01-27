---
applyTo: "**/*"
---

# Copilot instructions — Retete pentru Iepurasi 🍽️🐰

## High-level rules ✅

- Prefer **small, focused changes** and include a short plan in `DOCUMENTATION/` before large work — the repo keeps a short plan/MD for every feature/change (e.g. `AddRecipeMinimalStrapiPlan.md`).
- Never suggest committing secrets or `.env` contents into the repo. Always use environment variables and instruct the user to set them on Railway (backend) or in local `.env` (frontend `VITE_` variables).
- When you suggest code that changes behavior in production, include a brief verification step (curl, logs, dashboard check) and a remediation if something fails.

## Frontend conventions (src/)

- Codebase uses **TypeScript + React (Vite)**. Always type new modules and exports.
- When suggesting UI changes, add a `data-testid="..."` attribute to elements that will be asserted by Playwright E2E tests.
  - Follow the pattern used by tests: declare test ids as constants at the top of a spec, e.g. `const headerTitle = "header-title"`, then use `page.getByTestId(headerTitle)`.
- Update `src/lib/strapi.ts` when API contract or URL handling changes: it centralizes backend requests and mapping logic. Prefer to update mapping helpers (e.g. `mapStrapiToRecipe`) rather than duplicating parsing logic in components.
- For build-time env vars: remind that `VITE_` env vars are inlined at build time; changing them requires rebuilding the frontend.

## Backend conventions (backend/)

- Strapi configuration lives under `backend/config/` and uses `env('VAR', default)` pattern. When suggesting config changes, follow that style.
- Use the upload provider config (`backend/config/plugins.ts`) and rely on `UPLOAD_PROVIDER` + `CLOUDINARY_*` envs for production uploads.
  - Recommend trimming env values (`.trim()`) and adding simple startup validations for required production envs to fail fast.
- When proposing fixes for infra issues (uploads, DB, CORS), include the exact Railway checks (`Service → Settings → Environment Variables`) and `curl` commands to reproduce.

## Testing conventions (Playwright) 🎭

- E2E tests live under `playwright/tests/` and follow a clear pattern:
  - Define `data-testid` constants at the top of the spec file and reuse them across the test.
  - `data-testid` values should never by inside a test; they should always be defined as constants.
  - all data-testid const should be in camelCase
  - all data-testid const should be independent. Not allowed to group them in objects or other structures.
  - Keep tests deterministic: use `beforeEach` to clear localStorage or set initial state.
- For new UI features, add/adjust Playwright tests and a short test plan `.md` in `DOCUMENTATION/` describing the acceptance criteria.
- A `smoke.spec.ts` exists as an example of a comprehensive page check — match its structure for new smoke tests.

### How to structure a Playwright test

- Good example of a Playwright test structure:

```ts
import { test, expect } from "@playwright/test";
import { categoriesMockedResponse } from "../fixtures/test_data.js";

// Search bar
const searchBarInput = "search-bar-input";

// Recipe grid
const recipeGrid = "recipe-grid";

test("home page search", async ({ page }) => {
  await page.goto("/");

  // Get search input
  const searchInput = page.getByTestId(searchBarInput);
  await expect(searchInput).toBeVisible();

  // Type search query
  await searchInput.fill("pizza");

  // Verify recipe grid is still visible
  await expect(page.getByTestId(recipeGrid)).toBeVisible();
});
```

```ts
// Bad Code:
page.locator("[data-testid^=add-recipe-category-]").first();

// Good Code:
page.getByTestId(/^add-recipe-category-/).first();
```

## Documentation-first workflow 📋

- Before starting non-trivial work, create or update a plan in `DOCUMENTATION/` (one-page checklist with steps and validation). Keep the plan concise and actionable.
- When making a change that affects usage or deployment, update `DOCUMENTATION/troubleshooting.md` and `README.md` with the minimum necessary commands and troubleshooting tips.
- When a fix is suggested for a common issue, ask the user if they want to update `DOCUMENTATION/troubleshooting.md` with clear steps and expected outcomes.
- Always add a short verification checklist to the plan (commands to run, expected HTTP status codes, log paths).

## Error & production troubleshooting patterns ⚠️

- For 302/redirect issues: check `Location` header, check Railway domain settings, and verify `VITE_STRAPI_URL` in frontend service.
- For 403 from `/api/*`: check Strapi `Public` role permissions (find/findOne) in Admin → Settings → Users & Permissions → Roles → Public.
- For Cloudinary errors (`Invalid Signature`): verify `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` are set on the **backend** service (no trailing whitespace), confirm `UPLOAD_PROVIDER=cloudinary`, and redeploy backend. Suggest a Node quick-test snippet and `curl` upload example.

## Developer experience & style tips ✨

- Prefer clear, small helper functions (e.g. `normalizeUrl`) and centralize network/serialization logic in `src/lib/strapi.ts`.
- Keep components small and testable; favor explicit prop types and avoid any complex, implicit global state.
- When adding logs or diagnostics for production issues, add informative messages (include request path + short error cause) and avoid leaking secrets.
- All code is written in english, but all user-facing text (UI, docs) is in Romanian.
- no need to use special romanian characters (ă, ș, ț) in user-facing text; use plain ascii for compatibility.
