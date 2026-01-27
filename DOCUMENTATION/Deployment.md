# Deployment Guide — Railway + PostgreSQL + Cloudinary (Detailed)

This document describes how to deploy the Strapi backend and the Vite frontend to Railway and configure PostgreSQL and Cloudinary for production. It is intended as a companion to `README.md` with more step-by-step UI instructions and deployment hints.

---

## Overview

- Backend: Strapi (Node.js) — connects to PostgreSQL in production
- Media: Cloudinary upload provider
- Hosting: Railway for both backend and frontend (or any provider that runs Node/static sites)

Prerequisites:

- Railway account and access to a project
- GitHub repository with your code
- Cloudinary account (cloud name, key, secret)

---

## Step 1 — Prepare Strapi for production

1. Ensure Strapi `backend` folder is configured with proper scripts in `package.json`:

```json
{
  "scripts": {
    "develop": "strapi develop",
    "build": "strapi build",
    "start": "strapi start"
  }
}
```

2. Install the Cloudinary provider for Strapi uploads (run in `backend/`):

```bash
cd backend
npm install @strapi/provider-upload-cloudinary
```

3. Configure Cloudinary provider in `config/plugins.js` (or using runtime configuration). Example (config/plugins.js):

```js
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "cloudinary",
      providerOptions: {
        cloud_name: env("CLOUDINARY_NAME"),
        api_key: env("CLOUDINARY_KEY"),
        api_secret: env("CLOUDINARY_SECRET"),
      },
      actionOptions: {
        upload: {},
        delete: {},
      },
    },
  },
});
```

4. Generate secure secrets for production (APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET, JWT_SECRET). Example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Save these values securely — they'll be added as Railway environment variables.

---

## Step 2 — Create a Railway project & add PostgreSQL

