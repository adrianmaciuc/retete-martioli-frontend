## 🔧 Troubleshooting Guide

### Common Issues

**Issue**: Strapi won't start

- Solution: Delete the `.tmp` folder and restart
- Check Node.js version (needs 18+)

**Issue**: Images not displaying / uploads missing in production

- Cause: In production the upload provider may be set to `local` (ephemeral filesystem) or Cloudinary environment variables may be missing or incorrect. If `UPLOAD_PROVIDER` is not set to `cloudinary`, or the `CLOUDINARY_*` creds are wrong, uploads can fail or not persist.
- Solution:

  - In your backend service (Railway → Service → Settings → Environment Variables), set:
    - `UPLOAD_PROVIDER=cloudinary`
    - `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`, and optionally `CLOUDINARY_FOLDER`.
  - Redeploy/restart the backend so Strapi picks up the new env vars.
  - Confirm `@strapi/provider-upload-cloudinary` is installed in `backend/package.json`.
  - Upload an image via Strapi Admin → Media Library and monitor backend logs for any upload errors.
  - You can also test an upload with curl (replace `<ADMIN_JWT>` and file path):

    ```bash
    curl -X POST "https://<your-backend>/api/upload" \
      -H "Authorization: Bearer <ADMIN_JWT>" \
      -F "files=@/path/to/image.jpg"
    ```

  - Or run a quick Node test to verify Cloudinary credentials (example):

    ```js
    // quick test.js
    import cloudinary from "cloudinary";
    cloudinary.v2.config({
      cloud_name: "cloudinary-name",
      api_key: "cloudinary-key",
      api_secret: "cloudinary-secret",
    });
    cloudinary.v2.uploader
      .upload(
        "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
      )
      .then((r) => console.log("OK", r))
      .catch((e) => console.error("ERR", e));
    ```

  - If you must use the `local` provider in production, be aware the filesystem is ephemeral on platforms like Railway — files may not persist across restarts; prefer Cloudinary for production.

- Tip: Check the Cloudinary dashboard for incoming uploads and verify the configured folder.

**Issue**: Search not working

- Solution: Check API permissions (find, findOne enabled)
- Verify Strapi is running

**Issue**: Cannot access API endpoints (403 Forbidden)

- Cause: The Public role may not have `find`/`findOne` permissions for relevant collection types (for example, `Category` or `Recipe`).
- Solution:

  - Open Strapi admin → **Settings** → **Users & Permissions plugin** → **Roles** → **Public**.
  - Enable **find** and **findOne** for `Category` and `Recipe`, then click **Save**.
  - Re-test the endpoint, for example:

    ```bash
    curl -i https://<your-backend>/api/categories
    ```

  - You should get HTTP 200 and JSON (not 403).

**Issue**: Build fails

- Solution: Delete `node_modules` and `dist` folders
- Run `npm install` again
- Check for TypeScript errors

**Issue**: Railway deployment fails

- Solution: Check environment variables
- Verify DATABASE_URL is correct
- Check build logs for specific errors

**Issue**: Frontend requests an incorrect backend URL (e.g. requests like `https://retete.martioli.com/retete-martioli-be.up.railway.app/api/categories`)

- Cause: The frontend reads `VITE_STRAPI_URL` at build time. If this environment variable is set incorrectly in your frontend service (missing protocol or containing multiple domains), Vite will embed the wrong URL into the built app.
- Solution:
  - Check the frontend service's environment variables (Railway → Service → Settings → Environment Variables) and ensure `VITE_STRAPI_URL` is a single absolute URL with protocol, for example:
    - `https://retete-martioli-be.up.railway.app`
    - or `https://api.retete.martioli.com` (if you use a custom domain)
  - Do not concatenate domains or omit `https://`.
  - After fixing the variable, rebuild/redeploy the frontend so Vite can inline the updated value.
- Tip: If `VITE_STRAPI_URL` is not set or the backend is unreachable, the frontend falls back to local sample data.
