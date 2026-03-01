import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { isAccessGranted } from "@/lib/access";
import { createExternalRecipeFromAccess } from "@/lib/strapi";

export default function AddExternalRecipe() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAccessGranted()) {
      navigate("/access");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        navigate("/external-recipes");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  const onSubmit = async () => {
    // Basic client-side validation
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please provide a recipe name",
      });
      return;
    }
    if (!link.trim()) {
      toast({
        title: "Link is required",
        description: "Please provide a recipe URL",
      });
      return;
    }
    if (!shortDescription.trim()) {
      toast({
        title: "Description is required",
        description: "Please provide a short description",
      });
      return;
    }

    const data = {
      name,
      link,
      shortDescription,
    };

    const fd = new FormData();
    fd.append("data", JSON.stringify(data));

    setLoading(true);
    try {
      const res = await createExternalRecipeFromAccess(fd);
      if (!res.ok) {
        setError(res.error || "Unknown error occurred while creating external recipe");
        return;
      }
      toast({
        title: "External recipe created successfully!",
      });
      navigate("/external-recipes");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div
          className="container mx-auto px-4 py-8"
          data-testid="add-external-recipe-error-page"
        >
          <div className="max-w-md mx-auto mt-16 text-center">
            <div
              className="bg-destructive/10 border border-destructive rounded-lg p-8"
              data-testid="add-external-recipe-error-card"
            >
              <h1
                className="text-2xl font-bold text-destructive mb-4"
                data-testid="add-external-recipe-error-title"
              >
                Error creating external recipe
              </h1>
              <p
                className="text-muted-foreground mb-6"
                data-testid="add-external-recipe-error-message"
              >
                {error}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to external recipes page in a few seconds...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="add-external-recipe-page">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/external-recipes")}
            className="gap-2"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to External Recipes
          </Button>
        </div>

        <h1
          className="text-3xl font-display font-bold text-foreground mb-2"
          data-testid="add-external-recipe-title"
        >
          Add External Recipe
        </h1>
        <p className="text-muted-foreground mb-8">
          Add a curated recipe from around the web
        </p>

        <div
          className="max-w-2xl bg-card rounded-xl shadow-card p-6 space-y-6"
          data-testid="external-admin-form"
        >
          <div>
            <Label className="block mb-2">Recipe Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Italian Salsa Verde"
              data-testid="add-external-recipe-name-input"
            />
          </div>

          <div>
            <Label className="block mb-2">Recipe URL</Label>
            <Input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com/recipe"
              data-testid="add-external-recipe-link-input"
            />
          </div>

          <div>
            <Label className="block mb-2">Short Description</Label>
            <Textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A brief description of the recipe"
              rows={4}
              data-testid="add-external-recipe-description"
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={onSubmit}
              disabled={loading}
              data-testid="add-external-recipe-submit"
            >
              {loading ? "Creating..." : "Create External Recipe"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/external-recipes")}
              disabled={loading}
              data-testid="add-external-recipe-cancel"
            >
              Cancel
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
