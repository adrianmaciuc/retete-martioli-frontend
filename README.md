# Recipe App (Vite + React)

A lightweight recipe app

---

## 📦 Project layout

Key folders:

- `src/` — frontend source (Vite + React)
  - `src/lib/strapi.ts` — client helpers to talk to Strapi (uses `VITE_STRAPI_URL`)
  - `src/lib/sample-recipes.ts` — local fallback data
  - `src/components/` — UI components, recipe card, grid, detail
  - `src/pages/` — route pages (index, search, recipe)
- `development-plan.md` — implementation plan and recommended backend content types

> Note: This repo contains the frontend and instructions for a Strapi backend; a `backend/` folder is not committed by default. See the Backend setup section to create one locally.

---

## ⚙️ Prerequisites

- Node.js 18+ (LTS)
- npm or yarn
- Git
- (Optional) Railway CLI for deployment: `npm i -g @railway/cli`
- Cloudinary account (for production uploads)

---

## 🚀 Development (Local)

These steps will get a complete local dev environment running: frontend (this repo) + Strapi backend using SQLite.

### 1 Clone & install

```bash
git clone https://github.com/adrianmaciuc/my-creative-spark.git
cd my-creative-spark
npm install
```

### 2 Frontend (Vite) — local dev

Create a `.env` file in the project root (or use `.env.local`):

```env
# .env (Vite requires VITE_ prefix)
# add backend URL if running Strapi locally
VITE_STRAPI_URL=http://localhost:1337
```

Run the frontend dev server:

```bash
npm run dev
# Open http://localhost:5173 (Vite will show the exact port)
```

Behavior notes:

- If `VITE_STRAPI_URL` is not set or Strapi is unreachable, the app falls back to `src/lib/sample-recipes.ts` so you can work on UI without a backend.

### 3 Backend (Strapi) — SQLite (local)

1. Create a new Strapi app inside `backend/`:

```bash
# from project root
npx create-strapi@latest backend
# skip login prompt if asked
# or, to avoid the default quickstart DB and to have more control:
# npx create-strapi@latest backend
# cd backend && npm run develop
```

2. Start Strapi:

```bash
cd backend
npm run develop
# Strapi dev runs at http://localhost:1337 by default
```

3. Create an admin user at `http://localhost:1337/admin`.

4. Configure content types (follow `development-plan.md`) — minimal required:

- Category (fields: name, slug)
- Ingredient component (item, quantity, unit, notes)
- Instruction component (stepNumber, description, image, tips)
- Recipe collection type with fields: title, slug (UID), description, coverImage (media), galleryImages, ingredients (component repeatable), instructions (component repeatable), prepTime, cookTime, servings, difficulty (enum), categories (relation to Category), tags (JSON)

5. Permissions: In Strapi admin → Settings → Roles & Permissions → Public, grant `find` and `findOne` for `recipe` and `category` so the frontend can read data without auth.

6. Add sample data via Content Manager (recommended) or import using the Data Transfer tools (see Export / Import below).

### 4 Verify frontend + backend

- Open `http://localhost:5173` (frontend). If `VITE_STRAPI_URL` points to the running Strapi instance, the app will fetch live recipes; otherwise it will use sample data.

---

## ☁️ Production: Railway + PostgreSQL + Cloudinary

Below are the recommended steps for migrating to a cloud setup using Railway for hosting and PostgreSQL for production DB, plus Cloudinary for image hosting.

> Summary: deploy the Strapi backend to Railway (configure PostgreSQL), enable Cloudinary as the upload provider, and deploy the frontend to Railway (or Vercel/Netlify) with `VITE_STRAPI_URL` set to your backend URL.

### 1 Prepare Strapi for production

- In the Strapi `backend` project, ensure `package.json` contains:

```json
{
  "scripts": {
    "develop": "strapi develop",
    "build": "strapi build",
    "start": "strapi start"
  }
}
```

- Install Cloudinary upload provider (for production uploads):

```bash
cd backend
npm install @strapi/provider-upload-cloudinary
```

