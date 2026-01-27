import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryFilter } from "@/components/CategoryFilter";
import { RecipeGrid } from "@/components/RecipeGrid";
import { sampleRecipes } from "@/lib/sample-recipes";
import { Recipe } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";
import {
  getRecipes,
  getCategories,
  checkBackendHealth,
  getBackendStatus,
} from "@/lib/strapi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { isAccessGranted, getAccessName, clearAccessGrant } from "@/lib/access";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        recipe.ingredients.some((ing) =>
          ing.item.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Category filter
      const matchesCategory =
        selectedCategory === "all" ||
        recipe.categories.some((cat) => cat.slug === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, recipes]);

  const handleSearch = useCallback((query: string) => {
    // Navigate to search page so results are shareable/bookmarkable
    const encoded = encodeURIComponent(query);
    window.history.replaceState({}, "", `/search?q=${encoded}`);
    setSearchQuery(query);
  }, []);

  const handleAddRecipe = () => {
    if (isAccessGranted()) {
      navigate("/add-recipe");
    } else {
      navigate("/access");
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Perform health check first
    checkBackendHealth()
      .then((health) => {
        if (!mounted) return;
        if (!health.isHealthy) {
          setBackendError(health.message);
        }
        // Fetch recipes
        return getRecipes();
      })
      .then((data) => {
        if (!mounted) return;
        setRecipes(data);
      })
      .catch(() => {
        if (!mounted) return;
        setBackendError("Failed to load recipes. Using sample data.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    // Fetch categories in parallel (non-blocking)
    getCategories().then((data) => {
      if (!mounted) return;
      setCategories(data);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setIsLoggedIn(isAccessGranted());
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      <Header />

      <main data-testid="home-main">
        <Hero onSearch={handleSearch} recipeCount={recipes.length} />

        <section
          className="container mx-auto px-4 pb-16"
          data-testid="recipes-section"
        >
          {backendError && (
            <Alert
              variant="default"
              className="mb-6 bg-amber-50 border-amber-200"
              data-testid="backend-error-alert"
            >
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription
                className="text-amber-800"
                data-testid="backend-error-message"
              >
                <strong>Backend error:</strong> {backendError}
              </AlertDescription>
            </Alert>
          )}

          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            categories={[
              { id: "all", name: "Toate retetele", slug: "all" },
              ...categories,
            ]}
          />

          <RecipeGrid
            recipes={filteredRecipes}
            onRecipeClick={(recipe) => {
              navigate(`/recipe/${encodeURIComponent(recipe.slug)}`);
            }}
            loading={loading}
          />
        </section>
      </main>

      {/* Footer */}
      <footer
        className="bg-card border-t border-border py-8"
        data-testid="home-footer"
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
            onClick={handleAddRecipe}
            className="mt-4 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
            title="Adauga reteta - Chef Mode"
            data-testid="chef-access-button"
            aria-label="Access gate"
          >
            +
          </button>
        </div>
      </footer>

      {/* Admin Mode Badge */}
      {isLoggedIn && (
        <div
          className="bg-primary/10 border border-primary rounded-lg p-4 mx-4 mb-4 mt-4"
          data-testid="admin-mode-badge"
        >
          <div className="container mx-auto px-0 flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              ✓ Chef Mode ON : {getAccessName()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearAccessGrant();
                window.location.reload();
              }}
              data-testid="admin-logout-button"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
