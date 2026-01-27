import { cn } from "@/lib/utils";

interface CategoryType {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  selected: string;
  onSelect: (categoryId: string) => void;
  categories?: CategoryType[]; // optional, will fall back to built-in list
}

export function CategoryFilter({
  selected,
  onSelect,
  categories,
}: CategoryFilterProps) {
  const list =
    categories && categories.length > 0
      ? categories
      : [
          {
            id: "all",
            name: "Toate retetele",
            slug: "all",
          },
        ];

  return (
    <div
      className="flex flex-wrap justify-center gap-2 mb-8"
      data-testid="category-filter-list"
    >
      {list.map((category) => (
        <button
          key={category.slug}
          onClick={() => onSelect(category.slug)}
          data-testid={`category-filter-${category.slug}-button`}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            selected === category.slug
              ? "bg-primary text-primary-foreground shadow-soft"
              : "bg-card text-muted-foreground hover:bg-secondary hover:text-secondary-foreground border border-border"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
