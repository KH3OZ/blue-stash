"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

import { deleteEntry } from "@/app/actions/delete-entry";
import { cn } from "@/lib/utils";
import { useAddStashModal } from "@/context/add-stash-modal-context";
import type { Entry } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CATEGORY_ICONS, CATEGORY_LABELS, type Category } from "@/types/category";
import { StarRating } from "@/components/stash/star-rating";

interface EntryDetailModalProps {
  entry: Entry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function EntryDetailModal({ entry, open, onOpenChange }: EntryDetailModalProps) {
  const { openEditModal, notifyDeleted } = useAddStashModal();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  if (!entry) return null;

  function handleConfirmDelete() {
    if (!entry) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteEntry(entry.id);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      notifyDeleted(entry.title);
      setConfirmDeleteOpen(false);
      onOpenChange(false);
    });
  }

  const category = entry.category as Category;
  const CategoryIcon = CATEGORY_ICONS[category];

  return (
    <>
    <Dialog open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)}>
      <DialogContent className="scrollbar-hidden flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{entry.title}</DialogTitle>
        </DialogHeader>

        <div className="-mx-6 -mt-6 flex max-h-80 shrink-0 items-center justify-center overflow-hidden rounded-t-4xl bg-foreground/5">
          {entry.coverUrl ? (
            <img
              src={entry.coverUrl}
              alt={entry.title}
              className="max-h-80 w-full object-contain"
            />
          ) : (
            <div className="flex h-56 w-full items-center justify-center" aria-hidden="true">
              <CategoryIcon className="size-14 text-foreground/20" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium tracking-wide text-primary-foreground uppercase">
              <CategoryIcon className="size-3" aria-hidden="true" />
              {CATEGORY_LABELS[category]}
            </span>

            <h2 className="text-lg font-semibold text-foreground">{entry.title}</h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {entry.date && (
                <time dateTime={entry.date.toISOString()}>
                  {dateFormatter.format(entry.date)}
                  {" · "}
                  {timeFormatter.format(entry.createdAt)}
                </time>
              )}
              {entry.rating !== null && (
                <div aria-label={`Rating: ${entry.rating} out of 10`}>
                  <StarRating value={entry.rating} readOnly size="sm" />
                </div>
              )}
            </div>
          </div>

          {entry.shortTake && (
            <p className="text-sm font-medium text-foreground">{entry.shortTake}</p>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Deep Reflection</span>
            {entry.deepReflection ? (
              <div
                className={cn(
                  "rounded-2xl border border-border bg-input/50 px-3 py-2 text-sm text-foreground",
                  "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5",
                  "[&_strong]:font-semibold [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold",
                  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs"
                )}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{entry.deepReflection}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reflection added yet.</p>
            )}
          </div>

          {entry.externalLink && (
            <a
              href={entry.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {hostnameOf(entry.externalLink)}
            </a>
          )}

          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="border-2 border-foreground text-foreground transition-colors hover:border-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => {
              setDeleteError(null);
              setConfirmDeleteOpen(true);
            }}
          >
            Delete
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              openEditModal(entry);
            }}
          >
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{entry.title}&rdquo; will be permanently deleted. This can&rsquo;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteError && (
          <p role="alert" className="text-sm text-destructive">
            {deleteError}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? (
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
    </>
  );
}
