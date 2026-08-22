"use client";

import { useEffect, useState, useTransition } from "react";
import { ExternalLink, Loader2, Music } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

import { deleteEntry } from "@/app/actions/delete-entry";
import { getEntryMedia } from "@/app/actions/get-entry-media";
import { cn } from "@/lib/utils";
import { useAddStashModal } from "@/context/add-stash-modal-context";
import type { Entry, MediaType } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
  const [mediaRecord, setMediaRecord] = useState<{
    entryId: string;
    items: { url: string; type: MediaType }[];
  } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const entryId = entry?.id ?? null;
  useEffect(() => {
    if (!open || !entryId) return;
    let cancelled = false;
    getEntryMedia(entryId).then((media) => {
      if (!cancelled) {
        setMediaRecord({ entryId, items: media.map((item) => ({ url: item.url, type: item.type })) });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, entryId]);

  if (!entry) return null;

  // Multi-media entries use the EntryMedia table (fetched above, keyed by
  // entryId to avoid showing a stale entry's media); entries created before
  // multi-media support fall back to the single coverUrl (always an image).
  const entryMediaItems = mediaRecord?.entryId === entryId ? mediaRecord.items : [];
  const displayMedia =
    entryMediaItems.length > 0
      ? entryMediaItems
      : entry.coverUrl
        ? [{ url: entry.coverUrl, type: "IMAGE" as MediaType }]
        : [];

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

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
  const entryTitle = entry.title;

  function renderMediaItem(item: { url: string; type: MediaType }, index: number) {
    if (item.type === "IMAGE") {
      return (
        <button
          type="button"
          onClick={() => openLightbox(index)}
          aria-label={
            displayMedia.length > 1
              ? `View full-size image ${index + 1} of ${displayMedia.length} for ${entryTitle}`
              : `View full-size image for ${entryTitle}`
          }
          className="flex max-h-80 w-full cursor-zoom-in items-center justify-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          <img src={item.url} alt={entryTitle} className="max-h-80 w-full object-contain" />
        </button>
      );
    }

    if (item.type === "VIDEO") {
      return <video controls src={item.url} className="max-h-80 w-full object-contain" />;
    }

    return (
      <div className="flex h-56 w-full flex-col items-center justify-center gap-3 px-8">
        <Music className="size-10 text-foreground/30" aria-hidden="true" />
        <audio controls src={item.url} className="w-full" />
      </div>
    );
  }

  return (
    <>
    <Dialog open={open} onOpenChange={(nextOpen) => onOpenChange(nextOpen)}>
      <DialogContent className="scrollbar-hidden flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{entry.title}</DialogTitle>
        </DialogHeader>

        <div className="-mx-6 -mt-6 max-h-80 shrink-0 overflow-hidden rounded-t-4xl bg-foreground/5">
          {displayMedia.length > 1 ? (
            <Carousel className="w-full">
              <CarouselContent className="ml-0">
                {displayMedia.map((item, index) => (
                  <CarouselItem
                    key={item.url + index}
                    className="pl-0"
                    aria-label={`Item ${index + 1} of ${displayMedia.length}`}
                  >
                    {renderMediaItem(item, index)}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 border-2 border-foreground bg-secondary text-foreground hover:border-primary hover:text-primary" />
              <CarouselNext className="right-2 border-2 border-foreground bg-secondary text-foreground hover:border-primary hover:text-primary" />
            </Carousel>
          ) : displayMedia.length === 1 ? (
            renderMediaItem(displayMedia[0], 0)
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
                  {entry.date.toDateString() === entry.createdAt.toDateString() && (
                    <>
                      {" · "}
                      {timeFormatter.format(entry.createdAt)}
                    </>
                  )}
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

    {displayMedia[lightboxIndex]?.type === "IMAGE" && (
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-fit max-w-[95vw] gap-0 rounded-none border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-[95vw]"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{entry.title} — full-size image</DialogTitle>
          </DialogHeader>
          <img
            src={displayMedia[lightboxIndex].url}
            alt={entry.title}
            className="max-h-[95vh] max-w-[95vw] object-contain"
          />
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}
