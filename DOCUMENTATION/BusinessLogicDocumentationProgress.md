# Business Logic Documentation Progress

This document tracks the step-by-step process of documenting all application business logic into:

- `main-business-logic.md` (overview + detailed architecture)
- `app-features.md` (feature-focused list of capabilities and user flows)

Process:

1. Read and analyze a chunk of the codebase (e.g., frontend components, lib helpers)
2. Document findings into `main-business-logic.md` and `app-features.md` (incremental updates)
3. Update this tracking doc with tasks, progress notes, and TODOs
4. Repeat for backend, auth, tests, and infra

Current plan:

- Create tracking doc (this file) — in progress
- Document frontend components and client logic — next

Notes:

- Work will be done in small chunks and committed in small PR-like edits to the docs.
- Each chunk will include: files read, summary of what they do, key business rules, and any edge cases or invariants.

Tasks:

- [x] Create tracking doc and plan
- [ ] Document frontend: pages, major components, lib/strapi mapping
  - Done: `src/lib/strapi.ts` documented (health checks, mapping, search, create-from-access)
  - Done: `src/pages/Index.tsx`, `RecipeGrid`, `RecipeCard`, `SearchBar`, `CategoryFilter` documented
  - Done: `src/pages/RecipePage.tsx`, `src/pages/AddRecipe.tsx`, `src/pages/Access.tsx` and the `src/lib/access.ts` auth helpers documented
  - Done: `RecipePage` and `Search` pages documented
  - Done: Playwright tests documented (`playwright/tests/*` and fixtures)
  - Done: Helpers and types documented (`src/lib/utils.ts`, `src/lib/sample-recipes.ts`, `src/lib/types.ts`)
  - Done: Finalized `main-business-logic.md` and `app-features.md` (initial pass)
  - Done: Created `DOCUMENTATION/BusinessLogicVerificationChecklist.md`
  - Next: Create PR, or review changes with maintainers and iterate on missing/advanced areas (hooks, less-used utilities, infra notes).
- [x] Document backend: Strapi models and controllers
  - Done: create-from-access controller documented (validation, upload flow, access verification)
  - Done: recipe and category content types documented (required fields, media, components)
  - Done: Strapi plugin & middleware configuration documented (Upload provider, Cloudinary env vars, middleware stack)
- [x] Document auth & access flows
- [x] Document tests and QA steps
- [x] Final pass: unify and polish `main-business-logic.md` and `app-features.md`

---

Last updated: 2026-01-11
