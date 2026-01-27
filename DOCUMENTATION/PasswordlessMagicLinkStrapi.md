# Passwordless (Magic Link) Auth with Strapi — Plan & Configuration Guide

**Goal:** Implement lightweight passwordless (magic link) authentication using email and add simple user profiles + favorites in Strapi so users can sign in with a link (no password), favorite recipes, and view their favorites on a profile page.

This document contains:

- A short plan (developer-oriented) for implementing magic-link auth in Strapi
- Step-by-step Strapi configuration guide (manual UI + code snippets)
- Security, testing and Playwright guidance

---

## Short summary / decision ✅

- Decision: Use Strapi for passwordless magic-link auth and store sessions using **HttpOnly, Secure cookies** (recommended for XSS/CSRF safety).
- Create a `magic-token` collection (stores token hash, expiry, used flag) and a `favorites` collection (user relation + recipe relation) and use secure single-use tokens.
- Session strategy: set a signed JWT (or session id) in an `HttpOnly` cookie with attributes: `httpOnly: true`, `secure` in production, `sameSite: 'Lax'`, `path: '/'`, and an appropriate `maxAge` (e.g., 24h for access gates, 24h–7d for login sessions depending on UX). Implement server-side logout to clear the cookie.

Estimated effort: 2–3 days to get a secure PoC.

---

## Requirements & UX

- Registration / Sign-in page: user supplies email (+ optional name) and clicks "Send login link".
- Backend: create single-use, time-limited tokens, email them, and validate on link click.
- After validation, set an authenticated session (cookie) and redirect the user to the app.
- Protected `/profile` page lists `email`, `name`, `logout`, and the user’s favorites.

---

## High-level design

### Data model (Strapi collection types)

- `user` — reuse Strapi's built-in `users` from Users & Permissions plugin (store email, username/name).
- `magic-token` (collection)
  - `token_hash` (string) — hashed token
  - `email` (string)
  - `user` (relation to `plugin::users-permissions.user`) — optional (link to existing user)
  - `expires_at` (datetime)
  - `used` (boolean, default false)
  - `created_at` (datetime)
- `favorites` (collection)
  - `user` (relation to `plugin::users-permissions.user`)
  - `recipe` (relation to `api::recipe.recipe`) — or store `recipe_slug`
  - `created_at`

Rationale: Keep tokens in DB as hashed values; tokens are single-use and time-limited.

---

## Implementation plan (step-by-step)

### Step 1 — Strapi content types & email provider

1. Create `magic-token` collection type (fields as above).
2. Create `favorites` collection type (user + recipe relation).
3. Configure Strapi email provider (Settings → Email plugin) with Mailgun/SendGrid/SMTP (or Mailtrap for dev). Set env vars (SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM).
4. Create environment variables:
   - `MAGIC_LINK_TOKEN_SECRET` (random string used for HMAC hashing)
   - `MAGIC_LINK_EXPIRY_MINUTES` (e.g., 15)
   - `JWT_SECRET` or `SESSION_SECRET` (if using JWT or session cookie)

### Step 2 — Magic link endpoints (controllers & routes)

Add custom routes & controllers under an `auth` plugin or `api/auth` in Strapi.

1. POST `/auth/magic-link` (body: { email, name? })

   - Rate-limit requests (per IP/email)
   - Find or create user (using Users & Permissions plugin)
   - Generate a cryptographically secure token (32 bytes hex)
   - Hash token with HMAC-SHA256 using `MAGIC_LINK_TOKEN_SECRET` and store `token_hash`, `email`, `expires_at`, `used=false` in `magic-token` collection
   - Send email via Strapi email service with link: `${FRONTEND_URL}/auth/verify?token=<raw-token>&redir=<encoded path>`
   - Respond: 200 { message: "Check email" }

2. GET `/auth/verify?token=...`

   - Hash raw token with HMAC-SHA256 and find record in `magic-token` where `token_hash` matches, `used=false`, `expires_at >= now`
   - If not found, show an error or expired message
   - Mark token `used=true` (atomic update)
   - Find/create user by email and ensure user is activated
   - Create a session for user:
     - Option A: create a signed JWT and set as HttpOnly cookie (short expiry)
     - Option B: create session record and set session id cookie
   - Redirect to frontend `redir` or `/profile`

3. GET `/auth/me` (requires session) — return current user
4. POST `/favorites` (requires auth) — toggle or add favorite
5. GET `/favorites` — list user's favorites

Note: Implement controllers and services grouped in `src/api/auth/controllers/*` or within a plugin to keep auth code isolated.

### Step 3 — Frontend integration

1. Sign-in page: call `POST /auth/magic-link` with email and optional name. Show success message.
2. On `/auth/verify` route in the frontend, accept `token` and call backend verify endpoint (if verify is server-side GET that sets cookie and redirects, frontend may just display final state).
3. Use `/auth/me` to populate user state in the React app and protect `/profile` route.
4. Use `favorites` endpoints to add/remove/list favorites. Only show the heart button when user is authenticated.

### Step 4 — Testing & Playwright

- For tests, create a dev-only endpoint (e.g., `/test-utils/get-last-magic-token?email=...`) that returns the last raw token or uses the Service Role to create sessions. Protect this endpoint (NODE_ENV=test only).
- Playwright flows:
  - Call `/test-utils` to fetch raw token, then open the verify link in the browser, assert logged-in state, toggle favorites, verify on profile.

---

## Strapi configuration guide — manual steps (UI + code)

### 1) Add collections

