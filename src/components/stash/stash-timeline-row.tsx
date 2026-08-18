import { ExternalLink, Star } from "lucide-react";

import { CATEGORY_ICONS, CATEGORY_LABELS, type Category } from "@/types/category";
import type { Entry } from "@/generated/prisma/client";

interface StashTimelineRowProps {
  entry: Entry;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function StashTimelineRow({ entry }: StashTimelineRowProps) {
  const category = entry.category as Category;
  const CategoryIcon = CATEGORY_ICONS[category];
  const ratingScale = entry.rating !== null && entry.rating > 5 ? 10 : 5;

  return (
    <article className="group flex items-center gap-4 border-b border-border py-4 transition-transform duration-200 last:border-b-0 hover:-translate-y-0.5">
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

      {entry.rating !== null && (
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-foreground">
          <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
          {entry.rating}/{ratingScale}
        </span>
      )}
    </article>
  );
}
