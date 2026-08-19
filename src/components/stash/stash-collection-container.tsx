"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive } from "lucide-react";

import { getEntries } from "@/app/actions/get-entries";
import { getEntry } from "@/app/actions/get-entry";
import { EntryDetailModal } from "@/components/stash/entry-detail-modal";
import { StashCollection } from "@/components/stash/stash-collection";
import { StashFilterControls } from "@/components/stash/stash-filter-controls";
import { StashViewSwitcher } from "@/components/stash/stash-view-switcher";
import { useAddStashModal } from "@/context/add-stash-modal-context";
import { useCategoryFilter } from "@/context/category-filter-context";
import { useSearch } from "@/context/search-context";
import type { Entry } from "@/generated/prisma/client";
import type { NavFilter } from "@/types/category";
import { DEFAULT_SORT, type SortOption } from "@/types/sort";
import { DEFAULT_VIEW_MODE, type ViewMode } from "@/types/view-mode";

function StashSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="aspect-4/5 animate-pulse rounded-md bg-foreground/5" />
      ))}
    </div>
  );
}

export function StashCollectionContainer() {
  const { activeFilter } = useCategoryFilter();
  const { query } = useSearch();
  const { refreshToken, notifyError } = useAddStashModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loadedFilter, setLoadedFilter] = useState<NavFilter | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Read via a ref inside the deep-link effect below so that effect only
  // depends on searchParams — a grid refetch (e.g. sort change) landing
  // mid-resolution shouldn't re-trigger it.
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  if (activeFilter !== loadedFilter && entries !== null) {
    setEntries(null);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    getEntries({ category: activeFilter, search: debouncedSearch, sort, favoritesOnly }).then((result) => {
      if (cancelled) return;
      setEntries(result);
      setLoadedFilter(activeFilter);
    });

    return () => {
      cancelled = true;
    };
    // refreshToken isn't read here — it's a pure signal bumped after a
    // successful save so this effect re-fetches even though activeFilter
    // didn't change (e.g. saving via the header button while on /wall).
  }, [activeFilter, debouncedSearch, sort, favoritesOnly, refreshToken]);

  // Deep link support: /wall?entry=<id> opens the detail modal for that
  // entry — fetching it directly if it's not in the currently loaded/
  // filtered grid (filters stay as-is; the entry may be hidden behind
  // them) — then strips the param so it's a one-shot trigger, not
  // persistent state that reopens on refresh or back navigation.
  useEffect(() => {
    const entryId = searchParams.get("entry");
    if (!entryId) return;

    let cancelled = false;

    async function resolve() {
      const localMatch = entriesRef.current?.find((entry) => entry.id === entryId) ?? null;
      if (localMatch) {
        if (!cancelled) {
          setSelectedEntry(localMatch);
          setDetailOpen(true);
        }
      } else {
        const result = await getEntry(entryId as string);
        if (cancelled) return;
        if (result.success) {
          setSelectedEntry(result.entry);
          setDetailOpen(true);
        } else {
          notifyError(result.error);
        }
      }

      if (!cancelled) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("entry");
        const queryString = params.toString();
        router.replace(queryString ? `/wall?${queryString}` : "/wall", { scroll: false });
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, notifyError]);

  const toolbar = (
    <div className="mb-5 flex items-center justify-end gap-2">
      <StashFilterControls
        sort={sort}
        onSortChange={setSort}
        favoritesOnly={favoritesOnly}
        onFavoritesOnlyChange={setFavoritesOnly}
      />
      <StashViewSwitcher value={viewMode} onChange={setViewMode} />
    </div>
  );

  let content: ReactNode;

  if (entries === null) {
    content = (
      <div>
        {toolbar}
        <StashSkeleton />
      </div>
    );
  } else if (entries.length === 0) {
    let message: string;
    if (debouncedSearch) {
      message = `No matches for "${debouncedSearch}".`;
    } else if (favoritesOnly) {
      message = "No favorites yet.";
    } else if (activeFilter !== "ALL") {
      message = "Nothing in this category yet.";
    } else {
      message = "No stashes yet.";
    }

    content = (
      <div>
        {toolbar}
        <div
          role="status"
          className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground"
        >
          <Archive className="size-8" aria-hidden="true" />
          <p className="text-sm">{message}</p>
        </div>
      </div>
    );
  } else {
    content = (
      <StashCollection
        entries={entries}
        sort={sort}
        onSortChange={setSort}
        favoritesOnly={favoritesOnly}
        onFavoritesOnlyChange={setFavoritesOnly}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onEntrySelect={(entry) => {
          setSelectedEntry(entry);
          setDetailOpen(true);
        }}
      />
    );
  }

  return (
    <>
      {content}
      <EntryDetailModal entry={selectedEntry} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}
