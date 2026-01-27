# Main Business Logic

## Frontend - Strapi Client (src/lib/strapi.ts) 🔧

Summary:

- Single client that wraps calls to the Strapi backend and provides resilient behavior and mapping to the app's internal `Recipe` type.
- Uses `VITE_STRAPI_URL` environment variable (normalized to a proper URL); if missing, the client serves sample data from `sample-recipes.ts`.

Key behaviors and business rules:

- Health check
  - `checkBackendHealth()` pings `/api/health` with a short timeout (3s) and sets an internal `backendHealthy` flag.
  - If the backend is unreachable or returns unexpected responses, the app falls back to sample data and marks health as failed.
- Data mapping
  - `mapStrapiToRecipe()` normalizes Strapi v4/v5 shapes: supports `attributes` wrappers and relation containers.
  - Images: constructs absolute URLs by combining `STRAPI_URL` with media `url` fields; extracts best available format (`medium`, `small`, or original).
  - Gallery detection: scans attributes keys for names matching `/gallery|image/i` to collect additional images while excluding the `coverImage`.
  - Categories: handles relational wrappers (data/attributes) and normalizes to `{id, name, slug}`.
  - Tags: supports arrays or object-shaped tags; normalizes to a string array.
  - Ingredients and instructions are normalized into typed arrays with ids and default values.
- Fetching
  - `getRecipes()` calls `/api/recipes?populate=*` and maps results. On error or absent backend URL, returns `sampleRecipes`.
  - `getRecipeBySlug(slug)` queries with a filters parameter and returns either a mapped recipe or null (or sample fallback when backend missing).
  - `getCategories()` calls `/api/categories`, returns list of categories normalized to `{id, name, slug}`.
- Search behavior
  - `searchRecipes(query)` first attempts a server-side filtered query using Strapi `$containsi` filters on title, description, and tags.
  - If server returns results, maps and returns them; if empty or on error, falls back to a local client-side search across title, description, tags, ingredients, and instruction text.
- Create-from-access
  - `createRecipeFromAccess(formData)` posts to `/api/recipes/create-from-access` using a bearer token stored in `localStorage` under `access_grant` if present.
  - Uses `credentials: include` and returns `{ok, id, slug}` on success; returns error details on failure.

Invariants / Notes:

- The client is defensive: missing backend URL => sample data mode.
- All network errors set `backendHealthy = false` so UI can display a warning and proceed with offline data.
- Image URL normalization expects Strapi to produce relative paths that can be prefixed by `STRAPI_URL`.

---

### Frontend - Pages & Components (Index, Search, RecipeGrid, RecipeCard, CategoryFilter) 🧭

Index page (`src/pages/Index.tsx`):

- Loads initial recipes and categories on mount. Performs a backend health check first; if the backend is unhealthy an alert message is shown and sample data may be used.
- Search flow: uses `Hero` component for search input and `handleSearch` that updates URL query (`/search?q=...`) and state so results are shareable/bookmarkable.
- Category filter: `CategoryFilter` shows categories (fetched + a default `All` item) and toggles `selectedCategory` state.
- Add recipe action: `+` button (Chef Mode) navigates to `/add-recipe` when `isAccessGranted()` is true, otherwise to `/access`.
- Admin badge: when access granted, shows badge with access name and logout button that clears local storage and reloads.

Search (`src/components/SearchBar.tsx`):

- Debounced (300ms) input which calls `onSearch(query)`; exposes clear button.
- Visual focus states and accessible attributes; used by multiple pages (home, search page).

Recipe grid & cards (`RecipeGrid` / `RecipeCard`):

- Loading state: skeleton placeholders for UX while fetching.
- Empty state: friendly message inviting to broaden search or select the `All` category.
- Card content: shows cover image (object-fit cover), difficulty badge (color-coded), title, short description, total time (prep + cook), servings, ingredients count, and up to 3 tags.
- Cards are clickable and navigate to recipe detail pages by slug.

Category filter (`CategoryFilter.tsx`):

- Displays categories as pill buttons; falls back to a minimal `All` option if categories list is empty.
- Selected category applied by slug.

UX invariants and notes:

- Search is performed both locally (client-side) and server-side (the strapi client attempts server-side first), providing resilient search UX.
- All interactive elements include `data-testid` attributes for deterministic Playwright tests.

---

### Access & Creation Flow (Access Page, Secret, AddRecipe) 🔐

