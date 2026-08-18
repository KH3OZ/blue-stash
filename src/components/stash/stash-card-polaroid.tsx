import { ExternalLink, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { CATEGORY_ICONS, CATEGORY_LABELS, type Category } from "@/types/category";
import type { Entry } from "@/generated/prisma/client";

interface StashCardPolaroidProps {
  entry: Entry;
  index: number;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

// Deterministic per-index tilt (not Math.random) so server and client render
// the same rotation and hydration doesn't mismatch.
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export function StashCardPolaroid({ entry, index }: StashCardPolaroidProps) {
  const category = entry.category as Category;
  const CategoryIcon = CATEGORY_ICONS[category];
  const ratingScale = entry.rating !== null && entry.rating > 5 ? 10 : 5;
  const tilt = TILTS[index % TILTS.length];

  return (
    <article
      className={cn(
        "relative bg-card p-3 pb-4 shadow-md transition-transform duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-xl dark:shadow-black/30",
        tilt
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -top-1.5 -left-1.5 z-10 flex rotate-45 flex-col items-center drop-shadow-sm"
      >
        <span className="size-2.5 rounded-full bg-primary" />
        <span className="h-2.5 w-0.5 bg-primary/80" />
      </div>

      <div className="relative aspect-square w-full overflow-hidden bg-foreground/5">
        {entry.coverUrl ? (
          <img
            src={entry.coverUrl}
            alt={entry.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
            <CategoryIcon className="size-9 text-foreground/20" />
          </div>
        )}

        {entry.externalLink && (
          <a
            href={entry.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open external link for ${entry.title}`}
            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 pt-3 text-center">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-primary uppercase">
          {CATEGORY_LABELS[category]}
        </span>

        <h3 className="line-clamp-2 text-sm font-semibold text-foreground italic">{entry.title}</h3>

        {(entry.rating !== null || entry.date) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {entry.rating !== null && (
              <span className="flex items-center gap-1 text-foreground">
                <Star className="size-3 fill-primary text-primary" aria-hidden="true" />
                {entry.rating}/{ratingScale}
              </span>
            )}
            {entry.date && (
              <time dateTime={entry.date.toISOString()}>{dateFormatter.format(entry.date)}</time>
            )}
          </div>
        )}

        {entry.shortTake && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{entry.shortTake}</p>
        )}

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {entry.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-highlight px-2 py-0.5 text-[11px] font-medium text-highlight-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
