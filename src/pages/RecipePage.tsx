import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRecipeBySlug } from "@/lib/strapi";
import { Recipe } from "@/lib/types";
import { RecipeDetail } from "@/components/RecipeDetail";

export default function RecipePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getRecipeBySlug(slug)
      .then((r) => {
        if (!r) {
          setError("Recipe not found");
          setRecipe(null);
        } else {
          setRecipe(r);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Error loading recipe");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="recipe-page-loading"
      >
        <div
          className="animate-pulse text-muted-foreground"
          data-testid="recipe-page-loading-spinner"
        >
          Loading...
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-testid="recipe-page-error"
      >
        <div className="text-center">
          <p
            className="text-foreground mb-4"
            data-testid="recipe-page-error-message"
          >
            {error ?? "Recipe not found"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
            data-testid="recipe-page-error-back-button"
          >
            Back home
          </button>
        </div>
      </div>
    );
  }

  // Reuse RecipeDetail for now (it renders a full-screen view); onClose navigates back
  return <RecipeDetail recipe={recipe as any} onClose={() => navigate("/")} />;
}
