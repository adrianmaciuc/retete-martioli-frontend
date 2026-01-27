import { Recipe } from "./types";
import { sampleRecipes } from "./sample-recipes";

const STRAPI_URL = normalizeUrl(
  import.meta.env.VITE_STRAPI_URL as string | undefined
);

let backendHealthy = true;
let healthCheckCompleted = false;

function normalizeUrl(u?: string) {
  if (!u) return undefined;
  if (/^https?:\/\//.test(u)) return u.replace(/\/$/, "");
  return `https://${u.replace(/^\/+/, "")}`;
}

export async function checkBackendHealth(): Promise<{
  isHealthy: boolean;
  message: string;
}> {
  if (!STRAPI_URL) {
    return {
      isHealthy: false,
      message: "Backend URL not configured. Loaded sample data.",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Ping a lightweight health endpoint to check API + DB availability
    const healthUrl = `${STRAPI_URL.replace(/\/$/, "")}/api/health`;
    const res = await fetch(healthUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Consider a successful API response (2xx) with JSON as healthy
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      backendHealthy = true;
      healthCheckCompleted = true;
      return {
        isHealthy: true,
        message: "Backend API connected successfully.",
      };
    } else if (res.ok) {
      // 2xx response but not JSON — still reachable
      backendHealthy = true;
      healthCheckCompleted = true;
      return {
        isHealthy: true,
        message: `Backend returned ${res.status} (non-JSON), but is reachable.`,
      };
    } else {
      backendHealthy = false;
      healthCheckCompleted = true;
      return {
        isHealthy: false,
        message: `Backend returned ${res.status}. Loaded sample data.`,
      };
    }
  } catch (err) {
    backendHealthy = false;
    healthCheckCompleted = true;
    return {
      isHealthy: false,
      message: "Backend not available. Loaded sample data.",
    };
  }
}

export function getBackendStatus(): {
  isHealthy: boolean;
  healthCheckCompleted: boolean;
} {
  return { isHealthy: backendHealthy, healthCheckCompleted };
}

function mapStrapiToRecipe(data: any): Recipe {
  // Support Strapi v4/v5 response shapes (attributes/data wrappers)
  const attrs = data?.attributes ?? data;

  const getImageUrl = (url: any): string => {
    if (!url || typeof url !== "string") return "";
    if (url.startsWith("http")) return url;
    return `${STRAPI_URL}${url}`;
  };

  const extractTags = (tagsData: any): string[] => {
    if (!tagsData) return [];
    if (Array.isArray(tagsData))
      return tagsData.filter((t) => typeof t === "string");
    if (typeof tagsData === "object")
      return Object.keys(tagsData).filter((key) => typeof key === "string");
    return [];
  };

  // Cover image (handles media relation wrappers)
  const coverMedia = attrs?.coverImage?.data?.attributes ?? attrs?.coverImage;
  const coverImageUrl = getImageUrl(
    coverMedia?.formats?.medium?.url ||
      coverMedia?.formats?.small?.url ||
      coverMedia?.url
  );

  // Gallery images: scan attributes for likely gallery fields and extract URLs
  const mediaToUrls = (field: any): string[] => {
    if (!field) return [];
    // Handle string URL directly
    if (typeof field === "string") return [getImageUrl(field)];
    // Normalize to an array of media items
    const items = Array.isArray(field?.data)
      ? field.data
      : Array.isArray(field)
      ? field
      : field?.data
      ? [field.data]
      : [field];
    return items
      .map((img: any) => {
        const m = img?.attributes ?? img;
        const u = m?.url || m?.formats?.medium?.url || m?.formats?.small?.url;
        return getImageUrl(u);
      })
      .filter((u: string) => !!u);
  };

  let galleryImages: string[] = [];
  for (const [key, val] of Object.entries(attrs ?? {})) {
    if (key === "coverImage") continue;
    if (/gallery|image/i.test(key)) {
      const urls = mediaToUrls(val);
      if (urls.length) galleryImages.push(...urls);
    }
  }
  // Deduplicate and exclude cover image
  galleryImages = Array.from(new Set(galleryImages)).filter(
    (u) => !!u && u !== coverImageUrl
  );

  // Categories (handles relation wrappers)
  const catItems = attrs?.categories?.data ?? attrs?.categories ?? [];
  const categories = (catItems || []).map((c: any) => {
    const ca = c?.attributes ?? c;
    return {
      id: String(c?.id ?? ca?.documentId ?? ""),
      name: ca?.name ?? "Unknown",
      slug: ca?.slug ?? String(c?.id ?? ""),
    };
  });

  return {
    id: String(data?.id ?? data?.documentId ?? Math.random()),
    slug: attrs?.slug ?? String(data?.id ?? ""),
    title: attrs?.title ?? "Untitled",
    description: attrs?.description ?? "",
    coverImage: coverImageUrl,
    galleryImages,
    ingredients: (attrs?.ingredients || []).map((ing: any, idx: number) => ({
      id: String(ing?.id ?? idx),
      item: ing?.item ?? "",
      quantity: ing?.quantity ?? "",
      unit: ing?.unit ?? "",
      notes: ing?.notes ?? "",
    })),
    instructions: (attrs?.instructions || []).map((ins: any, idx: number) => ({
      id: String(ins?.id ?? idx),
      stepNumber: ins?.stepNumber ?? idx + 1,
      description: ins?.description ?? "",
      tips: ins?.tips ?? undefined,
    })),
    prepTime: Number(attrs?.prepTime ?? 0),
    cookTime: Number(attrs?.cookTime ?? 0),
    servings: Number(attrs?.servings ?? 1),
    difficulty: (attrs?.difficulty ?? "Medium") as any,
    categories,
    tags: extractTags(attrs?.tags),
    createdAt: attrs?.createdAt,
    updatedAt: attrs?.updatedAt,
  } as Recipe;
}

export async function getRecipes(): Promise<Recipe[]> {
  if (!STRAPI_URL) {
    return Promise.resolve(sampleRecipes);
  }

  try {
    const res = await fetch(
      `${STRAPI_URL.replace(/\/$/, "")}/api/recipes?populate=*`
    );
    if (!res.ok) {
      backendHealthy = false;
      return sampleRecipes;
    }
    const json = await res.json();
    const data = json.data || [];
    backendHealthy = true;
    return data.map((item: any) => mapStrapiToRecipe(item));
  } catch (err) {
    backendHealthy = false;
    return sampleRecipes;
  }
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  if (!STRAPI_URL) {
    return Promise.resolve(sampleRecipes.find((r) => r.slug === slug) ?? null);
  }

  try {
    const res = await fetch(
      `${STRAPI_URL.replace(
        /\/$/,
        ""
      )}/api/recipes?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`
    );
    if (!res.ok) {
      backendHealthy = false;
      return sampleRecipes.find((r) => r.slug === slug) ?? null;
    }
    const json = await res.json();
    const item = json.data?.[0];
    if (!item) {
      return null;
    }
    backendHealthy = true;
    return mapStrapiToRecipe(item);
  } catch (err) {
    backendHealthy = false;
    return sampleRecipes.find((r) => r.slug === slug) ?? null;
  }
}

export async function getCategories(): Promise<
  { id: string; name: string; slug: string }[]
> {
  if (!STRAPI_URL) {
    return Promise.resolve([
      { id: "italian", name: "Italian", slug: "italian" },
      { id: "seafood", name: "Seafood", slug: "seafood" },
      { id: "thai", name: "Thai", slug: "thai" },
      { id: "desserts", name: "Desserts", slug: "desserts" },
      { id: "healthy", name: "Healthy", slug: "healthy" },
    ]);
  }

  try {
    const res = await fetch(`${STRAPI_URL.replace(/\/$/, "")}/api/categories`);
    if (!res.ok) {
      backendHealthy = false;
      return [];
    }
    const json = await res.json();
    const categories = (json.data || []).map((c: any) => {
      const a = c?.attributes ?? c;
      return {
        id: String(c?.id ?? a?.documentId ?? ""),
        name: a?.name ?? "Unknown",
        slug: a?.slug ?? `cat-${c?.id}`,
      };
    });
    backendHealthy = true;
    return categories;
  } catch (err) {
    backendHealthy = false;
    return [];
  }
}

export async function searchRecipes(query: string): Promise<Recipe[]> {
  const q = (query || "").trim();
  if (!q) return getRecipes();

  if (!STRAPI_URL) {
    const lower = q.toLowerCase();
    return sampleRecipes.filter(
      (r) =>
        r.title.toLowerCase().includes(lower) ||
        r.description.toLowerCase().includes(lower) ||
        r.tags.some((t) => t.toLowerCase().includes(lower)) ||
        r.ingredients.some((ing) => ing.item.toLowerCase().includes(lower)) ||
        r.instructions.some((ins) =>
          (ins.description || "").toLowerCase().includes(lower)
        )
    );
  }

  try {
    // Try server-side filtering on common fields (title, description, tags)
    const encoded = encodeURIComponent(q);
    const url = `${STRAPI_URL.replace(
      /\/$/,
      ""
    )}/api/recipes?filters[$or][0][title][$containsi]=${encoded}&filters[$or][1][description][$containsi]=${encoded}&filters[$or][2][tags][$containsi]=${encoded}&populate=*`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Strapi responded ${res.status}`);
    const json = await res.json();
    const data = json.data || [];

    if (data.length > 0) {
      return data.map((item: any) => mapStrapiToRecipe(item));
    }

    const all = await getRecipes();
    const lower = q.toLowerCase();
    return all.filter(
      (r) =>
        r.title.toLowerCase().includes(lower) ||
        r.description.toLowerCase().includes(lower) ||
        r.tags.some((t) => t.toLowerCase().includes(lower)) ||
        r.ingredients.some((ing) => ing.item.toLowerCase().includes(lower)) ||
        r.instructions.some((ins) =>
          (ins.description || "").toLowerCase().includes(lower)
        )
    );
  } catch (err) {
    const lower = q.toLowerCase();
    return (await getRecipes()).filter(
      (r) =>
        r.title.toLowerCase().includes(lower) ||
        r.description.toLowerCase().includes(lower) ||
        r.tags.some((t) => t.toLowerCase().includes(lower)) ||
        r.ingredients.some((ing) => ing.item.toLowerCase().includes(lower)) ||
        r.instructions.some((ins) =>
          (ins.description || "").toLowerCase().includes(lower)
        )
    );
  }
}

export async function createRecipeFromAccess(
  formData: FormData
): Promise<{ ok: boolean; id?: number; slug?: string; error?: string }> {
  if (!STRAPI_URL) {
    return { ok: false, error: "Backend URL not configured" };
  }
  try {
    // Get access grant from localStorage
    const grantStr = localStorage.getItem("access_grant");
    const headers: HeadersInit = {};
    if (grantStr) {
      headers["Authorization"] = `Bearer ${grantStr}`;
    }

    const res = await fetch(
      `${STRAPI_URL.replace(/\/$/, "")}/api/recipes/create-from-access`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: json?.error || `HTTP ${res.status}` };
    }
    return { ok: true, id: json?.id, slug: json?.slug };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}
