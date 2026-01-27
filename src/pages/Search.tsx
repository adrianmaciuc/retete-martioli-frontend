import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchRecipes } from "@/lib/strapi";
import { Recipe } from "@/lib/types";
import { RecipeGrid } from "@/components/RecipeGrid";
import { SearchBar } from "@/components/SearchBar";

export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") ?? "";

  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(
    (term: string) => {
      const encoded = encodeURIComponent(term);
      // update url
      navigate(`/search?q=${encoded}`, { replace: true });
    },
    [navigate]
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    searchRecipes(q)
      .then((r) => {
        if (!mounted) return;
        setResults(r);
      })
      .catch((err) => {
        console.error(err);
        setError("Error searching recipes");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [q]);

  return (
    <div className="min-h-screen bg-background" data-testid="search-page">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto mb-8">
          <h1
            className="font-display text-3xl font-bold mb-2"
            data-testid="search-page-title"
          >
            Search recipes
          </h1>
          <p
            className="text-muted-foreground mb-4"
            data-testid="search-page-subtitle"
          >
            Search by title, ingredient, tag or step
          </p>
          <SearchBar
            onSearch={(term) => {
              setQuery(term);
              runSearch(term);
            }}
            placeholder={`Search for "${q}"...`}
          />
        </div>

        {error && (
          <div className="text-amber-600 mb-6" data-testid="search-page-error">
            {error}
          </div>
        )}

        <RecipeGrid
          recipes={results}
          loading={loading}
          onRecipeClick={() => {}}
        />
      </div>
    </div>
  );
}
