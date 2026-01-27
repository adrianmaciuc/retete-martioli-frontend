# Supabase Auth Implementation Plan

## Overview

This document outlines the implementation plan for adding lightweight user profiles and favorites via passwordless (magic-link) login using Supabase Auth.

## Requirements & UX

1. **Login via link**

   - User enters email (and optionally name) and clicks "Send login link".
   - Backend sends an email with a single-use, time-limited link to the user.
   - When user clicks the link they are authenticated and redirected into the app.

2. **Profile page (bare minimum)**

   - Show `email`, `name` (optional), `logout` button.
   - Allow favoriting recipes (only when logged in). Favorites are visible on profile page.

3. **Registration page**
   - Minimal form: `email` and `name` (client-side simple validation).
   - Submit triggers sending of a magic link email.

## Implementation Steps

### Step 1 — Create feature to login via link (Supabase)

1. Create a Supabase project: go to https://app.supabase.com and create a new project for this app.
2. Auth setup:
   - In the Supabase Console → Authentication → Settings:
     - Enable **Email sign-ups**.
     - Add your frontend redirect URLs (e.g., `http://localhost:5173`, `https://your-production-url`) under **Redirect URLs**.
     - Optionally customize email templates (Auth → Templates) for the magic link message in Romanian.
3. Create `favorites` table (SQL or Table editor). Example SQL:

```sql
create extension if not exists pgcrypto;

create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade,
  recipe_slug text not null,
  created_at timestamptz default now()
);

alter table public.favorites enable row level security;

create policy "Select own favorites" on public.favorites
  for select using (auth.uid() = user_id);

create policy "Insert own favorites" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "Delete own favorites" on public.favorites
  for delete using (auth.uid() = user_id);
```

4. Add environment variables to the frontend:
   - `VITE_SUPABASE_URL` = project URL
   - `VITE_SUPABASE_ANON_KEY` = anon public key
5. Frontend implementation (React):
   - Install: `npm i @supabase/supabase-js`
   - Create `src/lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

- Sign-in page: call `await supabase.auth.signInWithOtp({ email })` to send magic link.
- Listen for auth state: use `supabase.auth.onAuthStateChange` to react to login events and fetch user metadata.
- Protect `/profile` route client-side: check `supabase.auth.getUser()` or `session` and redirect to sign-in if missing.

6. Favorites UI & behavior:
   - Add a favorite (heart) button on `RecipeCard` that inserts into `favorites` via `supabase.from('favorites').insert({ user_id: user.id, recipe_slug })`.
   - Use Supabase RLS to ensure users only read/write their own favorites.
7. Playwright tests:
   - For E2E, either use a test SMTP inbox (dev SMTP) to grab the magic link, or set up a test helper endpoint (server-only) that uses the Supabase Service Role key to create a session for the test user and return a temporary cookie; call that helper in Playwright before visiting protected pages.

Estimated effort: **1–2 days** (Supabase flow + favorites + profile + tests)

### Step 2 — Profile page with email, logout, favorites

1. Add route `/profile` (protected) and a simple UI:
   - Show `email`, `name` (editable later), `logout` button
   - Show list of favorited recipes with quick links
2. Implement favorites logic:
   - UI: a heart/favorite button on `RecipeCard` that requires auth; it toggles favorite via POST/DELETE to `/favorites`
   - Backend: create `favorites` table and endpoints (if self-hosted), or Supabase table and rules
3. Only show `favorite` UI if `auth.isAuthenticated` true
4. Add Playwright tests for toggling favorites and verifying persistence

Estimated effort: **1 day**

### Step 3 — Registration page (minimal), send login link

1. The registration page is similar to sign-in: `email` and `name` fields
2. On submit, call `POST /auth/magic-link` (or `supabase.auth.signInWithOtp`) and show a success message "Check your email"
3. When user opens the link they are logged in and redirected to profile or the intended route
4. Optional: store name as user metadata on first sign-in

Estimated effort: **half day**

## Testing Plan

- Unit tests for token generation and verification (backend)
- Playwright E2E tests:
  - Sign-in (request magic link → simulate link click → confirm logged-in state)
  - Favorites flow (require logged-in; toggle favorite → check profile shows it)
  - Registration (same as sign-in with name)
- For email tests, use dev-only endpoints or ephemeral email-inbox test helpers to fetch the last sent token in test env

## Environment Variables & Configuration

- If Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client)

## Security & Operational Notes ⚠️

- Magic links are authentication — treat them as sensitive tokens.
- Use short expiry and single-use tokens.
- Prefer hashed token storage to prevent token leaks from DB backups.
- Rate-limit `/auth/magic-link` requests (per IP and per email) to avoid abuse.
- Use HTTPS and secure, HttpOnly cookies for sessions.
- Consider an optional "revoke all sessions" page for users later.

## Developer Checklist (minimal)

- [ ] Choose Supabase vs self-hosted
- [ ] Add server-side or Supabase setup
- [ ] Implement login & verify endpoints / integrate Supabase
- [ ] Implement Sign-in / Registration UI
- [ ] Implement profile page & favorites toggling
- [ ] Add Playwright tests for flows
- [ ] Add README docs & env var guide
- [ ] Run security review and QA

## Example Token Creation (Node) — simplified

```js
import crypto from "crypto";
const token = crypto.randomBytes(32).toString("hex");
// store HMAC(token, secret) in DB + expires_at
```

## Example Email Link

```text
Click to sign in: https://your-frontend.app/auth/verify?token=<raw-token>
(Expires in 15 minutes. Single use.)
```

## Next Steps

- Set up a minimal **Supabase** proof-of-concept and wire a front-end sign-in page + profile + favorites (fastest).
- OR scaffold a **self-hosted** Node/Strapi custom controller + email sender endpoints and tests.

Tell me which approach you prefer (Supabase or self-hosted) and I’ll start implementing the first step.

_If you want, I can also add Playwright tests and a CI workflow to verify the sign-in + favorites flows._
