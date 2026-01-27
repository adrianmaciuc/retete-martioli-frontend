# Access Gate (Secret Key) — Implementation Plan

**Goal:** Add a protected flow where a visitor can enter a name and a secret key on a special page; if the secret matches the single server-side secret (configurable via environment variable), the visitor gains access for 24 hours. Access is preserved with a signed token stored in an HttpOnly cookie (recommended) or in localStorage (less secure).

This doc provides a step-by-step plan, example server code (Express + Strapi), client code (React), Playwright testing tips, and security notes.

---

## Quick summary

- Secret is stored in an environment variable (e.g., `ACCESS_SECRET_KEY`) and never exposed to the front end.
- Verification happens on the server (constant-time compare).
- Successful verification results in a signed token (JWT) or signed cookie valid for 24 hours.
- Token stored in an **HttpOnly, Secure** cookie (recommended). Optionally you can store a plain flag in localStorage (less secure).

---

## Environment & configuration

- Add the secret to your environment (on the server / in CI / on the host):

```
# .env (server only)
ACCESS_SECRET_KEY=your-11charKey
JWT_SECRET=some-long-random-secret-for-signing
ACCESS_TOKEN_EXPIRY_HOURS=24
```

- **Important:** Do NOT expose `ACCESS_SECRET_KEY` or `JWT_SECRET` to the client or commit them to source control.

---

## High-level flow

1. User clicks a button → navigates to `/access` (Access page).
2. User enters `name` (free text) and `secretKey` (the 11-char secret).
3. Frontend POSTs the data to server endpoint (e.g., `POST /access/verify`).
4. Server validates the `secretKey` against `ACCESS_SECRET_KEY` using a constant-time comparison.
5. If valid, server issues a signed JWT (payload: { name, iat, exp }) and sets it in an HTTP-only cookie `access_token` (24h expiry).
6. User is redirected to the protected page; server or client can call `GET /access/me` to verify authentication.
7. Logout clears the cookie or removes localStorage flag.

---

## Implementation details — Server side (recommended: use signed cookie)

### Security notes

- Use constant-time comparison for secret checks to avoid timing attacks (e.g., use `crypto.timingSafeEqual`).
- Use `HttpOnly`, `Secure`, and `SameSite=Strict` or `Lax` for cookies.
- Set the cookie `expires` to 24 hours.
- Log failures but do not log raw secret input.
- Add rate limiting to `POST /access/verify` (e.g., 5 attempts per hour per IP/email).

---

## Implementation details — Strapi (custom controller)

If you run Strapi and want to keep logic inside it, add a small `access` controller and routes.

### Steps (Strapi v4/v5 style)

1. Add a new API: `src/api/access/routes/access.js` (POST /verify, GET /me, POST /logout).
2. Implement `src/api/access/controllers/access.js` using `crypto.timingSafeEqual` and JWT signing (`strapi.plugins['users-permissions'].services.jwt.issue` or `jsonwebtoken`).
3. Set cookies using `ctx.cookies.set('access_token', token, cookieOptions)` and read with `ctx.cookies.get('access_token')`.

Example pseudo-code for Strapi controller (verify):

```js
const raw = ctx.request.body.secretKey;
if (!timingSafeEqual(raw, process.env.ACCESS_SECRET_KEY)) return ctx.unauthorized('Invalid key');
const token = strapi.plugins['users-permissions'].services.jwt.issue({ name, exp: ... });
ctx.cookies.set('access_token', token, { httpOnly: true, secure, maxAge: 24*60*60*1000 });
ctx.send({ ok: true });
```

---

## Client side (React) — Access page & protected page

### Sign-in page `/access`

- Show a small form with `name` and `secretKey` inputs.
- On submit, POST to `/access/verify` and on success redirect to protected page (e.g. `/secret`).

Example fetch snippet:

```ts
const submit = async (name, secretKey) => {
  const res = await fetch("/access/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, secretKey }),
  });
  const json = await res.json();
  if (json.ok) window.location.href = "/secret";
  else alert("Wrong secret");
};
```

### Protected page `/secret`

- On mount, call `GET /access/me` to validate session; if 401 redirect back to `/access`.
- Optionally show user name from token payload.

---

## Logout & expiry

- Provide a logout button calling `POST /access/logout` to clear the cookie.
- Token auto-expires after 24 hours; client can refresh UI accordingly by checking `GET /access/me`.

---

## Testing (Playwright)

- Test case: visit `/access`, submit correct secret, expect redirect to `/secret`, and verify the cookie `access_token` exists.
- Create a test helper that can create a short-lived token server-side (e.g., 1 minute) to simulate expiry.
- For negative tests, submit wrong secret and verify error message and no cookie.

---

## Rate limiting and brute-force protection

- Add rate-limiting (IP + optional name/email buckets). Use a Redis-backed limiter for production.
- Optionally add a simple CAPTCHA after N failed attempts.

---

## Revocation & rotation

- To rotate the secret and invalidate all existing sessions immediately, either:
  - Use a separate `SIGNING_SECRET` (JWT_SECRET) and rotate it together; or
  - Store an include `issuedAt`/`version` in the token and check against server-side `CURRENT_VERSION` environment variable.

---

## Checklist

- [ ] Add `ACCESS_SECRET_KEY` and `JWT_SECRET` to server env
- [ ] Implement server endpoint (`/access/verify`, `/access/me`, `/access/logout`)
- [ ] Add rate limiting to `/access/verify`
- [ ] Implement React sign-in page and protected `/secret` route
- [ ] Add Playwright tests (success, failure, expiry)
- [ ] Add log/monitoring for failed attempts

---

If you want, I can:

- Scaffold the Express endpoints and React UI in a feature branch, or
- Implement Strapi controllers & routes with the same behavior and add Playwright tests.

Which do you prefer me to implement first?
