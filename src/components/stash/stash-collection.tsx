"use client";

import { useState, useTransition } from "react";
import { CheckSquare, Loader2 } from "lucide-react";

import { deleteEntries } from "@/app/actions/delete-entries";
import { StashCardPolaroid } from "@/components/stash/stash-card-polaroid";
import { StashFilterControls } from "@/components/stash/stash-filter-controls";
import { StashTimelineRow } from "@/components/stash/stash-timeline-row";
import { StashViewSwitcher } from "@/components/stash/stash-view-switcher";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAddStashModal } from "@/context/add-stash-modal-context";
import type { Entry } from "@/generated/prisma/client";
import type { SortOption } from "@/types/sort";
import type { ViewMode } from "@/types/view-mode";

interface StashCollectionProps {
  entries: Entry[];
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (favoritesOnly: boolean) => void;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  onEntrySelect: (entry: Entry) => void;
}

export function StashCollection({
  entries,
  sort,
  onSortChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  viewMode,
  onViewModeChange,
  onEntrySelect,
}: StashCollectionProps) {
  const { notifyBulkDeleted } = useAddStashModal();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [isBulkDeleting, startBulkDeleteTransition] = useTransition();

  // No explicit filter-change handling needed here: StashCollectionContainer
  // unmounts this component (swapping in a loading skeleton) on every
  // activeFilter change before this component ever sees the new filter, so
  // selectionMode/selectedIds are naturally reset by the remount.

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
    onEntrySelect(entry);
  }

  function handleSelectAll() {
    setSelectedIds(new Set(entries.map((entry) => entry.id)));
  }

  function handleCancelSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function handleDeleteSelected() {
    setBulkDeleteError(null);
    setConfirmBulkDeleteOpen(true);
  }

  function handleConfirmBulkDelete() {
    setBulkDeleteError(null);
    startBulkDeleteTransition(async () => {
      const result = await deleteEntries(Array.from(selectedIds));
      if (!result.success) {
        setBulkDeleteError(result.error);
        return;
      }
      notifyBulkDeleted(result.deletedCount);
      setConfirmBulkDeleteOpen(false);
      setSelectionMode(false);
      setSelectedIds(new Set());
    });
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
          <StashFilterControls
            sort={sort}
            onSortChange={onSortChange}
            favoritesOnly={favoritesOnly}
            onFavoritesOnlyChange={onFavoritesOnlyChange}
          />
          <StashViewSwitcher value={viewMode} onChange={onViewModeChange} />
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

      <AlertDialog open={confirmBulkDeleteOpen} onOpenChange={setConfirmBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} entries?</AlertDialogTitle>
            <AlertDialogDescription>
              These entries will be permanently deleted. This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkDeleteError && (
            <p role="alert" className="text-sm text-destructive">
              {bulkDeleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Deleting&hellip;
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
