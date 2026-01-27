import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Search recipes...",
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        onSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch]);

  return (
    <div
      className={cn("relative w-full max-w-xl", className)}
      data-testid="search-bar-container"
    >
      <div
        className={cn(
          "relative flex items-center bg-card rounded-xl border-2 transition-all duration-300",
          isFocused
            ? "border-primary shadow-soft"
            : "border-border hover:border-primary/30"
        )}
        data-testid="search-bar-wrapper"
      >
        <Search
          className={cn(
            "absolute left-4 w-5 h-5 transition-colors duration-200",
            isFocused ? "text-primary" : "text-muted-foreground"
          )}
          data-testid="search-bar-icon"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-12 pr-12 py-4 bg-transparent",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none",
            "font-body text-base"
          )}
          data-testid="search-bar-input"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Clear search"
            data-testid="search-bar-clear-button"
          >
            <X
              className="w-4 h-4 text-muted-foreground"
              data-testid="search-bar-clear-icon"
            />
          </button>
        )}
      </div>
    </div>
  );
}
