import { ChefHat, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { isAccessGranted } from "@/lib/access";

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAccessGranted());
  }, []);

  return (
    <header
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border"
      data-testid="header"
    >
      <div
        className="container mx-auto px-4 py-4 flex items-center justify-between"
        data-testid="header-container"
      >
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          data-testid="header-logo-link"
        >
          <div
            className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-soft"
            data-testid="header-logo-icon-container"
          >
            <ChefHat
              className="w-5 h-5 text-primary-foreground"
              data-testid="header-chef-hat-icon"
            />
          </div>
          <div data-testid="header-branding">
            <h1
              className="font-display text-xl font-bold text-foreground"
              data-testid="header-title"
            >
              Retete
            </h1>
            <p
              className="text-xs text-muted-foreground"
              data-testid="header-subtitle"
            >
              Pentru iepurasi
            </p>
          </div>
        </Link>

        {isLoggedIn && (
          <Link
            to="/add-recipe"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            title="Add recipe"
            data-testid="header-add-recipe"
          >
            <Plus className="w-4 h-4" /> Adauga reteta
          </Link>
        )}
      </div>
    </header>
  );
}
