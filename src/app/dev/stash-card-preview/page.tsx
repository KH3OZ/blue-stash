"use client";

// Dev-only verification route for StashCard (Phase 3.1). Safe to delete, or keep for Phase 3.3.
import { useState } from "react";

import { EntryDetailModal } from "@/components/stash/entry-detail-modal";
import { StashCollection } from "@/components/stash/stash-collection";
import type { Entry } from "@/generated/prisma/client";
import { DEFAULT_SORT, type SortOption } from "@/types/sort";
import { DEFAULT_VIEW_MODE, type ViewMode } from "@/types/view-mode";

const mockEntriesBase: Omit<Entry, "userId">[] = [
  {
    id: "1",
    title: "Arcane Season 2 — the finale hit harder than expected",
    category: "VIDEO",
    rating: 8,
    coverUrl: "https://picsum.photos/seed/arcane/600/450",
    externalLink: "https://example.com",
    date: new Date("2026-08-10"),
    shortTake: "Gorgeous animation, bittersweet ending. Worth the wait.",
    deepReflection: null,
    tags: ["animation", "sci-fi", "netflix"],
    favorite: false,
  },
  {
    id: "2",
    title: "Project Hail Mary",
    category: "READING",
    rating: 4,
    coverUrl: null,
    externalLink: null,
    date: new Date("2026-07-22"),
    shortTake: "Andy Weir does it again — funny, tense, genuinely moving.",
    deepReflection: null,
    tags: ["sci-fi", "book-club"],
    favorite: false,
  },
  {
    id: "3",
    title: "Baldur's Gate 3 — Act 2 run",
    category: "GAMING",
    rating: null,
    coverUrl: "https://picsum.photos/seed/bg3/600/450",
    externalLink: null,
    date: new Date("2026-08-01"),
    shortTake: "Still deciding if I romance the vampire or the druid.",
    deepReflection: null,
    tags: ["rpg", "co-op", "long-haul", "steam"],
    favorite: false,
  },
  {
    id: "4",
    title: "Late Night Radio — Episode 214",
    category: "AUDIO",
    rating: 9,
    coverUrl: "https://picsum.photos/seed/radio/600/450",
    externalLink: "https://example.com/episode-214",
    date: new Date("2026-08-15"),
    shortTake: null,
    deepReflection: null,
    tags: ["podcast"],
    favorite: false,
  },
  {
    id: "5",
    title: "Beach day with the whole crew",
    category: "LIFE_MOMENTS",
    rating: 5,
    coverUrl: "https://picsum.photos/seed/beach/600/450",
    externalLink: null,
    date: new Date("2026-08-16"),
    shortTake: "Perfect weather, terrible sunburn, worth it.",
    deepReflection: null,
    tags: ["friends", "summer", "beach", "roadtrip", "memories", "2026"],
    favorite: false,
  },
  {
    id: "6",
    title: "Local Jazz Festival",
    category: "EVENTS",
    rating: 7,
    coverUrl: "https://picsum.photos/seed/jazz/600/450",
    externalLink: "https://example.com/jazz-fest",
    date: new Date("2026-08-05"),
    shortTake: "Discovered a new favorite trio in the side tent.",
    deepReflection: null,
    tags: ["live-music", "jazz"],
    favorite: false,
  },
  {
    id: "7",
    title: "Untitled draft — everything empty",
    category: "FILMS",
    rating: null,
    coverUrl: null,
    externalLink: null,
    date: null,
    shortTake: null,
    deepReflection: null,
    tags: [],
    favorite: false,
  },
];

const mockEntries: Entry[] = mockEntriesBase.map((entry) => ({
  ...entry,
  userId: "00000000-0000-0000-0000-000000000000",
}));

export default function StashCardPreviewPage() {
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6 sm:p-10">
      <h1 className="mb-6 text-xl font-semibold text-foreground">
        StashCard preview — {mockEntries.length} mock entries
      </h1>
      <StashCollection
        entries={mockEntries}
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
      <EntryDetailModal entry={selectedEntry} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
