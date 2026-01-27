 import { useEffect, useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileInput } from "@/components/ui/file-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { isAccessGranted } from "@/lib/access";
import { createRecipeFromAccess, getCategories } from "@/lib/strapi";

type Ingredient = {
  item: string;
  quantity: string;
  unit?: string;
  notes?: string;
};
type Instruction = { stepNumber: number; description: string; tips?: string };

const AddRecipe = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState<number>(0);
  const [cookTime, setCookTime] = useState<number>(0);
  const [servings, setServings] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { item: "", quantity: "" },
  ]);
  const [instructions, setInstructions] = useState<Instruction[]>([
    { stepNumber: 1, description: "" },
  ]);
  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
   const [coverFile, setCoverFile] = useState<File | null>(null);
   const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
   const [error, setError] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAccessGranted()) {
      navigate("/access");
      return;
    }
    getCategories().then(setCategories);
  }, [navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  const addIngredient = () =>
    setIngredients([...ingredients, { item: "", quantity: "" }]);
  const removeIngredient = (idx: number) =>
    setIngredients(ingredients.filter((_, i) => i !== idx));
  const updateIngredient = (idx: number, patch: Partial<Ingredient>) =>
    setIngredients(
      ingredients.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing))
    );

  const addInstruction = () =>
    setInstructions([
      ...instructions,
      { stepNumber: instructions.length + 1, description: "" },
    ]);
  const removeInstruction = (idx: number) =>
    setInstructions(
      instructions
        .filter((_, i) => i !== idx)
        .map((ins, i) => ({ ...ins, stepNumber: i + 1 }))
    );
  const updateInstruction = (idx: number, patch: Partial<Instruction>) =>
    setInstructions(
      instructions
        .map((ins, i) => (i === idx ? { ...ins, ...patch } : ins))
        .map((ins, i) => ({ ...ins, stepNumber: i + 1 }))
    );

  const toggleCategory = (slug: string) =>
    setSelectedCats((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );

  const onSubmit = async () => {
    // Basic client-side validation
    if (!title.trim()) {
      toast({
        title: "Titlu e obligatoriu",
        description: "Va rog adaugati un titlu",
      });
      return;
    }
    if (!description.trim()) {
      toast({
        title: "Descriere e obligatorie",
        description: "Va rog adaugati o descriere.",
      });
      return;
    }
    if (!coverFile) {
      toast({
        title: "Imaginea principala e obligatorie",
        description: "Va rog selectati o imagine principala.",
      });
      return;
    }
    if (!galleryFiles.length) {
      toast({
        title: "Imaginile pentru galerie sunt obligatorii",
        description: "Va rog adaugati cel putin o imagine pentru galerie.",
      });
      return;
    }

    const data = {
      title,
      description,
      prepTime: Number(prepTime) || 0,
      cookTime: Number(cookTime) || 0,
      servings: Number(servings) || 1,
      difficulty,
      ingredients,
      instructions,
      categorySlugs: selectedCats,
    };

     const fd = new FormData();
     fd.append("data", JSON.stringify(data));
     fd.append("coverImage", coverFile);
     for (const gf of galleryFiles) fd.append("galleryImage", gf);

     setLoading(true);
     try {
       const res = await createRecipeFromAccess(fd);
       if (!res.ok || !res.slug) {
         setError(res.error || "Unknown error occurred while creating recipe");
         return;
       }
       toast({
         title: "Reteta creata cu succes!",
       });
       navigate("/");
     } finally {
       setLoading(false);
     }
  };

  if (error) {
    return (
      <div
        className="container mx-auto px-4 py-8"
        data-testid="add-recipe-error-page"
      >
        <div className="max-w-md mx-auto mt-16 text-center">
          <div
            className="bg-destructive/10 border border-destructive rounded-lg p-8"
            data-testid="add-recipe-error-card"
          >
            <h1
              className="text-2xl font-bold text-destructive mb-4"
              data-testid="add-recipe-error-title"
            >
              Eroare de creat reteta
            </h1>
            <p
              className="text-muted-foreground mb-6"
              data-testid="add-recipe-error-message"
            >
              {error}
            </p>
            <p className="text-sm text-muted-foreground">
              Navigare catre pagina principala in cateva secunde...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="add-recipe-page">
      <h1
        className="text-2xl font-semibold mb-6"
        data-testid="add-recipe-title"
      >
        Adauga reteta
      </h1>

      <div
        className="grid gap-6 bg-card rounded-xl shadow-card p-6"
        data-testid="add-recipe-form"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="block mb-2">Titlu</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Clatite cu banane"
              data-testid="add-recipe-title-input"
            />
          </div>
          <div>
            <Label className="block mb-2">Dificultate</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              data-testid="add-recipe-difficulty-select"
            >
              <option value="easy">Usor</option>
              <option value="medium">Mediu</option>
              <option value="hard">Greu</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="block mb-2">Descriere</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Scurta descriere a retetei"
            data-testid="add-recipe-description"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label className="block mb-2">Timp pentru pregatire (min)</Label>
            <Input
              type="number"
              min={0}
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              data-testid="add-recipe-prep-time"
            />
          </div>
          <div>
            <Label className="block mb-2">Timp pentru gatit (min)</Label>
            <Input
              type="number"
              min={0}
              value={cookTime}
              onChange={(e) => setCookTime(Number(e.target.value))}
              data-testid="add-recipe-cook-time"
            />
          </div>
          <div>
            <Label className="block mb-2">Portii</Label>
            <Input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              data-testid="add-recipe-servings"
            />
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <h2
            className="text-xl font-medium mb-2"
            data-testid="add-recipe-ingredients-title"
          >
            Ingrediente
          </h2>
          <div className="space-y-3" data-testid="add-recipe-ingredients">
            {ingredients.map((ing, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-3 space-y-2"
                data-testid={`add-recipe-ingredient-${idx}`}
              >
                <div className="grid sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="Ingredient*"
                    value={ing.item}
                    onChange={(e) =>
                      updateIngredient(idx, { item: e.target.value })
                    }
                    data-testid={`add-recipe-ingredient-${idx}-item`}
                  />
                  <Input
                    placeholder="Cantitate*"
                    value={ing.quantity}
                    onChange={(e) =>
                      updateIngredient(idx, { quantity: e.target.value })
                    }
                    data-testid={`add-recipe-ingredient-${idx}-quantity`}
                  />
                  <Input
                    placeholder="Unitate de masura"
                    value={ing.unit || ""}
                    onChange={(e) =>
                      updateIngredient(idx, { unit: e.target.value })
                    }
                    data-testid={`add-recipe-ingredient-${idx}-unit`}
                  />
                </div>
                <Input
                  placeholder="Notite (optional)"
                  value={ing.notes || ""}
                  onChange={(e) =>
                    updateIngredient(idx, { notes: e.target.value })
                  }
                  data-testid={`add-recipe-ingredient-${idx}-notes`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  data-testid={`add-recipe-ingredient-${idx}-remove`}
                >
                  Sterge ingredient
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={addIngredient}
              variant="secondary"
              data-testid="add-recipe-add-ingredient"
            >
              Adauga ingredient
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h2
            className="text-xl font-medium mb-2"
            data-testid="add-recipe-instructions-title"
          >
            Instructiuni
          </h2>
          <div className="space-y-3" data-testid="add-recipe-instructions">
            {instructions.map((ins, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-3 space-y-2"
                data-testid={`add-recipe-instruction-${idx}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm w-8">
                    #{ins.stepNumber}
                  </span>
                  <Input
                    placeholder="Descriere pas*"
                    value={ins.description}
                    onChange={(e) =>
                      updateInstruction(idx, { description: e.target.value })
                    }
                    data-testid={`add-recipe-instruction-${idx}-description`}
                  />
                </div>
                <Input
                  placeholder="Secret (optional)"
                  value={ins.tips || ""}
                  onChange={(e) =>
                    updateInstruction(idx, { tips: e.target.value })
                  }
                  data-testid={`add-recipe-instruction-${idx}-tips`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => removeInstruction(idx)}
                  data-testid={`add-recipe-instruction-${idx}-remove`}
                >
                  Sterge instructiune
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={addInstruction}
              variant="secondary"
              data-testid="add-recipe-add-step"
            >
              Adauga pas
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-xl font-medium mb-2">Categorii</h2>
          <div
            className="flex flex-wrap gap-2"
            data-testid="add-recipe-categories"
          >
            {categories.map((c) => {
              const selected = selectedCats.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(c.slug)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground border-transparent shadow"
                      : "bg-transparent text-muted-foreground border-border hover:bg-secondary hover:text-secondary-foreground"
                  }`}
                  data-testid={`add-recipe-category-${c.slug}`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Media */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="block mb-2">Imaginea principala</Label>
            <FileInput
              files={coverFile ? [coverFile] : []}
              onChange={(files) => setCoverFile(files[0] || null)}
              accept="image/*"
              containerTestId="add-recipe-cover-container"
              buttonTestId="add-recipe-cover-choose"
              fileItemTestIdPrefix="add-recipe-cover-file"
            />
          </div>
          <div>
            <Label className="block mb-2">Imagini pentru galerie</Label>
            <FileInput
              multiple
              files={galleryFiles}
              onChange={(files) => setGalleryFiles(files)}
              accept="image/*"
              containerTestId="add-recipe-gallery-container"
              buttonTestId="add-recipe-gallery-choose"
              fileItemTestIdPrefix="add-recipe-gallery-file"
            />
          </div>
        </div>

         <div className="flex gap-2">
           <Button onClick={onSubmit} disabled={loading} data-testid="add-recipe-submit">
             {loading ? (
               <>
                 <Loader className="animate-spin h-4 w-4 mr-2" />
                 Se creeaza...
               </>
             ) : (
               "Creeaza Reteta"
             )}
           </Button>
           <Button
             variant="outline"
             onClick={() => navigate("/")}
             data-testid="add-recipe-cancel"
           >
             Anuleaza
           </Button>
         </div>
      </div>
    </div>
  );
};

export default AddRecipe;
