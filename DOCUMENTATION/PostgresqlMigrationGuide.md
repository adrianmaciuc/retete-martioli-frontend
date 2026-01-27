# PostgreSQL Migration Guide - SQLite to Railway

Complete guide for migrating your Strapi backend from SQLite (local) to PostgreSQL (Railway production)

---

## 📋 Overview

This guide covers:

- Understanding the migration process
- Exporting data from SQLite
- Setting up PostgreSQL on Railway
- Configuring Strapi for PostgreSQL
- Importing data to production
- Verification and troubleshooting

**Timeline**: 1-2 hours

---

## 🎯 What Happens During Migration

### Before Migration (Development)

```
Local Machine
├── Frontend (Vite) → localhost:5173
├── Backend (Strapi) → localhost:1337
└── Database (SQLite) → backend/.tmp/data.db
    └── Recipes, Categories, Images (all local)
```

### After Migration (Production)

```
Railway Cloud
├── Frontend (Deployed) → your-app.railway.app
├── Backend (Deployed) → your-backend.railway.app
└── Database (PostgreSQL) → Railway managed PostgreSQL
    └── Recipes, Categories, Images (cloud storage via Cloudinary)
```

### Key Changes

| Aspect   | Before                        | After                              |
| -------- | ----------------------------- | ---------------------------------- |
| Database | SQLite (file: `.tmp/data.db`) | PostgreSQL (cloud)                 |
| Storage  | Local file uploads            | Cloudinary CDN                     |
| Backend  | Runs locally                  | Runs on Railway                    |
| Frontend | Runs locally                  | Runs on Railway                    |
| Access   | `http://localhost:1337`       | `https://your-backend.railway.app` |

---

## ✅ Prerequisites

Before starting, ensure:

