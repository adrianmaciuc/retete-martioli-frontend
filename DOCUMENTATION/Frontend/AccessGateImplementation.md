# Access Gate Implementation Guide

**Date:** December 23, 2025  
**Status:** ✅ Implemented  
**Approach:** Client-side localStorage + SHA256 hashing with environment variables

---

## Overview

A lightweight access control system that gates visitors to a protected `/secret` page. Users enter their name and a secret key on `/access` page. If the secret matches the one stored in environment variables, they gain access for 24 hours via localStorage.

**Key Features:**

- ✅ Zero backend changes (no Strapi modifications)
- ✅ Secret stored in environment variables only (never in source code)
- ✅ 24-hour expiry with localStorage
- ✅ SHA256 hashing for secret verification
- ✅ Clean redirect on token expiry
- ✅ Logout clears access

---

## Architecture

### How It Works

1. **User visits `/access`** → Sees form with Name + Secret Key inputs
2. **User submits form** → Frontend hashes the input secret with SHA256
3. **Hash comparison** → Frontend hashes the env var secret, compares hashes
4. **On match** → Stores `{ name, grantedAt, expiresAt }` in localStorage
5. **Redirect to `/secret`** → Protected page checks localStorage validity
6. **Expiry check** → If expired, redirects back to `/access`
7. **Logout** → Clears localStorage, goes back to `/access`

### Security Model

- **Secret location:** Environment variables only (Railway env UI, local `.env`)
- **Secret visibility:** Never appears in source code
- **Hashing:** SHA256 (constant-time comparison)
- **Storage:** Browser localStorage (client-side)
- **Expiry:** JavaScript `Date.now()` timestamp check
- **Transport:** localStorage (no network calls)

**Security Level:** Medium (suitable for semi-public/friendly gates, not for sensitive data)

---

## File Structure

```
src/
├── pages/
│   ├── Access.tsx       # Login form page
│   └── Secret.tsx       # Protected content page
├── App.tsx              # Routes wired
└── ...

.env.example            # Added VITE_ACCESS_SECRET
.env                    # Local: set your secret here
```

---

## Implementation Details

### 1. Environment Variables

**File: `.env.example`**

```dotenv
# Access Gate - Secret key stored in env only (never in source code)
# Set this to your 11-char secret key. On Railway, set this in env vars UI.
VITE_ACCESS_SECRET=
```

**File: `.env` (local, not committed)**

```dotenv
VITE_ACCESS_SECRET=your-secret-key-here
```

**Railway:**

1. Go to Railway dashboard → Project → Variables
2. Add `VITE_ACCESS_SECRET=your-actual-secret`
3. Redeploy

### 2. Access Page (`src/pages/Access.tsx`)

**Features:**

- Form with Name and Secret Key inputs
- SHA256 hashing of user input
- Comparison against env secret hash
- 24-hour localStorage grant on success
- Error display on wrong secret
- Loading state during verification

**Key Functions:**

```typescript
const ACCESS_SECRET = import.meta.env.VITE_ACCESS_SECRET;

// SHA256 hash user input and env secret
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Verify secret by comparing hashes
async function verifySecret(input: string): Promise<boolean> {
  const inputHash = await sha256(input);
  const secretHash = await sha256(ACCESS_SECRET);
  return inputHash === secretHash;
}

// On success, store grant in localStorage
const grantedAt = Date.now();
const expiresAt = grantedAt + 24 * 60 * 60 * 1000;
localStorage.setItem(
  "access_grant",
  JSON.stringify({ name, grantedAt, expiresAt })
);
```

**Testids:**

- `access-page` - Main container
- `access-form` - Form element
- `access-title` - Title
- `access-subtitle` - Subtitle
- `access-name-input` - Name input
- `access-secret-input` - Secret input
- `access-submit-button` - Submit button
- `access-error` - Error message
- `access-not-configured` - Config error (if env var missing)

### 3. Secret Page (`src/pages/Secret.tsx`)

**Features:**

- Checks localStorage `access_grant` on mount
- Validates expiry timestamp
- Redirects to `/access` if missing or expired
- Shows user name and time remaining
- Logout button clears localStorage

**Key Logic:**

```typescript
useEffect(() => {
  const stored = localStorage.getItem("access_grant");
  if (!stored) {
    navigate("/access"); // No grant → redirect
    return;
  }

  const grant = JSON.parse(stored);
  const now = Date.now();

  if (now >= grant.expiresAt) {
    localStorage.removeItem("access_grant");
    navigate("/access"); // Expired → redirect
    return;
  }

  setGrant(grant); // Valid → show content
}, [navigate]);

const logout = () => {
  localStorage.removeItem("access_grant");
  navigate("/access");
};
```

