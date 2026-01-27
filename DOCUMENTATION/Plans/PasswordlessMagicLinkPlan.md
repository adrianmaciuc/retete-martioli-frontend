# Passwordless (Magic Link) Auth & Simple Profiles — Implementation Plan

**Goal:** Add lightweight user profiles and favorites via passwordless (magic-link) login. Users register with an email (+ optional name), get a one-time magic link by email, and are logged in when they open the link — no password required.

---

## Short summary ✅

- **Supabase Auth (magic link)** — chosen for this project (free tier available). This gives fast, secure, low-maintenance passwordless auth and an easy way to store favorites with Row Level Security.

---

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

Notes:

- No password is used or stored.
- Email link should be one-time and expire quickly (e.g., 10–15 minutes).
- Sessions should be kept safe (HTTP-only cookies or secure JWT with proper protections).

---

## High-level design

### Option A — Supabase Auth (recommended)

Pros:

- Free tier, very low engineering effort
- Built-in passwordless (magic link) flow and hosted email sending (or can configure custom SMTP)
- Manages users, JWTs, sessions, security best practices
- Stores user metadata (email, name) and supports custom tables (favorites)

Cons:

- External service dependency (but free tier available)
- Slight addition to infra (Supabase project)

Implementation sketch:

- Create Supabase project → enable Email (magic link) auth
- Create `favorites` table in Supabase: columns {id, user_id, recipe_id, created_at}
- Frontend: use `@supabase/supabase-js` to:
  - call `supabase.auth.signInWithOtp({ email })` to send link
  - use `supabase.auth.onAuthStateChange` to detect login and fetch user
  - call restful Supabase functions or direct DB (via Row Level Security rules) for favorites
- Session handled with Supabase client; you can exchange session for a JWT if you need backend auth
- Add Playwright tests that simulate sign-in by calling Supabase API to create a temporary session token or mock responses

When to pick Supabase: you want fast, secure, and low-maintenance auth with magic links.

---

### Option B — Self-hosted (Strapi or lightweight Node service)

Pros:

- Full control, data stays in your systems
- Can use Strapi collections for user / favorites

Cons:

- More implementation work (secure token handling, email provider, rate limiting)

Design details (self-hosted):

1. Data model

   - `users` collection/table: id, email (unique), name, created_at
   - `magic_tokens` table: token_hash, user_id (nullable), email, expires_at, used (bool), created_at
   - `favorites` table: id, user_id, recipe_id/slug, created_at

2. Endpoints

   - POST /auth/magic-link { email, name? } -> generate token, save hashed token, send email
   - GET /auth/verify?token=... -> check token, set `used=true`, create user if required, create session cookie (HTTP-only) or return short-lived JWT, redirect to frontend
   - GET /auth/me -> returns current user
   - POST /favorites { recipeId } (requires auth) -> toggle favorite
   - GET /favorites -> list user's favorites

3. Token generation strategy (recommended)

   - Generate a cryptographically strong random token (e.g., 32 bytes hex)
   - Store only a hash (e.g., HMAC-SHA256) in DB with `expires_at` and `used=false`
   - Send raw token in the email link
   - On verification, hash the token and look up row; verify not used and not expired; set `used=true`

4. Session strategy

   - Option A: set an HTTP-only, Secure cookie with a session id linked in DB (recommended)
   - Option B: return a signed JWT in a cookie (HttpOnly) with short expiry + refresh approach

5. Email delivery

   - Local dev: MailHog / Mailtrap
   - Production: free tiers from **Mailgun** or **SendGrid**, or SMTP with Gmail App Password (note: Google may enforce quotas)

6. Security best practices
   - Token expiry short (10–15m)
   - Token single-use
   - Rate limit requests per IP/email (e.g., 5 per hour)
   - Use HTTPS on production and secure cookies (SameSite=Lax/Strict, Secure, HttpOnly)
   - Log suspicious activity (repeated token requests)

---

## Detailed implementation steps (user story order)

> Implementation approach: **Supabase (chosen)** — below are step-by-step tasks to implement the feature using Supabase. A short note for a self-hosted approach is included for later.

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

---

### Note — Self-hosted option (for future)

- Keep the earlier self-hosted plan sections; we can implement this later if we decide to move off Supabase.

---

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

---

### Step 3 — Registration page (minimal), send login link

1. The registration page is similar to sign-in: `email` and `name` fields
2. On submit, call `POST /auth/magic-link` (or `supabase.auth.signInWithOtp`) and show a success message "Check your email"
3. When user opens the link they are logged in and redirected to profile or the intended route
4. Optional: store name as user metadata on first sign-in

Estimated effort: **half day**

---

## Testing plan

- Unit tests for token generation and verification (backend)
- Playwright E2E tests:
  - Sign-in (request magic link → simulate link click → confirm logged-in state)
  - Favorites flow (require logged-in; toggle favorite → check profile shows it)
  - Registration (same as sign-in with name)
- For email tests, use dev-only endpoints or ephemeral email-inbox test helpers to fetch the last sent token in test env

---

## Environment variables & configuration

- If Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client)
- If self-hosted:
  - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
  - `JWT_SECRET` or `SESSION_SECRET`
  - `MAGIC_LINK_EXPIRY_MINUTES` (e.g., 15)
  - `FRONTEND_URL` (for constructing redirect link)

---

## Security & operational notes ⚠️

- Magic links are authentication — treat them as sensitive tokens.
- Use short expiry and single-use tokens.
- Prefer hashed token storage to prevent token leaks from DB backups.
- Rate-limit `/auth/magic-link` requests (per IP and per email) to avoid abuse.
- Use HTTPS and secure, HttpOnly cookies for sessions.
- Consider an optional "revoke all sessions" page for users later.

---

## Developer checklist (minimal)

- [ ] Choose Supabase vs self-hosted
- [ ] Add server-side or Supabase setup
- [ ] Implement login & verify endpoints / integrate Supabase
- [ ] Implement Sign-in / Registration UI
- [ ] Implement profile page & favorites toggling
- [ ] Add Playwright tests for flows
- [ ] Add README docs & env var guide
- [ ] Run security review and QA

---

## Example token creation (Node) — simplified

```js
import crypto from "crypto";
const token = crypto.randomBytes(32).toString("hex");
// store HMAC(token, secret) in DB + expires_at
```

## Example email link

```text
Click to sign in: https://your-frontend.app/auth/verify?token=<raw-token>
(Expires in 15 minutes. Single use.)
```

---

## Next steps I can take for you

- Set up a minimal **Supabase** proof-of-concept and wire a front-end sign-in page + profile + favorites (fastest).
- OR scaffold a **self-hosted** Node/Strapi custom controller + email sender endpoints and tests.

Tell me which approach you prefer (Supabase or self-hosted) and I’ll start implementing the first step.

---

_If you want, I can also add Playwright tests and a CI workflow to verify the sign-in + favorites flows._
