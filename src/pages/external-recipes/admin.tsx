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
        title: "Nume obligatoriu",
        description: "Va rugam introduceti numele retetei",
      });
      return;
    }
    if (!link.trim()) {
      toast({
        title: "Link obligatoriu",
        description: "Va rugam introduceti URL-ul retetei",
      });
      return;
    }
    if (!shortDescription.trim()) {
      toast({
        title: "Descriere obligatorie",
        description: "Va rugam introduceti o descriere scurta",
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
      setError(res.error || "Eroare necunoscuta la crearea retetei externe");
      return;
    }
      toast({
        title: "Reteta externa creata cu succes!",
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
                  Eroare la crearea retetei externe
                </h1>
              <p
                className="text-muted-foreground mb-6"
                data-testid="add-external-recipe-error-message"
              >
                {error}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirectionare catre pagina de retete externe in cateva secunde...
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
        Inapoi la retete externe
      </Button>
        </div>

        <h1
          className="text-3xl font-display font-bold text-foreground mb-2"
          data-testid="add-external-recipe-title"
        >
          Adauga reteta externa
        </h1>
        <p className="text-muted-foreground mb-8">
          Adauga o reteta selectionata de pe internet
        </p>

        <div
          className="max-w-2xl bg-card rounded-xl shadow-card p-6 space-y-6"
          data-testid="external-admin-form"
        >
          <div>
            <Label className="block mb-2">Numele retetei</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Italian Salsa Verde"
              data-testid="add-external-recipe-name-input"
            />
          </div>

          <div>
            <Label className="block mb-2">URL retetei</Label>
            <Input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://exemplu.com/reteta"
              data-testid="add-external-recipe-link-input"
            />
          </div>

          <div>
            <Label className="block mb-2">Descriere scurta</Label>
            <Textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="O descriere scurta a retetei"
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
              {loading ? "Se creeaza..." : "Creeaza reteta externa"}
            </Button>
             <Button
               variant="outline"
               onClick={() => navigate("/external-recipes")}
               disabled={loading}
               data-testid="add-external-recipe-cancel"
             >
               Anuleaza
             </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
