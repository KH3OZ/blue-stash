"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/get-current-user";
import type { Entry, Prisma } from "@/generated/prisma/client";
import type { NavFilter } from "@/types/category";
import { DEFAULT_SORT, type SortOption } from "@/types/sort";

export type GetEntriesParams = {
  category: NavFilter;
  search?: string;
  sort?: SortOption;
  favoritesOnly?: boolean;
};

export async function getEntries({
  category,
  search = "",
  sort = DEFAULT_SORT,
  favoritesOnly = false,
}: GetEntriesParams): Promise<Entry[]> {
  let userId: string;
  try {
    userId = await getCurrentUserId();
  } catch {
    return [];
  }

  const where: Prisma.EntryWhereInput = {
    userId,
    ...(category === "ALL" ? undefined : { category }),
    ...(favoritesOnly ? { favorite: true } : undefined),
  };

  const orderBy: Prisma.EntryOrderByWithRelationInput | undefined =
    sort === "RATING"
      ? { rating: { sort: "desc", nulls: "last" } }
      : sort === "NEWEST"
        ? { date: { sort: "desc", nulls: "last" } }
        : sort === "OLDEST"
          ? { date: { sort: "asc", nulls: "last" } }
          : undefined;

  let entries = await prisma.entry.findMany({ where, orderBy });

  const trimmedSearch = search.trim().toLowerCase();
  if (trimmedSearch) {
    const MIN_TITLE_SEARCH_LENGTH = 2;
    entries = entries.filter(
      (entry) =>
        (trimmedSearch.length >= MIN_TITLE_SEARCH_LENGTH &&
          entry.title.toLowerCase().includes(trimmedSearch)) ||
        entry.tags.some((tag) => tag.toLowerCase() === trimmedSearch),
    );
  }

  if (sort === "ALPHABETICAL") {
    entries = entries.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
  }

  return entries;
}
