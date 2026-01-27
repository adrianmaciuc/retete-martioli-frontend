import { Recipe } from "@/lib/types";
import { Clock, Users, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const difficultyColors = {
  Easy: "bg-teal-600 text-white",
  // Use a strong, solid background for better contrast on images
  Medium: "bg-accent-600 text-white",
  Hard: "bg-coral-600 text-white",
};

export function RecipeCard({
  recipe,
  onClick,
  className,
  style,
}: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <article
      onClick={onClick}
      style={style}
      data-testid={`recipe-card-${recipe.id}`}
      className={cn(
        "group relative bg-card rounded-xl overflow-hidden cursor-pointer",
        "shadow-card hover:shadow-lifted",
        "transform transition-all duration-300 ease-out",
        "hover:-translate-y-2",
        className
      )}
    >
      {/* Image Container */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        data-testid={`recipe-card-image-container-${recipe.id}`}
      >
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          data-testid={`recipe-card-image-${recipe.id}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          data-testid={`recipe-card-image-overlay-${recipe.id}`}
        />

        {/* Difficulty Badge */}
        <span
          data-testid={`recipe-card-difficulty-${recipe.id}`}
          className={cn(
            "absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold",
            "backdrop-blur-sm shadow-soft ring-1 ring-white/10",
            difficultyColors[recipe.difficulty]
          )}
        >
          {recipe.difficulty}
        </span>
      </div>

      {/* Content */}
      <div className="p-5" data-testid={`recipe-card-content-${recipe.id}`}>
        <h3
          className="font-display text-lg font-semibold text-card-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors"
          data-testid={`recipe-card-title-${recipe.id}`}
        >
          {recipe.title}
        </h3>

        <p
          className="text-muted-foreground text-sm line-clamp-2 mb-4 font-recipe"
          data-testid={`recipe-card-description-${recipe.id}`}
        >
          {recipe.description}
        </p>

        {/* Meta Info */}
        <div
          className="flex items-center gap-4 text-sm text-muted-foreground"
          data-testid={`recipe-card-meta-${recipe.id}`}
        >
          <div
            className="flex items-center gap-1.5"
            data-testid={`recipe-card-time-${recipe.id}`}
          >
            <Clock
              className="w-4 h-4 text-primary"
              data-testid={`recipe-card-time-icon-${recipe.id}`}
            />
            <span data-testid={`recipe-card-time-value-${recipe.id}`}>
              {totalTime} min
            </span>
          </div>
          <div
            className="flex items-center gap-1.5"
            data-testid={`recipe-card-servings-${recipe.id}`}
          >
            <Users
              className="w-4 h-4 text-primary"
              data-testid={`recipe-card-servings-icon-${recipe.id}`}
            />
            <span data-testid={`recipe-card-servings-value-${recipe.id}`}>
              {recipe.servings}
            </span>
          </div>
          <div
            className="flex items-center gap-1.5"
            data-testid={`recipe-card-ingredients-count-${recipe.id}`}
          >
            <ChefHat
              className="w-4 h-4 text-primary"
              data-testid={`recipe-card-ingredients-icon-${recipe.id}`}
            />
            <span data-testid={`recipe-card-ingredients-value-${recipe.id}`}>
              {recipe.ingredients.length}
            </span>
          </div>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div
            className="flex flex-wrap gap-1.5 mt-4"
            data-testid={`recipe-card-tags-${recipe.id}`}
          >
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                data-testid={`recipe-card-tag-${recipe.id}-${tag}`}
                className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
