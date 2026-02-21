import React from "react";
import { cn } from "@/lib/utils";

interface Props {
  id: string | number;
  name: string;
  link: string;
  shortDescription?: string;
  className?: string;
}

export function ExternalRecipeCard({ id, name, link, shortDescription, className }: Props) {
  return (
    <article
      data-testid={`external-recipe-card-${id}`}
      className={cn(
        "w-full rounded-xl bg-card p-6 shadow-md flex flex-col",
        className,
      )}
    >
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      {shortDescription && <p className="text-sm mb-4">{shortDescription}</p>}
      <div className="mt-auto">
        <a
          data-testid={`external-recipe-link-${id}`}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          Open recipe
        </a>
      </div>
    </article>
  );
}