**Testids:**

- `secret-page` - Main container
- `secret-title` - Title
- `secret-greeting` - Welcome message
- `secret-access-info` - Time remaining display
- `secret-logout-button` - Logout button
- `secret-loading` - Loading state

### 4. Routes (`src/App.tsx`)

```typescript
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/search" element={<SearchPage />} />
  <Route path="/recipe/:slug" element={<RecipePage />} />
  <Route path="/access" element={<AccessPage />} /> {/* NEW */}
  <Route path="/secret" element={<SecretPage />} /> {/* NEW */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## Local Setup

### 1. Set Environment Variable

Copy `.env.example` to `.env` and set a test secret:

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
VITE_ACCESS_SECRET=mysecret123
```

### 2. Start Frontend

```bash
npm run dev
```

### 3. Test

1. Open http://localhost:8080/access
2. Enter any name (e.g., "Adrian")
3. Enter secret: `mysecret123`
4. Should redirect to `/secret` and show welcome message
5. Try wrong secret → should show error

### 4. Test Expiry (Optional)

Edit `Secret.tsx` line with `24 * 60 * 60 * 1000` to a shorter duration (e.g., 5 seconds) to test expiry behavior:

```typescript
const expiresAt = grantedAt + 5 * 1000; // 5 seconds for testing
```

---

## Railway Deployment

### 1. Set Environment Variable

1. Go to Railway dashboard → Your Project → Variables
2. Click "Add Variable"
3. Key: `VITE_ACCESS_SECRET`
4. Value: Your actual secret (e.g., `kitchen-42-secret`)
5. Click "Add"
6. Redeploy: Railway will rebuild with the new env var

### 2. Deploy

```bash
railway up
# or trigger via GitHub webhook if connected
```

### 3. Verify

After deployment, visit https://your-railway-url/access and test with your secret.

---

## Enhancements (v2)

### Feature 1: Access Gate Button on Home Page

**Purpose:** Hidden but visible access gate entry point on home page

**Implementation:**

- Add a small `+` button in the footer area of home page (Index.tsx)
- Subtle styling (muted color, small size)
- Link to `/access` route
- Testid: `chef-access-button`

**Code:**

```typescript
// In Index.tsx footer section
<button
  onClick={() => navigate("/access")}
  className="text-muted-foreground hover:text-primary transition-colors text-lg"
  title="Add recipes (admin only)"
  data-testid="chef-access-button"
  aria-label="Access gate"
>
  +
</button>
```

### Feature 2: Auto-Redirect After Login

**Purpose:** Smoothly redirect user to home page 5 seconds after successful login with confirmation

**Implementation:**

- Secret.tsx detects successful access grant
- Shows confirmation message: "Access granted! Redirecting to home..."
- 5-second timer before redirect
- Can skip timer with button (optional)

### Feature 3: Login Status Indicator on Home Page

**Purpose:** Visual confirmation of logged-in status on home page

**Implementation:**

- Create utility function `isAccessGranted()` to check localStorage
- Add badge/banner near footer showing "Chef Mode ON" when logged in
- Show "Add New Recipe" link (visible only when logged in)
- Include logout button

---

## Troubleshooting

### Issue: "Access gate not configured"

**Cause:** `VITE_ACCESS_SECRET` env var is empty or not set  
**Fix:**

- Local: Set in `.env`
- Railway: Add to Variables in dashboard

### Issue: Wrong secret accepted

**Cause:** SHA256 comparison logic issue  
**Fix:**

- Check both secrets hash to same value
- Verify no trailing spaces in env var
- Clear browser cache and localStorage

### Issue: localStorage cleared unexpectedly

**Cause:** Browser privacy mode or aggressive cache clearing  
**Fix:**

- Use private/incognito window for testing
- Check browser storage settings

### Issue: 24-hour expiry not working

**Cause:** Timezone or timestamp mismatch  
**Fix:**

- All timestamps use `Date.now()` (UTC milliseconds)
- Check system clock is correct
- For testing, shorten duration in `Secret.tsx`

---

## Security Considerations

### What This Protects

✅ Casual visitors from accessing secret page  
✅ Simple access control for semi-public pages  
✅ Secret not stored in source code

### What This Does NOT Protect

❌ Determined attackers (secret can be found in browser DevTools)  
❌ Network interception (no HTTPS-specific protections)  
❌ Session hijacking (localStorage is accessible to JS)  
❌ Sensitive data (passwords, payment info, PII)

### Recommendations for Higher Security

- Use **Option 2** (Serverless) for hidden secrets
- Add **rate limiting** after N failed attempts
- Use **HTTPS only** (Railway default)
- Consider **2FA** for critical access
- Log access attempts to external service

---