- [ ] Strapi is running locally with recipes
- [ ] All recipes are **published** (not just drafted)
- [ ] Images are uploaded to recipes
- [ ] Railway account created (https://railway.app)
- [ ] GitHub account (for deploying repos)
- [ ] Cloudinary account (for image storage)
- [ ] Git initialized in your project

---

## Part 1: Export Data from SQLite

### Step 1.1: Backup Your Local Database

**This is important!** Always backup before migration.

```bash
cd backend
cp .tmp/data.db ../backup-sqlite-$(date +%Y%m%d-%H%M%S).db
```

This creates a backup file like: `backup-sqlite-20251218-143022.db`

**Verify backup exists**:

```bash
ls -lh ../backup-sqlite-*
```

**Expected output**:

```
-rw-r--r--  12345  backup-sqlite-20251218-143022.db
```

---

### Step 1.2: Export Strapi Data

While Strapi is running (or stopped), export all data:

```bash
cd backend
npm run strapi export -- --no-encrypt --file ../strapi-data-export.tar.gz
```

**What this does**:

- Exports all recipes, categories, images, users
- Creates compressed archive: `strapi-data-export.tar.gz`
- No encryption (easier to inspect/restore)

**Verify export**:

```bash
ls -lh ../strapi-data-export.tar.gz
```

**Expected output** (file size varies):

```
-rw-r--r--  5432100  strapi-data-export.tar.gz
```

---

### Step 1.3: Store Backup Safely

Store backups in version control (but not in git):

```bash
# Create backups folder (add to .gitignore)
mkdir -p backups
mv backup-sqlite-*.db backups/
mv strapi-data-export.tar.gz backups/
```

**Update .gitignore**:

```
# Database backups
backups/
*.db
*.db-shm
*.db-wal
```

---

## Part 2: Setup PostgreSQL on Railway

### Step 2.1: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Provision PostgreSQL"**
4. Wait for provisioning (2-3 minutes)

**You should see**:

```
Database: postgresql
Status: ✓ Running
```

---

### Step 2.2: Get Database Credentials

Once PostgreSQL is ready:

1. Click on the PostgreSQL service
2. Go to **"Connect"** tab
3. Copy the connection string

**Example connection string**:

```
postgresql://postgres:password123@containers-us-west-123.railway.app:5432/railway
```

**Break it down**:

```
postgresql://[username]:[password]@[host]:[port]/[database]
      postgres   password123     containers-...    5432    railway
```

**Save this URL** - you'll need it soon.

---

### Step 2.3: Note Database Details

Extract and save these values:

- **Host**: `containers-us-west-123.railway.app`
- **Port**: `5432`
- **Database**: `railway`
- **Username**: `postgres`
- **Password**: `password123`

You'll use these for environment variables.

---

## Part 3: Configure Strapi for PostgreSQL

### Step 3.1: Update Backend Database Config

Edit `backend/config/database.ts`:

```typescript
import path from "path";

const { env } = process;

const client = env.DATABASE_CLIENT || "sqlite";

const connections = {
  sqlite: {
    connection: {
      filename: path.join(
        __dirname,
        "..",
        env.DATABASE_FILENAME || ".tmp/data.db"
      ),
    },
    useNullAsDefault: true,
  },
  postgres: {
    connection: {
      host: env.DATABASE_HOST || "localhost",
      port: env.DATABASE_PORT || 5432,
      database: env.DATABASE_NAME || "strapi",
      user: env.DATABASE_USERNAME || "strapi",
      password: env.DATABASE_PASSWORD || "strapi",
      ssl: env.DATABASE_SSL === "true" || env.DATABASE_SSL === true,
      schema: env.DATABASE_SCHEMA || "public",
    },
  },
};

export default ({ env }: { env: any }) => ({
  connection: {
    client: env("DATABASE_CLIENT", "sqlite"),
    ...connections[client],
    acquireConnectionTimeout: 60000,
  },
});
```

---

### Step 3.2: Install PostgreSQL Driver

```bash
cd backend
npm install pg
```

This installs the PostgreSQL driver for Node.js.

---

### Step 3.3: Test Postgres Connection Locally (Optional)

To test locally with PostgreSQL before deploying:

**Create `.env.local` in backend folder**:

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=your-host.railway.app
DATABASE_PORT=5432
DATABASE_NAME=railway
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-password-here
DATABASE_SSL=true
```

Then restart Strapi:

```bash
npm run develop
```

If it connects successfully, you'll see:

```
✓ Server started at http://localhost:1337
```

**But we won't leave it running** - we'll deploy instead.

---

## Part 4: Deploy Strapi Backend to Railway

### Step 4.1: Connect Repository to Railway

1. Go to your Railway project
2. Click **"New Service"** → **"GitHub Repo"**
3. Authorize GitHub
4. Select your repository
5. Select **"backend"** as the root directory

---

### Step 4.2: Set Environment Variables in Railway

1. Go to the **Backend service** in Railway
2. Click **"Variables"** tab
3. Add these environment variables:

```env
NODE_ENV=production
PORT=1337

# Database Configuration
DATABASE_CLIENT=postgres
DATABASE_HOST=${{Postgres.PGHOST}}
DATABASE_PORT=${{Postgres.PGPORT}}
DATABASE_NAME=${{Postgres.PGDATABASE}}
DATABASE_USERNAME=${{Postgres.PGUSER}}
DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}
DATABASE_SSL=true

# Cloudinary Configuration (for image uploads)
UPLOAD_PROVIDER=cloudinary
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_KEY=your-cloudinary-key
CLOUDINARY_SECRET=your-cloudinary-secret
CLOUDINARY_FOLDER=recipes

# Security Keys (generate these!)
APP_KEYS=generate-random-key-here
API_TOKEN_SALT=generate-random-salt-here
ADMIN_JWT_SECRET=generate-random-secret-here
TRANSFER_TOKEN_SALT=generate-random-salt-here
JWT_SECRET=generate-random-secret-here
```

**For Cloudinary values**, get them from:

1. Go to https://cloudinary.com/console
2. Dashboard → API Environment variable
3. Copy: Cloud Name, API Key, API Secret

**For security keys, generate random values**:

```bash
# Run this command 5 times to generate 5 different random keys
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy output to:

- `APP_KEYS=` (output 1)
- `API_TOKEN_SALT=` (output 2)
- `ADMIN_JWT_SECRET=` (output 3)
- `TRANSFER_TOKEN_SALT=` (output 4)
- `JWT_SECRET=` (output 5)

---

### Step 4.3: Deploy Backend

1. Railway automatically detects the push
2. Backend service will build and deploy
3. Wait for status to show **"✓ Running"**

**Monitor the logs**:

1. Click on Backend service
2. Go to **"Logs"** tab
3. Watch for deployment messages

**Expected logs**:

```
Building...
npm install
npm run build
Starting server...
✓ Strapi server running on 0.0.0.0:1337
```

**Get the backend URL**:

1. Click Backend service
2. Click **"Domains"** tab
3. Copy the generated URL (e.g., `your-backend-xxx.railway.app`)

---

## Part 5: Import Data to PostgreSQL

