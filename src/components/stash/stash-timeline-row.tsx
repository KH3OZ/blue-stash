import { Check, ExternalLink, Heart, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { CATEGORY_ICONS, CATEGORY_LABELS, type Category } from "@/types/category";
import type { Entry } from "@/generated/prisma/client";

interface StashTimelineRowProps {
  entry: Entry;
  onSelect: (entry: Entry) => void;
  selectionMode?: boolean;
  selected?: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function StashTimelineRow({
  entry,
  onSelect,
  selectionMode = false,
  selected = false,
}: StashTimelineRowProps) {
  const category = entry.category as Category;
  const CategoryIcon = CATEGORY_ICONS[category];
  const { favorite, toggle } = useFavoriteToggle(entry.id, entry.favorite, entry.title);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selectionMode ? selected : undefined}
      aria-label={
        selectionMode
          ? `${selected ? "Deselect" : "Select"} ${entry.title}`
          : `View details for ${entry.title}`
      }
      onClick={() => onSelect(entry)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(entry);
        }
      }}
      className="group flex cursor-pointer items-center gap-4 border-b border-border py-4 transition-transform duration-200 last:border-b-0 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {selectionMode && (
        <div
          aria-hidden="true"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-transparent"
          )}
        >
          <Check className="size-4" />
        </div>
      )}

      <span className="w-14 shrink-0 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {entry.date ? dateFormatter.format(entry.date) : "—"}
      </span>

      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-foreground/5">
        {entry.coverUrl ? (
          <img
            src={entry.coverUrl}
            alt={entry.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
            <CategoryIcon className="size-6 text-foreground/20" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">{entry.title}</h3>
          {entry.externalLink && (
            <a
              href={entry.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open external link for ${entry.title}`}
              onClick={(event) => event.stopPropagation()}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        <p className="truncate text-xs text-muted-foreground">
          {CATEGORY_LABELS[category]}
          {entry.shortTake ? ` · ${entry.shortTake}` : ""}
        </p>

        {entry.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {entry.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-highlight px-2 py-0.5 text-[10.5px] font-medium text-highlight-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {entry.rating !== null && (
          <span className="flex items-center gap-1 text-xs text-foreground">
            <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
            {entry.rating}/5
          </span>
        )}

        {!selectionMode && (
          <button
            type="button"
            aria-pressed={favorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={(event) => {
              event.stopPropagation();
              toggle();
            }}
            onKeyDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Heart
              className={cn("size-4", favorite ? "fill-primary text-primary" : "")}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </article>
  );
}
