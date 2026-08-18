"use client";

import { useEffect, useState } from "react";
import { Archive } from "lucide-react";

import { getEntries } from "@/app/actions/get-entries";
import { StashCollection } from "@/components/stash/stash-collection";
import { useCategoryFilter } from "@/context/category-filter-context";
import type { Entry } from "@/generated/prisma/client";
import type { NavFilter } from "@/types/category";

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
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [loadedFilter, setLoadedFilter] = useState<NavFilter | null>(null);

  if (activeFilter !== loadedFilter && entries !== null) {
    setEntries(null);
  }

  useEffect(() => {
    let cancelled = false;

    getEntries(activeFilter).then((result) => {
      if (cancelled) return;
      setEntries(result);
      setLoadedFilter(activeFilter);
    });

    return () => {
      cancelled = true;
    };
  }, [activeFilter]);

  if (entries === null) {
    return <StashSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground"
      >
        <Archive className="size-8" aria-hidden="true" />
        <p className="text-sm">
          {activeFilter === "ALL" ? "No stashes yet." : "Nothing in this category yet."}
        </p>
      </div>
    );
  }

  return <StashCollection entries={entries} />;
}
