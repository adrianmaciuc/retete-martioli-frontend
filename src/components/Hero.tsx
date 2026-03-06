import { SearchBar } from "./SearchBar";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink, Home } from "lucide-react";

interface HeroProps {
  onSearch: (query: string) => void;
  recipeCount: number;
}

export function Hero({ onSearch, recipeCount }: HeroProps) {
  const location = useLocation();
  const isExternal = location.pathname.startsWith("/external-recipes");

  return (
    <section
      className="relative py-16 md:py-24 overflow-hidden"
      data-testid="hero-section"
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 bg-gradient-subtle"
        data-testid="hero-background-gradient"
      />
      <div
        className="absolute inset-0 opacity-30"
        data-testid="hero-background-pattern"
      >
        <div
          className="absolute top-10 left-10 w-64 h-64 rounded-full bg-teal-200 blur-3xl"
          data-testid="hero-background-blob-left"
        />
        <div
          className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-teal-100 blur-3xl"
          data-testid="hero-background-blob-right"
        />
      </div>

      <div
        className="container mx-auto px-4 relative z-10"
        data-testid="hero-container"
      >
        <div
          className="text-center max-w-3xl mx-auto"
          data-testid="hero-content"
        >
          <h1
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance"
            data-testid="hero-title"
          >
            Retete Personale
            <span
              className="block text-primary"
              data-testid="hero-subtitle-highlight"
            >
              Pentru iepurasi pofticiosi
            </span>
          </h1>
          <p
            className="font-recipe text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto"
            data-testid="hero-description"
          >
            Colectie de retete delicioase pentru orice ocazie
          </p>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              asChild
              size="lg"
              variant={isExternal ? "outline" : undefined}
              className="gap-2"
            >
              <Link to="/">
                <Home className="w-5 h-5" />
                Retete Personale
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant={isExternal ? undefined : "outline"}
              className="gap-2"
            >
              <Link to="/external-recipes">
                <ExternalLink className="w-5 h-5" />
                Retete Externe
              </Link>
            </Button>
          </div>

          <div
            className="flex justify-center mb-6"
            data-testid="hero-search-container"
          >
            <SearchBar
              onSearch={onSearch}
              placeholder="Cauta dupa nume sau ingredient..."
            />
          </div>

          <p
            className="text-sm text-muted-foreground"
            data-testid="hero-recipe-count"
          >
            <span
              className="font-semibold text-primary"
              data-testid="hero-recipe-number"
            >
              {recipeCount}
            </span>{" "}
            <span data-testid="hero-recipe-label">
              {recipeCount <= 1 ? "reteta in colectie" : "retete in colectie"}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

export function HeroButtons() {
  const location = useLocation();
  const isExternal = location.pathname.startsWith("/external-recipes");
  return (
    <div className="flex justify-center gap-4 py-8">
      <Button
        asChild
        size="lg"
        variant={isExternal ? undefined : "outline"}
        className="gap-2"
      >
        <Link to="/external-recipes">
          <ExternalLink className="w-5 h-5" />
          Retete Externe
        </Link>
      </Button>
      <Button
        asChild
        size="lg"
        variant={isExternal ? "outline" : undefined}
        className="gap-2"
      >
        <Link to="/">
          <Home className="w-5 h-5" />
          Retete Personale
        </Link>
      </Button>
    </div>
  );
}
