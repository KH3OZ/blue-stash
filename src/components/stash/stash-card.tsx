import { ExternalLink, Star } from "lucide-react";

import { CATEGORY_ICONS, CATEGORY_LABELS, type Category } from "@/types/category";
import type { Entry } from "@/generated/prisma/client";

interface StashCardProps {
  entry: Entry;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function StashCard({ entry }: StashCardProps) {
  // entry.category resolves through Prisma's generated `DefaultSelection` mapped
  // type, which TS can't narrow inline for Record indexing — cast to the app's
  // own Category union (same runtime values) to avoid an implicit-any error.
  const category = entry.category as Category;
  const CategoryIcon = CATEGORY_ICONS[category];
  const ratingScale = entry.rating !== null && entry.rating > 5 ? 10 : 5;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/40">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-foreground/5">
        {entry.coverUrl ? (
          <img
            src={entry.coverUrl}
            alt={entry.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
            <CategoryIcon className="size-10 text-foreground/25" />
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

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <CategoryIcon className="size-3.5" aria-hidden="true" />
          <span>{CATEGORY_LABELS[category]}</span>
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
          {entry.title}
        </h3>

        {entry.rating !== null && (
          <div className="flex items-center gap-1 text-sm text-foreground">
            <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
            <span>
              {entry.rating}/{ratingScale}
            </span>
          </div>
        )}

        {entry.shortTake && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{entry.shortTake}</p>
        )}

        {entry.date && (
          <time
            dateTime={entry.date.toISOString()}
            className="mt-auto pt-1 text-xs text-muted-foreground"
          >
            {dateFormatter.format(entry.date)}
          </time>
        )}

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {entry.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-highlight px-2.5 py-0.5 text-xs font-medium text-highlight-foreground"
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
