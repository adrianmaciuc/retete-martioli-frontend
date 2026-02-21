import React, { useEffect, useState } from "react";
import { ExternalRecipeCard } from "@/components/ExternalRecipeCard";
import { sampleExternalRecipes } from "@/lib/sample-external-recipes";
import { checkBackendHealth } from "@/lib/strapi";

export default function ExternalRecipesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const healthy = await checkBackendHealth();
      if (!mounted) return;
      if (!healthy) {
        setUsingMock(true);
        setItems(sampleExternalRecipes as any[]);
        return;
      }

      try {
        const res = await fetch("/api/external-recipes?populate=*");
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        const data = json.data || [];
        // map possible Strapi wrappers
        const mapped = data.map((d: any) => {
          const attrs = d.attributes ?? d;
          return {
            id: d.id ?? attrs.id,
            name: attrs.name,
            link: attrs.link,
            shortDescription: attrs.shortDescription,
          };
        });
        setItems(mapped);
      } catch (e) {
        setUsingMock(true);
        setItems(sampleExternalRecipes as any[]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">External Recipes</h1>
      <div data-testid="external-recipes-list" className="space-y-4">
        {items.map((it) => (
          <ExternalRecipeCard
            key={it.id}
            id={it.id}
            name={it.name}
            link={it.link}
            shortDescription={it.shortDescription}
          />
        ))}
      </div>
      {usingMock && (
        <div className="mt-6 text-sm text-muted">Showing mocked entries while backend is sleeping.</div>
      )}
    </main>
  );
}
