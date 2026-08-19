"use client";

import { Heart } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SORT_LABELS, type SortOption } from "@/types/sort";

const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

interface StashFilterControlsProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (favoritesOnly: boolean) => void;
}

export function StashFilterControls({
  sort,
  onSortChange,
  favoritesOnly,
  onFavoritesOnlyChange,
}: StashFilterControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={sort} onValueChange={(value) => onSortChange(value as SortOption)}>
        <SelectTrigger aria-label="Sort by" className="w-36 rounded-full border-border bg-background">
          <SelectValue>{(value: SortOption) => SORT_LABELS[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className="border border-border bg-background">
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {SORT_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        aria-pressed={favoritesOnly}
        aria-label="Show favorites only"
        onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          favoritesOnly
            ? "border-transparent bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:text-foreground"
        )}
      >
        <Heart className={cn("size-4", favoritesOnly && "fill-current")} aria-hidden="true" />
      </button>
    </div>
  );
}
