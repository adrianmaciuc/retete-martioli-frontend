import { Recipe } from "@/lib/types";
import { RecipeCard } from "./RecipeCard";

interface RecipeGridProps {
  recipes: Recipe[];
  onRecipeClick?: (recipe: Recipe) => void;
  loading?: boolean;
}

export function RecipeGrid({
  recipes,
  onRecipeClick,
  loading,
}: RecipeGridProps) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6"
        data-testid="recipe-grid-loading"
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl overflow-hidden shadow-card animate-pulse"
            data-testid={`recipe-card-skeleton-${i}`}
          >
            <div
              className="aspect-[4/3] bg-muted"
              data-testid={`recipe-card-skeleton-${i}-image`}
            />
            <div className="p-5 space-y-3">
              <div
                className="h-5 bg-muted rounded w-3/4"
                data-testid={`recipe-card-skeleton-${i}-title`}
              />
              <div
                className="h-4 bg-muted rounded w-full"
                data-testid={`recipe-card-skeleton-${i}-desc`}
              />
              <div
                className="h-4 bg-muted rounded w-2/3"
                data-testid={`recipe-card-skeleton-${i}-desc-2`}
              />
              <div className="flex gap-4">
                <div
                  className="h-4 bg-muted rounded w-16"
                  data-testid={`recipe-card-skeleton-${i}-meta-1`}
                />
                <div
                  className="h-4 bg-muted rounded w-12"
                  data-testid={`recipe-card-skeleton-${i}-meta-2`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-testid="recipe-grid-empty"
      >
        <div
          className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4"
          data-testid="recipe-grid-empty-icon"
        >
          <span className="text-4xl">🍳</span>
        </div>
        <h3
          className="font-display text-xl font-semibold text-foreground mb-2"
          data-testid="recipe-grid-empty-title"
        >
          Nici o reteta gasita
        </h3>
        <p
          className="text-muted-foreground max-w-sm"
          data-testid="recipe-grid-empty-message"
        >
          Incearca sa ajustezi cautarea sau alege filtru "Toate retetele"
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6"
      data-testid="recipe-grid"
    >
      {recipes.map((recipe, index) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onClick={() => onRecipeClick?.(recipe)}
          className="opacity-0 animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        />
      ))}
    </div>
  );
}