1. Login to Strapi admin panel.
2. Go to Content-Type Builder → Create new collection type: **magic-token**
   - Fields: `token_hash` (Text, required) , `email` (Text, required), `user` (Relation to User, optional, one-to-one or many-to-one), `expires_at` (DateTime), `used` (Boolean, default false)
3. Create **favorites** collection
   - Fields: `user` (Relation to User), `recipe` (Relation to Recipe), `created_at` (DateTime auto)
4. Save content types and wait for server to restart.

### 2) Configure Email Provider

1. Install provider plugin (if not present): e.g., `npm install @strapi/provider-email-sendgrid` or configure `nodemailer` SMTP.
2. In Strapi admin → Settings → Email plugin → set provider to your SMTP/Mailgun/SendGrid details via env vars (see provider docs).
3. Test email sending from the admin UI.

### 3) Create routes & controllers

- Create a new `auth` API (scaffold with `strapi generate` or add files manually):
  - `src/api/auth/routes/auth.js` — define routes for POST `/auth/magic-link`, GET `/auth/verify`, GET `/auth/me`.
  - `src/api/auth/controllers/auth.js` — implement controller methods.
  - `src/api/auth/services/auth.js` — token creation, email sending and verification logic.

Example controller pseudo-code (server-side Koa style):

```js
// src/api/auth/controllers/auth.js
import crypto from 'crypto';
const HMAC = (token) => crypto.createHmac('sha256', process.env.MAGIC_LINK_TOKEN_SECRET).update(token).digest('hex');

export default {
  async sendMagicLink(ctx) {
    const { email, name } = ctx.request.body;
    // rate limiting (implementation suggested)

    // find or create user via Users & Permissions
    let user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email } });
    if (!user) {
      user = await strapi.plugin('users-permissions').service('user').add({ email, username: name || email.split('@')[0], provider: 'email' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = HMAC(rawToken);
    const expiry = new Date(Date.now() + (parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15') * 60 * 1000));

    await strapi.entityService.create('api::magic-token.magic-token', { data: { token_hash: tokenHash, email, user: user.id, expires_at: expiry, used: false } });

    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${rawToken}`;
    await strapi.plugin('email').service('email').send({ to: email, subject: 'Your magic login link', text: `Click to sign in: ${verifyUrl}` });

    ctx.send({ ok: true, message: 'Magic link sent' });
  },

  async verify(ctx) {
    const rawToken = ctx.query.token;
    const tokenHash = HMAC(rawToken);
    const token = await strapi.entityService.findMany('api::magic-token.magic-token', { filters: { token_hash: tokenHash, used: false }, limit: 1 });
    if (!token || token.length === 0) return ctx.badRequest('Invalid or expired token');

    const record = token[0];
    if (new Date(record.expires_at) < new Date()) return ctx.badRequest('Token expired');

    // mark used
    await strapi.entityService.update('api::magic-token.magic-token', record.id, { data: { used: true } });

    // create session - example: sign a JWT and set cookie
    const jwt = /* sign jwt with strapi secret and user id */;
    const secure = process.env.NODE_ENV === 'production';
    ctx.cookies.set('session_token', jwt, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours in ms
    });

    ctx.redirect(process.env.FRONTEND_URL + '/profile');
  }
}
```

Notes:

- Use `strapi.entityService` (Strapi v4/v5) to create/read `magic-token` records.
- `strapi.plugin('email')` is the email service — check provider docs for correct usage if using a provider plugin.
- For JWT generation you can use `strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id })` in v4; check v5 APIs or use a separate JWT library.

### 4) Policies & permissions

- Keep `favorites` endpoints protected: create a policy or use role-based checks to require authenticated user.
- Make sure `magic-token` collection is only accessible via admin or via the custom controllers (do not expose it through the public API).

### 5) Rate limiting & abuse prevention

- Limit POST `/auth/magic-link` to e.g., 5 requests per email per hour, 20 requests per IP per hour.
- Consider adding CAPTCHA if showing abuse.

---

## Security best practices

- Store only hashed token values in DB (HMAC-SHA256 with SECRET), not raw tokens.
- Short expiry (10–15 minutes) and single-use tokens.
- Use HTTPS and HttpOnly+Secure cookies for session tokens.
- Rotate `MAGIC_LINK_TOKEN_SECRET` occasionally and store secrets in environment variables.

---

## Testing & Playwright guidance

- Create a dev-only endpoint to fetch last token for tests (only under NODE_ENV=test) so tests can simulate the email flow.
- Alternatively use a test SMTP (MailHog / Mailtrap) and read email body to extract the verify link.
- Playwright flow (recommended): call test helper to get token → visit `/auth/verify?token=...` → assert logged-in state → toggle favorites → assert persistence.

---

## Developer checklist

- [ ] Create `magic-token` collection
- [ ] Create `favorites` collection
- [ ] Configure email provider (SMTP / SendGrid / Mailgun)
- [ ] Add env vars: `MAGIC_LINK_TOKEN_SECRET`, `MAGIC_LINK_EXPIRY_MINUTES`, `FRONTEND_URL`, `JWT_SECRET`
- [ ] Implement `POST /auth/magic-link` and `GET /auth/verify`
- [ ] Implement session handling (cookie or JWT)
- [ ] Implement favorites endpoints & profile UI
- [ ] Add rate-limiting and tests
- [ ] Security review & QA

---

If you'd like, I can implement a secure Strapi PoC (controllers + routes + test helper) in a feature branch and add Playwright tests for sign-in and favorites. Tell me if you prefer the PoC to be implemented inside Strapi or as a small separate Node service that works with your Strapi backend (both are possible).