Access gate (`src/pages/Access.tsx` + `src/lib/access.ts`):

- Access secret is provided via `VITE_ACCESS_SECRET` (build-time env var).
- Verification (`verifySecret`) performs a SHA-256 hash of the provided secret and compares it to a hash of the configured secret; success stores a JSON `access_grant` object in localStorage with {name, grantedAt, expiresAt} (24h validity).
- Helpers (`isAccessGranted`, `getAccessName`, `getAccessTimeRemaining`, `clearAccessGrant`) read/clear this localStorage entry to control UI state (Chef Mode badge, navigation guard).
- `Secret` page confirms the grant and auto-redirects to home after 5s; logging out clears local storage.

Add recipe (`src/pages/AddRecipe.tsx`):

- Protected route: redirects to `/access` if `isAccessGranted()` is false.
- Form collects title, description, times, servings, difficulty, ingredients, instruction steps, categories (selected by slug), cover image and gallery images.
- Client-side validation enforces: title, description, cover image, and at least one gallery image.
- Submission packages the recipe `data` object into `FormData`, appends files (`coverImage`, multiple `galleryImage`) and calls `createRecipeFromAccess(fd)` which posts to `/api/recipes/create-from-access`.
- On success, a toast is shown and user is redirected to home; on error, an error page is shown and the user is navigated back to home after a delay.

Security notes / invariants:

- Access control is client-side: secret embedding in build and client-side verification is sufficient for a simple gating UX, but it is not equivalent to server-side authenticated users. Backend endpoints should perform server-side validation of `access_grant` as well (see backend docs to be added).
- `createRecipeFromAccess` sends `Authorization: Bearer <token>` header when `access_grant` is present, and uses `credentials: include` to send cookies if needed.

---

## Backend - Strapi (create-from-access & content schemas) 🏗️

Create-from-access route (`backend/src/api/recipe/routes/create-from-access.ts`):

- POST `/api/recipes/create-from-access` — configured as a public route (auth: false) but controller enforces access via `verifyChefAccess`.

Controller (`backend/src/api/recipe/controllers/create-from-access.ts`):

- Access verification (`verifyChefAccess`):
  - First checks for a cookie `access_token` expected to be a JWT signed with `JWT_SECRET`. JWT must decode to an object with `role === 'chef'` to pass.
  - Falls back to the `Authorization: Bearer <jsonGrant>` header where `<jsonGrant>` is a JSON-encoded grant object previously stored by the frontend. The grant is parsed and accepted if it contains `expiresAt` in the future.
  - Returns 401/403 with a clear error message when verification fails.
- Multipart parsing (`parseMultipart`) extracts `data` (JSON string or object) and `files` (coverImage, galleryImage(s)).
- Validation (`validateData`) enforces required fields and types: `title` and `description` (non-empty strings), `prepTime` and `cookTime` integers >= 0, `servings` integer >= 1.
- Slug generation: if `slug` not provided, created from `title` by lowercasing and replacing non-word chars and spaces with dashes.
- Category resolution: if `categorySlugs` included, resolves them via `strapi.entityService.findMany('api::category.category', { filters: { slug: { $in } } })` and collects numeric ids.
- Entity creation: creates the recipe via `strapi.entityService.create('api::recipe.recipe', { data })`.
- File uploads: uses Upload plugin (`strapi.plugin('upload').service('upload').upload({...})`) with `ref=api::recipe.recipe`, `refId` numeric id, and `field` set to `coverImage` or `galleryImage`.
- Category linking: for resolved categories the controller updates the category to point its `recipe` relation to the created recipe id.
- Publishing: updates the recipe entry with `publishedAt` timestamp.
- Response: returns `{ ok: true, id: recipeId, slug }` on success or an error with appropriate HTTP status on failure.

Content schemas (key fields):

- `api::recipe.recipe` (`backend/src/api/recipe/content-types/recipe/schema.json`):
  - Required: `title`, `slug` (uid of title), `description`, `coverImage` (media, single), `galleryImage` (media, multiple), `ingredients` (component, repeatable), `instructions` (component, repeatable), `prepTime` (integer), `cookTime` (integer), `servings` (integer >= 1).
  - `difficulty` is an enumeration: `easy | medium | hard`.
  - `categories` relation: oneToMany mapped by `recipe` in `category`.
- `api::category.category` stores `name`, `slug` (UID) and manyToOne relation to a recipe.