### Step 5.1: Create Initial Admin User

Since the database is new and empty:

1. Visit your backend URL: `https://your-backend-xxx.railway.app/admin`
2. Create a new admin user:
   - Email: `your-email@example.com`
   - Password: `strong-password` (save this!)
3. Log in to admin panel

---

### Step 5.2: Import Strapi Backup

Option A: **Import via CLI** (Recommended)

```bash
cd backend

# Set the backend URL temporarily
export STRAPI_ADMIN_URL=https://your-backend-xxx.railway.app

# Import the backup
npm run strapi import -- --file ../backups/strapi-data-export.tar.gz
```

**Expected output**:

```
✓ Importing data...
✓ Import complete
✓ 12 recipes imported
✓ 5 categories imported
✓ 234 images imported
```

**This imports**:

- All recipes and their data
- All categories
- All images (uploaded to Cloudinary)
- User permissions

---

Option B: **Manual Import via Admin Panel**

If CLI import fails:

1. Go to `https://your-backend-xxx.railway.app/admin`
2. Click **"Plugins"** → **"Import/Export"** (if available)
3. Upload `strapi-data-export.tar.gz`
4. Wait for import to complete

---

### Step 5.3: Verify Data Import

Check that data was imported:

1. Go to `https://your-backend-xxx.railway.app/admin`
2. Click **"Content Manager"**
3. Click **"Recipe"**
4. Verify recipes appear with data

**Check specific recipe**:

1. Click on a recipe
2. Verify:
   - ✅ Title, description populated
   - ✅ Images display (from Cloudinary)
   - ✅ Ingredients listed
   - ✅ Instructions listed
   - ✅ Published status

---

### Step 5.4: Test API Endpoints

Test that API works:

```bash
# Test in browser or with curl
curl "https://your-backend-xxx.railway.app/api/recipes?populate[0]=coverImage&populate[1]=categories"
```

**Expected response**:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Clatite cu banane",
      "slug": "clatite-cu-banane",
      "coverImage": {
        "url": "https://res.cloudinary.com/..."
      },
      ...
    }
  ]
}
```

---

## Part 6: Deploy Frontend to Railway

### Step 6.1: Create Frontend Service

1. In Railway project, click **"New Service"** → **"GitHub Repo"**
2. Select your repository
3. **Do NOT select a root directory** (use project root)

---

### Step 6.2: Set Frontend Environment Variables

1. Click on Frontend service
2. Click **"Variables"** tab
3. Add:

```env
VITE_STRAPI_URL=https://your-backend-xxx.railway.app
NODE_ENV=production
```

Replace `your-backend-xxx.railway.app` with your actual backend URL.

---

### Step 6.3: Deploy Frontend

1. Railway auto-deploys when you push code
2. Wait for status **"✓ Running"**
3. Get frontend URL from **"Domains"** tab

---

## Part 7: Connect Frontend to Backend

### Step 7.1: Update Frontend Environment

Update `.env` file in project root:

```env
VITE_STRAPI_URL=https://your-backend-xxx.railway.app
```

Push to git:

```bash
git add .env
git commit -m "Update Strapi URL to production backend"
git push
```

Railway will auto-deploy with new environment variable.

---

### Step 7.2: Verify Frontend Connection

Visit your frontend URL and check:

1. ✅ Homepage loads
2. ✅ Recipes display (from PostgreSQL)
3. ✅ Images load (from Cloudinary)
4. ✅ Search works
5. ✅ No console errors

**Check browser console** (F12):

Should see no errors about connecting to Strapi.

---

## Part 8: Verification Checklist

### Frontend Tests

- [ ] Homepage loads quickly
- [ ] All recipes display from Strapi API
- [ ] Images display (Cloudinary CDN)
- [ ] Search functionality works
- [ ] Recipe detail pages load
- [ ] Navigation works
- [ ] Mobile responsive
- [ ] No 404 errors

### Backend Tests

```bash
# Test recipes endpoint
curl "https://your-backend-xxx.railway.app/api/recipes?populate=*" | head -20

# Test categories endpoint
curl "https://your-backend-xxx.railway.app/api/categories"