- Add storage config using env vars (we'll set these on Railway): `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`, `CLOUDINARY_FOLDER`.

- Generate production secrets (run locally and copy results):

```bash
# Run this in your terminal 4-5 times to generate values for APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET, JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2 Create Railway project & add PostgreSQL

1. Login & create a new Railway project.
2. Click "New" → "Database" → choose PostgreSQL (Railway will provision one and create a `DATABASE_URL`).
3. In your Railway project's variables for the Strapi service, add:

```
NODE_ENV=production
DATABASE_CLIENT=postgres
DATABASE_URL=<Railway_Postgres_CONNECTION_STRING>
DATABASE_SSL=true
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_NAME=<cloudinary-name>
CLOUDINARY_KEY=<cloudinary-key>
CLOUDINARY_SECRET=<cloudinary-secret>
CLOUDINARY_FOLDER=recipes
APP_KEYS=<generated-app-keys> # comma-separated if multiple
API_TOKEN_SALT=<generated-salt>
ADMIN_JWT_SECRET=<generated-admin-jwt>
JWT_SECRET=<generated-jwt>
HOST=0.0.0.0
PORT=1337
```

> Tip: For `APP_KEYS` you can include a single generated value or several comma-separated values.

### 3 Deploy Strapi to Railway

- Connect your GitHub repo in Railway and point the service to the `backend/` folder (or deploy using `railway up` from the `backend` folder).
- Railway will run `npm install` and `npm run build` depending on its defaults. Ensure your build and start scripts are set.
- After deployment, open `https://<your-backend>.railway.app/admin` and create an admin user.

### 4 Import data & media

- Use Strapi Admin → Settings → Data Transfer (Export) to export your local content and import it on production.
- Alternatively, re-create a few sample recipes manually from the Admin panel to confirm Cloudinary uploads are working.

### 5 Deploy frontend

- In Railway, create a new service for the frontend.
- Set the following environment variable for the frontend service:

```
VITE_STRAPI_URL=https://<your-backend>.railway.app
```

- Build command: `npm run build`
- Start command: `npm run preview` or configure it to serve `dist/` via a static server.
- After deployment, visit the frontend URL to confirm the app connects to your production Strapi backend.

> Note: Vite environment variables are embedded at build-time, so make sure `VITE_STRAPI_URL` is set in Railway before building the frontend.

---

## 🔐 Environment variables (summary)

Frontend (Vite):

- VITE_STRAPI_URL — URL of the Strapi API (e.g. `https://your-backend.railway.app` or `http://localhost:1337`)

Strapi (backend):

- DATABASE_CLIENT — `sqlite` (local) or `postgres` (production)
- DATABASE_URL — connection string for PostgreSQL
- UPLOAD_PROVIDER — `cloudinary` (optional)
- CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET, CLOUDINARY_FOLDER
- APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET, JWT_SECRET (generate securely)
- HOST, PORT (defaults to 0.0.0.0 and 1337)

Security: never commit `.env` files with secrets to Git. Add `.env` to `.gitignore`.

---

## 🛠️ Export, Import & Backups

- Use Strapi Admin → Settings → Data Transfer (Export) for a full content export (includes entries and media references). Download the export and store it in a safe place.
- To import: use Strapi Admin → Settings → Data Transfer → Import and upload the archive.
- For media migration: ensure Cloudinary is configured in production so files uploaded in the import are re-hosted (or reference the original URLs).

Automating backups: set a cron job or CI task to export every night and store artifacts in cloud storage (S3, GitHub Releases, etc.).

---

## 🧰 Troubleshooting & tips

- CORS errors: In Strapi admin → Settings → Webhooks/CORS ensure the frontend origin is allowed or use `strapi.config.middleware.settings.security` to configure `cors`.
- Assets not loading in production: verify Cloudinary env vars and that the upload provider package is installed.
- Database migrations: when switching from SQLite to Postgres, export data from local Strapi and import into production Strapi (use Data Transfer). Verify content-type compatibility.
- Build-time env vars: Vite inlines `VITE_` env vars at build time — if you change `VITE_STRAPI_URL`, you must re-deploy the frontend.

---

## ✅ Quick checklist

Local development:

- [ ] `npm install`
- [ ] Create `.env` with `VITE_STRAPI_URL` (optional)
- [ ] Start Strapi locally (`backend/`)
- [ ] Start frontend `npm run dev`

Production:

- [ ] Provision PostgreSQL (Railway)
- [ ] Add Strapi env vars (DB, Cloudinary, secrets)
- [ ] Deploy Strapi to Railway
- [ ] Deploy frontend with `VITE_STRAPI_URL` pointing to production Strapi
- [ ] Import data & test

---
