"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/get-current-user";
import type { Entry, MediaType, Prisma } from "@/generated/prisma/client";
import type { NavFilter } from "@/types/category";
import { DEFAULT_SORT, type SortOption } from "@/types/sort";

export type EntryWithMediaKind = Entry & { mediaKind: MediaType | null };

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
}: GetEntriesParams): Promise<EntryWithMediaKind[]> {
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

  const orderBy: Prisma.EntryOrderByWithRelationInput[] | undefined =
    sort === "RATING"
      ? [{ rating: { sort: "desc", nulls: "last" } }]
      : sort === "NEWEST"
        ? [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]
        : sort === "OLDEST"
          ? [{ date: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }]
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

  // For entries with no cover image, look up whether they have video/audio
  // media so the wall view can show a type-specific icon instead of the
  // generic category icon. Cheap: only queried for coverless entries.
  const coverlessIds = entries.filter((entry) => !entry.coverUrl).map((entry) => entry.id);
  const mediaKindByEntryId = new Map<string, MediaType>();
  if (coverlessIds.length > 0) {
    const firstMedia = await prisma.entryMedia.findMany({
      where: { entryId: { in: coverlessIds }, userId, type: { in: ["VIDEO", "AUDIO"] } },
      orderBy: { position: "asc" },
      distinct: ["entryId"],
      select: { entryId: true, type: true },
    });
    for (const item of firstMedia) {
      mediaKindByEntryId.set(item.entryId, item.type);
    }
  }

  return entries.map((entry) => ({ ...entry, mediaKind: mediaKindByEntryId.get(entry.id) ?? null }));
}