Backend invariants & notes:

- The controller is defensive: it validates input before creating records and attempts uploads while continuing even if upload fails (logs errors).
- Access verification supports both cookie-based JWT (for server-issued tokens) and frontend localStorage grant via Authorization header for the simple chef-mode flow.
- Category linking approach updates category entries to point to a recipe; be aware of this modeling when migrating or changing relations.

---

## Strapi configuration & environment variables (plugins, middleware, uploads) 🧩

Upload plugin (`backend/config/plugins.ts`):

- `provider` is configured via `UPLOAD_PROVIDER` env var (defaults to `local`).
- When set to `cloudinary`, provider options require `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, and `CLOUDINARY_SECRET`.
- `actionOptions.upload.folder` uses `CLOUDINARY_FOLDER` (default `recipes`) so uploads are organized under this folder in Cloudinary.
- Production note: install `@strapi/provider-upload-cloudinary` in the backend project when using Cloudinary; when `provider` is `local` uploads are stored on the Strapi server filesystem.

Server & admin env vars (critical):

- `APP_KEYS` (comma-separated array) — required for Strapi app keys.
- `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET` — used for tokens and signed cookies. `JWT_SECRET` must be set if the app relies on JWT cookies (e.g., server-issued `access_token` used by the `create-from-access` controller).
- `ENCRYPTION_KEY`, `TRANSFER_TOKEN_SALT` — additional admin secrets used for data transfer and encrypted values.
- `DATABASE_CLIENT`, `DATABASE_URL` — configure database type and connection (sqlite local, postgres in production).
- `UPLOAD_PROVIDER`, `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`, `CLOUDINARY_FOLDER` — required when using Cloudinary for media storage.
- `HOST`, `PORT` — server bind settings (defaults: `0.0.0.0`, `1337`).

Middlewares (backend/config/middlewares.ts):

- Default middleware stack in this project includes: `logger`, `errors`, `security`, `cors`, `poweredBy`, `query`, `body`, `session`, `favicon`, and `public`.
- Tune `security` and `cors` settings when deploying (allow frontend origin, restrict headers) — misconfigured CORS is a common cause of request failures in production.

Operational & security notes:

- Cloud deployment checklist: set `DATABASE_CLIENT=postgres`, `DATABASE_URL`, `UPLOAD_PROVIDER=cloudinary`, provide Cloudinary envs, set `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET` and rebuild the app.
- Verify uploads by creating a recipe with images and confirming files appear in Cloudinary and are linked to the recipe's `coverImage`/`galleryImage` fields in Strapi.
- The `create-from-access` controller accepts both cookie-based JWT (`access_token` with `role === 'chef'`) and a client-sent JSON grant in the `Authorization` header; JWT verification depends on `JWT_SECRET` being present and correct.
- Never commit `.env` files containing secrets.

---

## Middleware, Security Tuning & Deployment nitty-gritty 🔒🚀

Middleware & security tuning:

- CORS: configure allowed origins and headers via the `security` middleware or in Strapi `server` config. In production, explicitly allow the frontend origin(s) and required headers (e.g., `Authorization`, `Content-Type`) to prevent CORS failures.
- Body & file size limits: tune `strapi::body` settings to limit request body size (e.g., `limit: "10mb"`) to avoid abusive large uploads; restrict accepted file types at upload handling points.
- Session & cookie security: set secure cookie flags, `httpOnly`, and `sameSite` policy in production. For JWT cookies, rotate `JWT_SECRET` periodically and ensure secrets are strong.
- Rate limiting and abuse prevention: consider adding a rate limiter (middleware or proxy level) to protect endpoints like `create-from-access`.
- Logging & error tracking: integrate Sentry or another error tracker; ensure logs do not include secrets or full token payloads in production.
- Permissions & policies: keep the Public role minimal (only `find` / `findOne` for read endpoints). For write flows, enforce server-side checks in controllers (as done in `create-from-access`) and consider adding policies for additional hardening.

Deployment & operational notes:

- Build-time envs: Vite inlines `VITE_` env vars at build time — set `VITE_STRAPI_URL` before building the frontend for production.
- Database & migrations: when moving from SQLite to Postgres, export and import via Strapi Data Transfer tools and validate content-type compatibility.
- Upload provider (Cloudinary): for production set `UPLOAD_PROVIDER=cloudinary` and provide `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`, and optionally `CLOUDINARY_FOLDER` in your environment; ensure `@strapi/provider-upload-cloudinary` is installed in the backend.
- Health checks and uptime monitoring: expose or use `/api/health` and add monitoring/uptime checks; alert on error rates, high latency or failed uploads.
- Backups & data exports: schedule regular Strapi exports and backup uploaded media (Cloudinary or object storage) and database backups for recovery.
- CI/CD & rollback: configure deployment pipeline to set env vars, run tests (including Playwright where feasible), and revert to previous deployment when a release causes regressions.

Operational checklist (quick):

- Ensure `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `ENCRYPTION_KEY` are set in production and rotated periodically.
- Verify uploads by creating a recipe with images and confirming media appears in Cloudinary and is linked to recipe fields in Strapi.
- Monitor CORS and backend logs after deploy to catch misconfigurations early.

