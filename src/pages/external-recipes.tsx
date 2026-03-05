import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
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
        if (mounted) setLoading(false);
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
    <div className="min-h-screen bg-background" data-testid="external-recipes-page">
      <Header />

      <main data-testid="external-recipes-main">
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