1. Sign in to Railway (https://railway.app) and create a new Project.
2. Click **New** → **Database** → **Postgres** (Railway provisions it automatically).
3. Wait until the database is ready and copy the `DATABASE_URL` (connection string).

### Alternative: use Supabase (external Postgres)

If you prefer to host Postgres on Supabase (free or paid tier) and deploy Strapi on Railway, follow these quick steps and caveats:

- Create a Supabase project and copy the **Connection string** (Settings → Database → Connection string). Use the full `postgres://...` URL provided by Supabase.
- On your Railway Strapi service, set the DB env vars to point to Supabase (example):

```
# Database (Supabase Postgres)
DATABASE_CLIENT=postgres
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<db>?sslmode=require
DATABASE_SSL=true
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=5  # lower pool to avoid hitting free-tier connection limits
```

- Important notes and caveats:

  - Supabase free tier has limited concurrent connections — keep `DATABASE_POOL_MAX` low (2–5) and monitor for "too many clients" or connection errors.
  - Ensure the connection string is URL-encoded if your password contains special characters.
  - Enable SSL (add `?sslmode=require` to the `DATABASE_URL` or set `DATABASE_SSL=true`) — Supabase requires TLS for remote connections.
  - If you have network restrictions enabled on Supabase, allow Railway outgoing connections or use Supabase connection pooling/pgbouncer when available.
  - Set `DATABASE_SCHEMA` if you use a non-default schema (default: `public`).

- Verification & troubleshooting:
  - After redeploy, check Railway logs for a successful DB connection and that Strapi started without DB errors.
  - Test the API: `curl -i https://<your-backend>.railway.app/api/recipes` (or open `/admin`) to validate the service.
  - If connections fail, verify `DATABASE_URL`, SSL options, and pool sizes; consider adding a connection pooler if you need more concurrent connections.

---

## Step 3 — Add Strapi service and env vars

1. In the Railway project, click **New** → **Deploy from GitHub**.
2. Select your repository and the `backend/` folder (if it's not in a subfolder, select the repo root and set the appropriate build path).
3. Add the following environment variables to the Strapi service (Service Settings → Variables):

```
NODE_ENV=production
URL=https://<your-backend>.railway.app
HOST=0.0.0.0
PORT=1337

# Database (Railway Postgres)
DATABASE_CLIENT=postgres
DATABASE_URL=<Railway Postgres connection string>
DATABASE_SSL=true

# Uploads (Cloudinary)
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_NAME=<cloudinary name>
CLOUDINARY_KEY=<cloudinary key>
CLOUDINARY_SECRET=<cloudinary secret>
CLOUDINARY_FOLDER=recipes

# Secrets
APP_KEYS=<generated app key(s)>
API_TOKEN_SALT=<generated salt>
ADMIN_JWT_SECRET=<generated admin jwt secret>
JWT_SECRET=<generated jwt secret>
```

Notes:

- `APP_KEYS` may be a comma-separated list of keys. Generate using `crypto.randomBytes` as shown above.
- If your Postgres instance requires SSL and Railway provides a `PGSSLMODE`/`PGSSL` config, configure Strapi `database.js` accordingly.

---

## Step 4 — Deploy Strapi

1. Trigger a deploy in Railway (via GitHub push or from the UI).
2. Railway will run `npm install` and `npm run build` based on the repo. Confirm the build logs show `strapi build` succeeded.
3. After the service is live, visit `https://<your-service>.railway.app/admin` and create an admin user.

---

## Step 5 — Import or create content

- Use **Settings → Data Transfer** in the Strapi admin to import a `.tar.gz` export if you have local data.
- Alternatively, create content using the Content Manager UI and upload images — verify they are stored in Cloudinary.

---

## Step 6 — Deploy the frontend

1. In Railway, click **New** → **Deploy from GitHub** and select your frontend (this repo root if it contains the frontend).
2. Set service variables for the frontend:

```
VITE_STRAPI_URL=https://<your-backend>.railway.app
```

3. Build command: `npm run build`
4. Start command: `npm run start` or `npm run preview` (Railway may detect static site and serve automatically).

Important: Vite embeds `VITE_` env vars at build time — ensure `VITE_STRAPI_URL` is set before the build step runs.

---

## Step 7 — (Optional) CLI Deploy & Rollback

You can also use the Railway CLI to deploy from your local machine.

```bash
npm i -g @railway/cli
railway login
cd backend
railway up
```

To rollback, use the Railway UI to revert to a previous deployment or re-deploy an older commit.

---

## Troubleshooting

- _CORS errors_: In Strapi, ensure allowed origins include your frontend domain.
- _Images not uploaded to Cloudinary_: Confirm `CLOUDINARY_*` env vars in Railway and that `@strapi/provider-upload-cloudinary` is installed.
- _Unknown dialect `postgresql` or missing Postgres driver_: If Strapi logs `Unknown dialect postgresql`, or you see an error about a missing `pg` module, fix by:
  - Setting `DATABASE_CLIENT=postgres` (some platforms use `postgresql` by default) and redeploying, and/or
  - Installing the Postgres driver in the backend: `cd backend && npm install pg` (ensure `pg` is listed in `backend/package.json`).
- _Self-signed certificate in certificate chain / TLS errors_: If you see `self-signed certificate in certificate chain` or similar TLS errors when connecting to Postgres, try one of the following:

  - Preferred: supply the CA used by your DB host as an env var. You can provide it base64-encoded to avoid newline issues:

    ```bash
    # On your machine (encode the CA file):
    cat path/to/ca.crt | base64 | tr -d '\n'

    # Set on Railway (Service → Variables):
    DATABASE_SSL=true
    DATABASE_SSL_CA_B64=<base64-output>
    DATABASE_SSL_REJECT_UNAUTHORIZED=true
    ```

    Strapi will decode `DATABASE_SSL_CA_B64` and include it as the `ca` in the Postgres SSL config.

  - Short-term workaround (less secure): set `DATABASE_SSL=true` and `DATABASE_SSL_REJECT_UNAUTHORIZED=false` to disable verification. **This is insecure** and should only be used for testing.
  - If you control the DB host, install a certificate signed by a trusted CA or add the CA into your platform's trusted store.

- _Database connection issues_: Confirm `DATABASE_URL` is correct and that SSL settings are consistent with Strapi DB config.
- _Missing recipes on frontend_: Confirm `VITE_STRAPI_URL` is set correctly on the frontend service and that Strapi `find`/`findOne` permissions are enabled for the `public` role.
- _Health endpoint_: A tiny health endpoint is available at `/api/health` (GET) that returns a minimal JSON `{ ok: true, db: boolean, ts: string }`. Use this endpoint for lightweight uptime checks or monitoring (it verifies both API reachability and a quick DB check). Example:

```bash
curl -s -f https://<your-backend>.railway.app/api/health | jq .
```

If the DB is unavailable the endpoint returns HTTP 503 and `{ ok: false, db: false }` which is useful for alerts and graceful frontend fallbacks.

---

## Security notes

- Never commit secrets to Git.
- Store Railway/Cloudinary secrets in Railway service variables or your chosen secret manager.

---

This document is reference-friendly and contains the common Railway UI steps needed to deploy the application. If you'd like, I can add screenshots or a short script that seeds Strapi with demo content to speed up verification after deploy.

### Example `.env` values (development vs production)

See [backend/.env.example](backend/.env.example) for copy-paste blocks. Use the dev (SQLite + local uploads) locally, and set the Railway + Cloudinary block as service variables in production.

---

## Backend Environment & Gitignore

To ensure local changes never affect production, keep environment-driven configuration and local data out of Git. See [backend/.gitignore](backend/.gitignore) and [backend/.env.example](backend/.env.example).

**Ignore (local-only) files/folders**

- Env files: `.env*` while keeping `!.env.example` committed
- Temp/cache/build: `.tmp/`, `.cache/`, `build/`
- Local DB files: `*.db`, `*.sqlite`, `database/*.db`
- Local uploads: `public/uploads/`, `uploads/`
- Logs/editor: logs, `.vscode`, `.DS_Store` (already present)

Example additions for `.gitignore`:

```gitignore
.env*
!.env.example
.tmp/
.cache/
build/
*.db
*.sqlite
database/*.db
public/uploads/
uploads/
coverage/
reports/
```

**Environment template (`.env.example`)**

- Server: `HOST`, `PORT`, `URL`, `NODE_ENV`
- Secrets: `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`
- DB (choose one):
  - Dev: `DATABASE_CLIENT=sqlite`, `DATABASE_FILENAME=.tmp/data.db`
  - Prod (example): `DATABASE_CLIENT=postgres` and standard Postgres vars
- Upload provider:
  - Default local: `UPLOAD_PROVIDER=local`
  - Cloudinary/S3: uncomment provider block and set keys via env in production

Generate strong secrets:

```bash
openssl rand -hex 32
```

Local setup:

```bash
cp backend/.env.example backend/.env
# edit backend/.env for local sqlite + local uploads
```

Production setup:

- Do not commit `.env`
- Set vars in your platform (Railway Service → Variables)
- Use Postgres and cloud upload provider (e.g., Cloudinary) as documented above
