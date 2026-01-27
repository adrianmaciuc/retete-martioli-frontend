# App Features

## Data & Recipes

- Recipe list fetching (server-driven) with `GET /api/recipes?populate=*` and client-side mapping.
- Recipe detail fetch by slug with fallback to sample data if backend unavailable.
- Categories list fetch and normalization for filtering.
- Search: tries server-side filtered search, falls back to client-side fuzzy search over title, description, tags, ingredients, and instructions.
- Offline/sample-data mode when `VITE_STRAPI_URL` is not configured or backend health check fails.

## Media Handling

- Cover image and gallery extraction from Strapi media relations.
- Picks the best available format (`medium` or `small`) when available.
- Normalizes relative media URLs by prefixing `VITE_STRAPI_URL`.

## Content Creation (access-controlled)

- `createRecipeFromAccess`: endpoint allows frontend to POST a `FormData` (includes files) to `/api/recipes/create-from-access`.
- Uses `localStorage.access_grant` as bearer token when present to authorize creation.

## Resilience & UX

- Health check detects backend connectivity and allows the UI to display a health state and load sample content when needed.
- Mapping layer handles multiple Strapi response shapes to keep the rest of the app simple and typed.

---

## UI & UX

- Home page with hero search and recipe feed; search queries are placed in the URL to allow sharing/bookmarking.
- Debounced search input (300ms) for responsive UX.
- Category filtering with `All` fallback and per-category pills.
- Recipe cards with image, difficulty badge, time, servings, ingredients count, tags (first 3), and hover/animation effects.
- Loading skeletons and empty state illustrations for better perceived performance.

## Admin / Chef Mode

- Access gate (Chef Mode) controlled by a local `access_grant` token; if present, user sees an admin badge and can add recipes.
- Add recipe flow is behind `/access` page that grants an access token via a 'magic link' or other process; requests that create recipes include the bearer token.

## Testing & Determinism

- Elements are annotated with `data-testid` attributes to support Playwright tests and consistent selectors.

## Auth & Access

- Simple secret-based access gate using a build-time `VITE_ACCESS_SECRET`. Verification uses SHA-256 on the client to compare hashes, and a 24-hour `access_grant` is stored in `localStorage`.
- Admin/Chef Mode: Access grant controls UI state, allows creating recipes via a protected frontend flow.
- Creation: `createRecipeFromAccess` uploads form data including media files, sends access token if present.

## Backend features

- `POST /api/recipes/create-from-access` accepts multipart form data (JSON `data` + files) and creates a `recipe` entry.
- Access verification accepts either a server-issued JWT cookie (`access_token` with `role === 'chef'`) or a JSON-encoded grant in the `Authorization: Bearer <json>` header.
- Validates required fields and types server-side (title, desc, integer times, servings >= 1), generates slug if needed, resolves categories by slug, attaches uploaded media with Upload plugin, and publishes the created recipe.

## Recipe detail & search

- Recipe detail modal: cover image, difficulty badge, description, meta (time, servings, ingredient count), ingredients list, instructions with optional tips, gallery and lightbox with zoom controls.
- Print recipe via a dedicated button that invokes `window.print()` for easy sharing/printing.
- Search results are bookmarkable via `/search?q=...` and use server-side filtering with local fallback.

## Testing

- Playwright E2E tests cover smoke, home search & filters, access gate flows and add recipe scenarios.
- Tests use `data-testid` constants and local fixtures (`playwright/fixtures`) and mock network routes with `page.route()` when needed.
- File upload is tested via `setInputFiles` against fixture images in the tests folder.

## Uploads & Infrastructure

- Upload provider selected by `UPLOAD_PROVIDER` (default `local`). For production use `cloudinary` with `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` and optional `CLOUDINARY_FOLDER`.
- Backend requires several secrets for production: `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `ENCRYPTION_KEY` and `DATABASE_URL` when using Postgres.
- When switching to Cloudinary: install `@strapi/provider-upload-cloudinary`, set the env vars on your host (Railway/Vercel), deploy, and verify uploads by creating a recipe.
- Warning: Vite inlines `VITE_` env vars at build-time — ensure `VITE_STRAPI_URL` is set correctly before building the frontend for production.

## Security & Deployment notes

- CORS and security middleware should be tuned to allow only required origins/headers and to minimize the attack surface.
- Secrets management: set and rotate `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, and `ENCRYPTION_KEY` in your platform (Railway, Vercel, etc.). Avoid committing `.env` files.
- Upload provider: use `cloudinary` in production with the provider package installed, and configure `CLOUDINARY_*` env vars; validate file types and sizes.
- Health checks, backups and CI: add uptime checks for `/api/health`, regular content/media backups, and run tests in CI to prevent regressions on deploy.
