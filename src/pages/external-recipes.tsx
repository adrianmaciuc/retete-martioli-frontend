import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, ExternalLink, Home } from "lucide-react";
import { Header } from "@/components/Header";
import { ExternalRecipeCard } from "@/components/ExternalRecipeCard";
import { Button } from "@/components/ui/button";
import { getExternalRecipes, ExternalRecipe } from "@/lib/strapi";
import { isAccessGranted } from "@/lib/access";

export default function ExternalRecipesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ExternalRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    getExternalRecipes()
      .then((data) => {
        if (!mounted) return;
        setItems(data);
      })
      .finally(() => {
        if (!mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setIsLoggedIn(isAccessGranted());
  }, []);

  const handleAddExternalRecipe = () => {
    if (isAccessGranted()) {
      navigate("/external-recipes/admin");
    } else {
      navigate("/access");
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      data-testid="external-recipes-page"
    >
      <Header />

      <main data-testid="external-recipes-main">
        <section
          className="relative py-16 md:py-24 overflow-hidden"
          data-testid="hero-section"
        >
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

              {/* Navigation Buttons - swapped for external page */}
              <div className="flex justify-center gap-4 mb-8">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/">
                    <Home className="w-5 h-5" />
                    Retete Personale
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link to="/external-recipes">
                    <ExternalLink className="w-5 h-5" />
                    Retete Externe
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4" />
              Inapoi
            </Button>
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Retete externe
          </h1>
          <p className="text-muted-foreground mb-8">
            Retete selectionate de pe internet
          </p>

          {loading ? (
            <div className="text-muted-foreground">Se incarca...</div>
          ) : (
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
          )}
        </section>
      </main>

      {/* Footer */}
      <footer
        className="bg-card border-t border-border py-8 mt-16"
        data-testid="external-recipes-footer"
      >
        <div
          className="container mx-auto px-4 text-center"
          data-testid="footer-content"
        >
          <p
            className="text-muted-foreground text-sm"
            data-testid="footer-text"
          >
            Creat cu 💚 de Adrian Maciuc, pentru iubitorii de mancare din
            intreaga lume
          </p>
          <button
            onClick={handleAddExternalRecipe}
            className="mt-4 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            title="Adauga reteta externa - Chef Mode"
            data-testid="external-admin-secret"
            aria-label="Adauga reteta externa"
          >
            +
          </button>
        </div>
      </footer>
    </div>
  );
}
