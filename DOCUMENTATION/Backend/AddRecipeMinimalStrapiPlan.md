# Add Recipe — Minimal Strapi Change Plan

Goal: Enable a single `multipart/form-data` POST from the React UI directly to Strapi to create a recipe (data + files) with Access Gate (chefs-only) verification. Keep backend changes minimal and self-contained inside Strapi.

---

## ✅ Scope

- One new Strapi route: `POST /api/recipes/create-from-access`
- One controller with Access Gate verification + create + uploads
- Optional lightweight policy/middleware for rate limiting
- No separate proxy server in production

---

## 🔐 Access Control

- Cookie: `access_token` (HttpOnly) created by Access Gate
- Verify: `JWT_SECRET` (env var) → decode, ensure `role=chef`
- Fail: 401 (missing/invalid) or 403 (not chef)

---

## 🧱 Data Model (from StrapiConfigurationGuide)

- Basic: `title` (req), `slug` (UID from title), `description` (req)
- Media: `coverImage` (req, single), `galleryImages` (optional, multiple)
- Components (repeatable):
  - `ingredients`: `{ item(req), quantity(req), unit?, notes? }[]`
  - `instructions`: `{ stepNumber(req), description(req), image?, tips? }[]`
- Numbers: `prepTime`(int, req), `cookTime`(int, req), `servings`(int≥1, req)
- Enum: `difficulty` ∈ {Easy, Medium, Hard}
- Relation: `categories` (many-to-many via IDs or slugs)
- JSON: `tags`: string[]

---

## 📁 Files to Add (Strapi backend)

- `backend/src/api/recipe/routes/create-from-access.ts`
- `backend/src/api/recipe/controllers/create-from-access.ts`
- Optional: `backend/src/api/recipe/policies/require-chef.ts` (or use inline check in controller)

Note: Paths assume Strapi v5 TypeScript setup already present in `backend/config/*.ts`.

---

## 🛣️ Route Definition

- Method: `POST`
- Path: `/recipes/create-from-access`
- Handler: `recipe.createFromAccess`
- Middlewares/Policies:
  - `require-chef` (checks cookie JWT → role=chef)
  - Optional rate limiter (basic in-memory or provider-based)

Example (routes/create-from-access.ts):

```ts
export default {
  routes: [
    {
      method: "POST",
      path: "/recipes/create-from-access",
      handler: "createFromAccess.handle",
      config: {
        policies: [], // or ['plugin::your-policy.require-chef'] if extracted
        middlewares: [],
      },
    },
  ],
};
```

---

## 🎯 Controller Logic

1. Read cookie: `ctx.cookies.get('access_token')`; verify JWT with `process.env.JWT_SECRET`.
2. Parse multipart:
   - For Strapi v4/v5 use `parseMultipartData(ctx)` or `ctx.request.files` + `ctx.request.body` depending on version helpers.
   - Expect parts:
     - `data` (JSON string) with all fields (no inline files)
     - `coverImage` (single file)
     - `galleryImages` (multiple files)
     - `instructionImages[index]` (optional per-step file)
3. Validate payload:
   - Required fields and ranges per Data Model
4. Resolve categories:
   - If slugs provided, `strapi.entityService.findMany('api::category.category', { filters: { slug: { $in: slugs } } })` → IDs
5. Create recipe entry:
   - Option A (simple): `strapi.entityService.create('api::recipe.recipe', { data })`
   - Option B (when using helper): `create` with `{ data, files }` if your Strapi version supports automatic file binding
6. Upload files via Upload plugin:
   - Cover: attach as `coverImage`
   - Gallery: attach as `galleryImages`
   - Instruction step images: upload and then update recipe to link media inside `instructions[index].image` as needed
7. Return `{ ok: true, id, slug }`

---

## 📦 Media Linking Strategies

- Cover & Gallery:
  - Use Upload plugin with `ref=api::recipe.recipe`, `refId`, `field=coverImage|galleryImages`
- Instructions (component media):
  - Upload file → obtain file ID
  - Update recipe entry with `instructions[index].image` referencing the uploaded media
  - If Strapi version limitations apply, store images as gallery and reference paths; otherwise patch the entry

---

## ⚙️ Environment Variables

- `JWT_SECRET` — Access Gate cookie verification
- (Existing) Strapi keys (already configured in backend)

---

## 🖥️ Frontend Changes (Production)

- Submission URL: `POST /api/recipes/create-from-access` (Strapi)
- Keep single `FormData` submit with fields/files as above
- Dev mode can still use the proxy if desired; production posts directly to Strapi

---

## 🧪 Testing

- Unit (controller):
  - Invalid/missing cookie → 401/403
  - Validation errors → 400
  - Success path → returns `{ ok: true, id, slug }`
- Integration (Upload):
  - Cover + gallery upload attach correctly
  - Instruction image linkage works (if used)
- Playwright (UI):
  - Fill form, upload files, submit → redirect to `/recipe/:slug`
  - Negative: missing required fields blocks submission

---

## 🚀 Rollout

- Add route/controller files
- Set `JWT_SECRET` in backend env
- Restart Strapi; verify endpoint with a test `curl`
- Point frontend to `/api/recipes/create-from-access`

---

## 📋 Checklist

- [ ] Add Strapi route `/recipes/create-from-access`
- [ ] Implement controller: verify cookie JWT → role=chef
- [ ] Parse multipart data (data + files)
- [ ] Validate fields and ranges
- [ ] Resolve categories (slugs → IDs)
- [ ] Create recipe entry via `entityService.create`
- [ ] Upload and attach cover + gallery
- [ ] Link instruction step images (if provided)
- [ ] Return `{ ok, id, slug }`
- [ ] Update frontend submission URL to Strapi
- [ ] Write tests (unit/integration/E2E)

---

## 🔗 References

- DOCUMENTATION/StrapiConfigurationGuide.md
- DOCUMENTATION/AddRecipeViaUIPlan.md
- DOCUMENTATION/BackendCompatibilityGuide.md
