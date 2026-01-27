import { Recipe } from "@/lib/types";
import { ProcessImage } from "@/lib/sample-recipes";
import { useState } from "react";
import {
  Clock,
  Users,
  ChefHat,
  Printer,
  ArrowLeft,
  Camera,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipeDetailProps {
  recipe: Recipe & { processImages?: ProcessImage[] };
  onClose: () => void;
}

const difficultyColors = {
  Easy: "bg-teal-600 text-white border-teal-700",
  // Solid backgrounds improve readability against any hero image
  Medium: "bg-accent-600 text-white border-accent-700",
  Hard: "bg-coral-600 text-white border-coral-700",
};

export function RecipeDetail({ recipe, onClose }: RecipeDetailProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
      data-testid="recipe-detail-modal"
    >
      {/* Hero Section */}
      <div
        className="relative h-[50vh] min-h-[400px]"
        data-testid="recipe-detail-hero"
      >
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          className="w-full h-full object-cover"
          data-testid="recipe-detail-hero-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

        {/* Navigation */}
        <div
          className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center"
          data-testid="recipe-detail-nav"
        >
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-card/90 backdrop-blur-sm rounded-full text-foreground hover:bg-card transition-colors shadow-lg"
            data-testid="recipe-detail-back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="p-3 bg-card/90 backdrop-blur-sm rounded-full text-foreground hover:bg-card transition-colors shadow-lg"
              aria-label="Print recipe"
              data-testid="recipe-detail-print-button"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Title Overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 p-8"
          data-testid="recipe-detail-hero-overlay"
        >
          <div className="max-w-4xl mx-auto">
            <span
              className={cn(
                "inline-block px-3 py-1 rounded-full text-sm font-semibold mb-4 border backdrop-blur-sm shadow-soft ring-1 ring-white/10",
                difficultyColors[recipe.difficulty]
              )}
              data-testid="recipe-detail-difficulty"
            >
              {recipe.difficulty}
            </span>
            <h1
              className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4 text-balance"
              data-testid="recipe-detail-title"
            >
              {recipe.title}
            </h1>
            <p
              className="font-recipe text-lg text-primary-foreground/90 max-w-2xl"
              data-testid="recipe-detail-description"
            >
              {recipe.description}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="max-w-4xl mx-auto px-4 py-8 -mt-8 relative"
        data-testid="recipe-detail-content"
      >
        {/* Quick Info Card */}
        <div
          className="bg-card rounded-2xl shadow-card p-6 mb-8 grid grid-cols-3 gap-4"
          data-testid="recipe-detail-quick-info"
        >
          <div className="text-center" data-testid="recipe-detail-time-info">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <p
              className="text-2xl font-display font-bold text-foreground"
              data-testid="recipe-detail-time-value"
            >
              {totalTime}
            </p>
            <p className="text-sm text-muted-foreground">minute in total</p>
          </div>
          <div
            className="text-center border-x border-border"
            data-testid="recipe-detail-servings-info"
          >
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p
              className="text-2xl font-display font-bold text-foreground"
              data-testid="recipe-detail-servings-value"
            >
              {recipe.servings}
            </p>
            <p className="text-sm text-muted-foreground">portii</p>
          </div>
          <div
            className="text-center"
            data-testid="recipe-detail-ingredients-count-info"
          >
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
              <ChefHat className="w-6 h-6 text-primary" />
            </div>
            <p
              className="text-2xl font-display font-bold text-foreground"
              data-testid="recipe-detail-ingredients-count-value"
            >
              {recipe.ingredients.length}
            </p>
            <p className="text-sm text-muted-foreground">ingrediente</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div
            className="lg:col-span-1"
            data-testid="recipe-detail-ingredients-section"
          >
            <div className="bg-card rounded-2xl shadow-card p-6 sticky top-4">
              <h2
                className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2"
                data-testid="recipe-detail-ingredients-title"
              >
                <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm">
                  🥗
                </span>
                ingrediente
              </h2>
              <ul
                className="space-y-3"
                data-testid="recipe-detail-ingredients-list"
              >
                {recipe.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="flex items-start gap-3 font-recipe text-foreground"
                    data-testid={`recipe-detail-ingredient-${ingredient.id}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>
                      <strong className="text-primary">
                        {ingredient.quantity}
                      </strong>
                      {ingredient.unit && (
                        <span className="text-muted-foreground">
                          {" "}
                          {ingredient.unit}
                        </span>
                      )}{" "}
                      {ingredient.item}
                      {ingredient.notes && (
                        <span className="text-muted-foreground italic">
                          {" "}
                          ({ingredient.notes})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Instructions */}
          <div
            className="lg:col-span-2"
            data-testid="recipe-detail-instructions-section"
          >
            <div className="bg-card rounded-2xl shadow-card p-6">
              <h2
                className="font-display text-2xl font-bold text-foreground mb-2 flex items-center gap-2"
                data-testid="recipe-detail-instructions-title"
              >
                <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm">
                  📝
                </span>
                Instructiuni
              </h2>
              <div
                className="text-sm text-muted-foreground mb-6"
                data-testid="recipe-detail-times"
              >
                Pregatire: {recipe.prepTime} min • Gatire: {recipe.cookTime} min
              </div>
              <ol
                className="space-y-6"
                data-testid="recipe-detail-instructions-list"
              >
                {recipe.instructions.map((instruction) => (
                  <li
                    key={instruction.id}
                    className="flex gap-4"
                    data-testid={`recipe-detail-instruction-${instruction.id}`}
                  >
                    <span
                      className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg flex items-center justify-center"
                      data-testid={`recipe-detail-instruction-step-${instruction.stepNumber}`}
                    >
                      {instruction.stepNumber}
                    </span>
                    <div className="flex-1 pt-2">
                      <p
                        className="font-recipe text-lg text-foreground leading-relaxed"
                        data-testid={`recipe-detail-instruction-description-${instruction.id}`}
                      >
                        {instruction.description}
                      </p>
                      {instruction.tips && (
                        <div
                          className="mt-3 p-4 bg-secondary rounded-lg border-l-4 border-primary"
                          data-testid={`recipe-detail-instruction-tip-${instruction.id}`}
                        >
                          <p className="text-sm text-secondary-foreground">
                            <span className="font-semibold">💡 Tip:</span>{" "}
                            {instruction.tips}
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div
            className="mt-12 pt-8 border-t border-border"
            data-testid="recipe-detail-tags-section"
          >
            <h3
              className="font-display text-lg font-semibold text-foreground mb-4"
              data-testid="recipe-detail-tags-title"
            >
              Tags
            </h3>
            <div
              className="flex flex-wrap gap-2"
              data-testid="recipe-detail-tags-list"
            >
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                  data-testid={`recipe-detail-tag-${tag}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {recipe.galleryImages && recipe.galleryImages.length > 0 && (
          <div
            className="mt-12 pt-8 border-t border-border"
            data-testid="recipe-detail-gallery-section"
          >
            <h2
              className="font-display text-2xl font-bold text-foreground mb-6 flex items-center gap-2"
              data-testid="recipe-detail-gallery-title"
            >
              <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                <Camera className="w-4 h-4" />
              </span>
              Galerie
            </h2>
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              data-testid="recipe-detail-gallery-grid"
            >
              {recipe.galleryImages.map((img, index) => (
                <div
                  key={index}
                  className="group relative rounded-xl overflow-hidden shadow-card hover:shadow-lifted transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedImage(img)}
                  data-testid={`recipe-detail-gallery-item-${index}`}
                >
                  <div
                    className="aspect-square overflow-hidden"
                    data-testid={`recipe-detail-gallery-item-${index}-image-container`}
                  >
                    <img
                      src={img}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      data-testid={`recipe-detail-gallery-item-${index}-image`}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ZoomIn className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Lightbox Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
            data-testid="recipe-detail-lightbox"
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors z-10"
                aria-label="Close lightbox"
                data-testid="recipe-detail-lightbox-close"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Zoom Controls */}
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10"
                data-testid="recipe-detail-lightbox-controls"
              >
                <button
                  onClick={() => setZoom(Math.max(1, zoom - 0.2))}
                  className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors disabled:opacity-50"
                  disabled={zoom <= 1}
                  aria-label="Zoom out"
                  data-testid="recipe-detail-lightbox-zoom-out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <div
                  className="px-4 py-2 bg-black/50 rounded-full text-white text-sm flex items-center"
                  data-testid="recipe-detail-lightbox-zoom-level"
                >
                  {Math.round(zoom * 100)}%
                </div>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.2))}
                  className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors disabled:opacity-50"
                  disabled={zoom >= 3}
                  aria-label="Zoom in"
                  data-testid="recipe-detail-lightbox-zoom-in"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              {/* Image */}
              <div
                className="overflow-auto max-h-[80vh] flex items-center justify-center"
                style={{
                  transform: `scale(${zoom})`,
                  transition: "transform 0.2s ease-out",
                }}
                data-testid="recipe-detail-lightbox-image-container"
              >
                <img
                  src={selectedImage}
                  alt="Lightbox"
                  className="max-w-full max-h-[80vh] object-contain"
                  data-testid="recipe-detail-lightbox-image"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