---

## Tests & QA (Playwright) ✅

Overview:

- End-to-end tests are implemented with Playwright under `playwright/tests/` and rely heavily on `data-testid` attributes for deterministic selectors.
- Fixture data is stored under `playwright/fixtures/` (e.g., `test_data.js`) and is used to mock or stub responses in tests.

Key tests:

- `smoke.spec.ts`: sanity checks for home page structure and sample data behavior. It asserts presence of header, hero, recipe counts, categories and sample data alert when backend is not configured.
- `homePage.spec.ts`: validates search and filters, uses `page.route()` to stub `/api/categories` responses and checks UI behavior when categories change.
- `accessGate.spec.ts`: end-to-end verification of the access gate flow (happy and negative paths), including localStorage clearing, secret verification behavior and expected navigation (Access → Secret → Home) and admin badge visibility.
- `addRecipe.spec.ts`: simulates the Add Recipe flow by obtaining access, filling form fields, exercising add/remove behaviors for ingredients and steps, uploading files using `setInputFiles`, and asserting validation and submission behavior.

Testing conventions:

- Tests define `data-testid` constants at the top for reuse.
- Deterministic UI checks: tests wait for visibility of specific elements and avoid brittle CSS selectors.
- File uploads in tests are performed by selecting hidden file inputs inside `FileInput` components and using `setInputFiles` with local fixtures.

Notes:

- Tests assume `VITE_ACCESS_SECRET` is available in the test environment for the access gate happy paths.
- Add recipe test expects an error after submit in the current test environment (likely because backend upload isn't available in CI). This is asserted rather than being treated as a failure.

---

### Helpers & Types 🧩

- Types (`src/lib/types.ts`) define the app data model for `Recipe`, `Ingredient`, `Instruction`, `Category` and `Difficulty`. These types are the contract used across components and for mapping Strapi responses.
- Sample data (`src/lib/sample-recipes.ts`) provides a deterministic dataset used when backend is not configured or unreachable. It includes `processImages` used by the recipe detail component.
- Utilities: `src/lib/utils.ts` exports `cn(...)` which combines `clsx` + `tailwind-merge` for consistent className merging.

Notes:

- The app relies on typed shapes so mapping functions (`mapStrapiToRecipe`) ensure the Strapi response conforms to the `Recipe` type, including field defaults.

---

### Recipe Detail & Search UX 🔍📸

Recipe detail (`src/pages/RecipePage.tsx` + `src/components/RecipeDetail.tsx`):

- Fetches a recipe by slug using `getRecipeBySlug(slug)` and displays a full-screen (modal-like) detail view via `RecipeDetail`.
- Shows hero image (cover), difficulty badge, description, quick meta (total time, servings, ingredients count), ingredients list and step-by-step instructions with optional tips.
- Gallery: renders additional `galleryImages` with click-to-open lightbox which supports zoom controls and close behavior.
- Print: exposes a print button to print recipe content via `window.print()`.
- Error handling: shows a friendly error with back navigation when recipe not found or when loading fails.

Search page (`src/pages/Search.tsx`):

- Reads `q` from the URL query string and runs `searchRecipes(q)` on mount and when `q` changes.
- SearchBar triggers URL updates (`/search?q=...`) so searches are bookmarkable and shareable.
- Loading and error states are surfaced to the user; leverages the same `RecipeGrid` component for results.

UX invariants:

- All interactive flows maintain deterministic `data-testid` attributes for E2E test reliability.
- Search is resilient and uses backend filtering first, falling back to client-side filtering when needed.

---
