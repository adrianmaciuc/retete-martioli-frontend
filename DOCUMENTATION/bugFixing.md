# Bug Fix Log

This document records quick fixes and how to troubleshoot them later.

---

## Gallery Images Not Showing in Recipe Page

- Date: 2025-12-22
- Symptom: Recipe page shows cover image, but gallery is empty. Debug showed `galleryImages count: 0` while images exist in Strapi (e.g., http://localhost:1337/uploads/pexels_monserratsoldu_600618_f054807ab7.jpg).
- Likely Cause:
  - Strapi v4/v5 returns relations/media in wrapped shapes (`field.data[].attributes`) and field names can vary (galleryImages, gallery, images, photos, etc.).
  - Frontend mapping only read a single key and did not normalize wrappers.

### Files Changed

- Mapping and API adjustments

  - [src/lib/strapi.ts](src/lib/strapi.ts)
    - Health check ping switched to root `/` to avoid 400s when content types are missing.
    - Recipe queries simplified to `?populate=*` to ensure all relations (media, categories) are included.
    - `mapStrapiToRecipe()` updated to robustly extract images and categories:
      - Supports Strapi wrappers: `data.attributes` and media `field.data[].attributes`.
      - Scans attributes for gallery-like keys: `galleryImages`, `gallery`, `images`, `photos`, `gallery_media`, `galleryPhotos`.
      - Normalizes single/multiple media and raw string URLs.
      - Deduplicates and excludes the `coverImage` from gallery.
    - `getCategories()` updated to read `c.attributes` for `name` and `slug`.

- UI debugging aid
  - [src/components/RecipeDetail.tsx](src/components/RecipeDetail.tsx)
    - Added a small toggle (“Show debug”) that displays:
      - `galleryImages` count
      - `coverImage` URL
      - First gallery URL
    - Helpful to confirm mapping without console noise.

### Verification Steps

1. Ensure Strapi public permissions allow reading your recipe content types.
2. Confirm the recipe has media in the gallery field (multiple media).
3. Run frontend build and preview:
   ```bash
   npm run build
   npm run preview
   ```
4. Open any recipe:

- Scroll to “Galerie” section; thumbnails should render.
- (Temporary) We used a debug panel to verify URLs during the fix.

5. If images still don’t show:
   - Open DevTools → Network → click the gallery URL → should return 200.
   - Verify `VITE_STRAPI_URL` matches your backend’s base URL/domain.
   - If gallery field uses a different name, add that key to the scanner list in `mapStrapiToRecipe()`.

### Quick Reference: What Fixed It

- Use `populate=*` on recipe endpoints.
- Normalize Strapi media shapes and scan multiple gallery-like keys.
- (Temporary) Added UI debug to verify incoming data; removed afterward.

### Cleanup

- Date: 2025-12-22
- Removed the temporary debug UI from [src/components/RecipeDetail.tsx](src/components/RecipeDetail.tsx) once gallery was confirmed working.

---

End of entry.