# Test specific recipe
curl "https://your-backend-xxx.railway.app/api/recipes?filters[slug][$eq]=clatite-cu-banane"
```

All should return valid JSON with data.

### Admin Panel

- [ ] Can access admin panel
- [ ] All recipes visible
- [ ] Can create new recipes
- [ ] Images upload to Cloudinary
- [ ] Content publishes successfully

---

## Part 9: Rollback Plan (If Something Goes Wrong)

### Rollback Steps

If something fails:

1. **Keep SQLite database** (backup from Step 1.1)
2. **Revert Strapi config** changes
3. **Stop using Railway PostgreSQL**
4. **Keep running locally** until you fix issues

### How to Rollback

```bash
# Switch back to SQLite
cd backend
rm -rf .tmp/data.db
cp ../backup-sqlite-*.db .tmp/data.db

# Revert database config
git checkout config/database.ts

# Restart locally
npm run develop
```

Now you're back to local SQLite development.

---

## Part 10: Common Issues & Solutions

### Issue: "Connection refused" when importing

**Cause**: Backend might not be fully deployed

**Solution**:

1. Wait 5 more minutes
2. Check Backend service logs
3. Verify DATABASE_URL env var is set correctly
4. Check network connectivity to database

---

### Issue: Images not showing after import

**Cause**: Images might still be local, need Cloudinary

**Solution**:

1. Check Cloudinary credentials in env vars
2. Delete and re-upload one image in Strapi admin
3. Verify it uploads to Cloudinary
4. Manually re-upload images if needed

---

### Issue: "Password authentication failed"

**Cause**: Wrong database password in env vars

**Solution**:

1. Go to Railway PostgreSQL service
2. Click "Connect"
3. Copy fresh DATABASE_URL or individual credentials
4. Update Backend env variables
5. Redeploy

---

### Issue: Import command hangs or times out

**Cause**: Large database or network issues

**Solution**:

1. Try again with patience (first import can take 5+ minutes)
2. Check Railway logs for errors
3. Try manual import via admin panel
4. Contact Railway support if persistent

---

### Issue: Admin panel won't load

**Cause**: Backend not fully deployed

**Solution**:

1. Check Backend logs in Railway
2. Verify all env variables are set
3. Wait for full deployment completion
4. Try again in 2 minutes

---

## Part 11: After Migration

### Update Your Workflow

**For local development**:

1. Keep using SQLite locally
2. Run `npm run dev` to start Vite + Strapi
3. Test with fallback sample data
4. Test Playwright tests (they use fallback data)

**For adding new recipes**:

1. Add via local Strapi admin
2. Export data with `npm run strapi export`
3. Either:
   - Manually add to production via admin panel
   - Or re-import full backup

**For production updates**:

- Add recipes directly in Railway Strapi admin
- They're stored in PostgreSQL
- Frontend automatically fetches updates

---

### Database Backup Strategy

Regular backups are important:

```bash
# Create weekly backup command
cd backend

# Export from production (if possible)
npm run strapi export -- --no-encrypt --file ../backups/strapi-backup-$(date +%Y%m%d).tar.gz

# Or via Railway CLI
railway run "npm run strapi export -- --no-encrypt"
```

---

## Part 12: Performance Considerations

### PostgreSQL vs SQLite

**PostgreSQL Advantages**:

- ✅ Better for concurrent users
- ✅ More reliable for production
- ✅ Better query optimization
- ✅ Built-in backups on Railway

**SQLite Advantages**:

- ✅ Simpler for development
- ✅ No network latency
- ✅ Single file easier to manage

### Optimization Tips

1. **Indexes**: PostgreSQL automatically indexes common fields
2. **Lazy loading**: Images load from Cloudinary CDN (fast)
3. **Query optimization**: Strapi handles this automatically
4. **Monitoring**: Check Railway logs for slow queries

---

## 📚 Resources

- [Railway PostgreSQL Docs](https://docs.railway.app/databases/postgresql)
- [Strapi Database Configuration](https://docs.strapi.io/dev-docs/configurations/database)
- [Strapi Import/Export](https://docs.strapi.io/user-docs/settings/managing-global-settings#importing-and-exporting-content)
- [Cloudinary Docs](https://cloudinary.com/documentation)

---

## ✅ Success Checklist

Your migration is complete when:

- ✅ PostgreSQL running on Railway
- ✅ Strapi backend deployed on Railway
- ✅ All recipes imported to PostgreSQL
- ✅ Images stored on Cloudinary
- ✅ Frontend deployed on Railway
- ✅ Frontend → Backend API connection working
- ✅ All features tested and working
- ✅ Admin panel accessible at production URL
- ✅ Data backed up safely
- ✅ Fallback rollback plan documented

---

**Congratulations! Your app is now in production! 🚀**
