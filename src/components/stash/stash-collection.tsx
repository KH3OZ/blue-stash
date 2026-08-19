"use client";

import { useState } from "react";
import { CheckSquare } from "lucide-react";

import { EntryDetailModal } from "@/components/stash/entry-detail-modal";
import { StashCardPolaroid } from "@/components/stash/stash-card-polaroid";
import { StashTimelineRow } from "@/components/stash/stash-timeline-row";
import { StashViewSwitcher } from "@/components/stash/stash-view-switcher";
import { Button } from "@/components/ui/button";
import { useCategoryFilter } from "@/context/category-filter-context";
import type { Entry } from "@/generated/prisma/client";
import { DEFAULT_VIEW_MODE, type ViewMode } from "@/types/view-mode";

interface StashCollectionProps {
  entries: Entry[];
}

export function StashCollection({ entries }: StashCollectionProps) {
  const { activeFilter } = useCategoryFilter();
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear any selection when the active category filter changes, since the
  // previously-selected entries may no longer be part of what's rendered.
  const [prevFilter, setPrevFilter] = useState(activeFilter);
  if (activeFilter !== prevFilter) {
    setPrevFilter(activeFilter);
    if (selectedIds.size > 0) setSelectedIds(new Set());
  }

  function handleCardClick(entry: Entry) {
    if (selectionMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(entry.id)) {
          next.delete(entry.id);
        } else {
          next.add(entry.id);
        }
        return next;
      });
      return;
    }
    setSelectedEntry(entry);
    setDetailOpen(true);
  }

  function handleSelectAll() {
    setSelectedIds(new Set(entries.map((entry) => entry.id)));
  }

  function handleCancelSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function handleDeleteSelected() {
    console.log(Array.from(selectedIds));
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {selectionMode ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={handleCancelSelection}
              className="text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setSelectionMode(true)}>
            <CheckSquare className="size-4" aria-hidden="true" />
            Select
          </Button>
        )}

        <div className="flex items-center gap-2">
          {selectionMode && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={handleDeleteSelected}
            >
              Delete selected
            </Button>
          )}
          <StashViewSwitcher value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === "timeline" ? (
        <div className="flex flex-col">
          {entries.map((entry) => (
            <StashTimelineRow
              key={entry.id}
              entry={entry}
              onSelect={handleCardClick}
              selectionMode={selectionMode}
              selected={selectedIds.has(entry.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, index) => (
            <StashCardPolaroid
              key={entry.id}
              entry={entry}
              index={index}
              onSelect={handleCardClick}
              selectionMode={selectionMode}
              selected={selectedIds.has(entry.id)}
            />
          ))}
        </div>
      )}

      <EntryDetailModal entry={selectedEntry} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
