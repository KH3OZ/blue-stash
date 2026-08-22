"use client";

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type KeyboardEvent } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { AlertCircle, Film, Loader2, Music, Upload, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

import { createEntry } from "@/app/actions/create-entry";
import { updateEntry } from "@/app/actions/update-entry";
import { getEntryMedia } from "@/app/actions/get-entry-media";
import type { MediaInput } from "@/app/actions/create-entry";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { validateImageFile } from "@/lib/storage/validate-image-file";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from "@/lib/youtube";
import { useAddStashModal } from "@/context/add-stash-modal-context";
import type { Entry, MediaType } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/stash/star-rating";
import {
  Dialog,
  DialogClose,
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
import {
  CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type Category,
} from "@/types/category";

const ALLOWED_COVER_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_COVER_BYTES = 8 * 1024 * 1024;

const ALLOWED_MEDIA_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
};
const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 10;

function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read video metadata."));
    };
    video.src = objectUrl;
  });
}

// Detects an additional-file's kind from its MIME type so it can be routed
// to the right validator + bucket. Returns null for unsupported types.
function classifyFile(file: File): MediaType | null {
  if (file.type in ALLOWED_COVER_TYPES) return "IMAGE";
  if (file.type in ALLOWED_MEDIA_TYPES) return file.type.startsWith("video/") ? "VIDEO" : "AUDIO";
  return null;
}

interface AdditionalMediaItem {
  id: string;
  kind: MediaType | "UNKNOWN";
  status: "uploading" | "done" | "error";
  url?: string;
  previewUrl?: string;
  fileName: string;
  error?: string;
}

const SHORT_TAKE_WORD_LIMIT = 20;

function countWords(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

const CATEGORY_HEADINGS: Record<Category, string> = {
  VIDEO: "What did you watch?",
  READING: "What did you read?",
  GAMING: "What did you play?",
  AUDIO: "What did you listen to?",
  LIFE_MOMENTS: "What moment are you keeping?",
  EVENTS: "What did you go to?",
  FILMS: "What film did you catch?",
};

function todayIso() {
  const now = new Date();
  const localMidnight = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localMidnight.toISOString().slice(0, 10);
}

function toIsoDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

interface EntrySnapshot {
  title: string;
  category: Category;
  rating: number | null;
  coverUrl: string | null;
  externalLink: string | null;
  date: string;
  shortTake: string | null;
  deepReflection: string | null;
  tags: string[];
  additionalMedia: MediaInput[];
}

function snapshotFromEntry(entry: Entry): EntrySnapshot {
  return {
    title: entry.title.trim(),
    category: entry.category as Category,
    rating: entry.rating,
    coverUrl: entry.coverUrl,
    externalLink: entry.externalLink,
    date: entry.date ? toIsoDate(entry.date) : todayIso(),
    shortTake: entry.shortTake,
    deepReflection: entry.deepReflection,
    tags: entry.tags,
    additionalMedia: [],
  };
}

export interface AddStashEntry {
  title: string;
  category: Category;
  rating: number | null;
  coverUrl: string | null;
  externalLink: string | null;
  date: Date;
  shortTake: string | null;
  deepReflection: string | null;
  tags: string[];
  media: MediaInput[];
}

interface AddStashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  existingEntry?: Entry | null;
  initialShortTake?: string;
  initialCoverUrl?: string;
  initialCategory?: Category;
  onSaved: (entry: Entry) => void;
}

export function AddStashModal({
  open,
  onOpenChange,
  mode = "create",
  existingEntry = null,
  initialShortTake = "",
  initialCoverUrl = "",
  initialCategory = "LIFE_MOMENTS",
  onSaved,
}: AddStashModalProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const additionalFilesInputRef = useRef<HTMLInputElement>(null);
  const { notifyError } = useAddStashModal();
  const [originalSnapshot, setOriginalSnapshot] = useState<EntrySnapshot | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [shortTake, setShortTake] = useState(initialShortTake);
  const [rating, setRating] = useState<number | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [additionalMedia, setAdditionalMedia] = useState<AdditionalMediaItem[]>([]);
  const [externalLink, setExternalLink] = useState("");
  const [date, setDate] = useState(todayIso());
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [deepReflection, setDeepReflection] = useState("");
  const [reflectionMode, setReflectionMode] = useState<"write" | "preview">("write");
  const [dirty, setDirty] = useState(false);
  const [touchedTitle, setTouchedTitle] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();

  // Reseed the form when the modal transitions closed -> open. Adjusting
  // state during render (rather than in an effect) avoids an extra render
  // pass and matches the composer values at the moment the modal opens,
  // without reseeding on every composer keystroke while already open.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      if (mode === "edit" && existingEntry) {
        const snapshot = snapshotFromEntry(existingEntry);
        setOriginalSnapshot(snapshot);
        setTitle(snapshot.title);
        setCategory(snapshot.category);
        setShortTake(snapshot.shortTake ?? "");
        setRating(snapshot.rating);
        setCoverUrl(snapshot.coverUrl ?? "");
        setAdditionalMedia([]);
        setExternalLink(snapshot.externalLink ?? "");
        setDate(snapshot.date);
        setTags(snapshot.tags);
        setDeepReflection(snapshot.deepReflection ?? "");
      } else {
        setOriginalSnapshot(null);
        setTitle("");
        setCategory(initialCategory);
        setShortTake(initialShortTake);
        setRating(null);
        setCoverUrl(initialCoverUrl);
        setAdditionalMedia([]);
        setExternalLink("");
        setDate(todayIso());
        setTags([]);
        setDeepReflection("");
      }
      setTagDraft("");
      setReflectionMode("write");
      setDirty(false);
      setTouchedTitle(false);
      setSaveError(null);
    }
  }

  function markDirty() {
    setDirty(true);
  }

  function hasUnsavedChanges() {
    const original = originalSnapshot;
    if (!original) return dirty;

    const doneMedia = additionalMedia.filter((item) => item.status === "done");

    return (
      title.trim() !== original.title ||
      category !== original.category ||
      rating !== original.rating ||
      (coverUrl.trim() || null) !== original.coverUrl ||
      (externalLink.trim() || null) !== original.externalLink ||
      date !== original.date ||
      (shortTake.trim() || null) !== original.shortTake ||
      (deepReflection.trim() || null) !== original.deepReflection ||
      tags.length !== original.tags.length ||
      tags.some((tag, i) => tag !== original.tags[i]) ||
      doneMedia.length !== original.additionalMedia.length ||
      doneMedia.some(
        (item, i) => item.url !== original.additionalMedia[i]?.url || item.kind !== original.additionalMedia[i]?.type
      )
    );
  }

  // Multi-media entries store their gallery in the EntryMedia table; the
  // Entry object passed in as `existingEntry` doesn't carry it, so fetch it
  // separately when opening in edit mode. By construction (see handleSave),
  // position 0 is the cover image when coverUrl is set — everything after
  // that (in their original interleaved order) is "additional" media.
  useEffect(() => {
    if (!open || mode !== "edit" || !existingEntry) return;
    let cancelled = false;
    getEntryMedia(existingEntry.id).then((media) => {
      if (cancelled) return;
      const additionalSource = existingEntry.coverUrl ? media.slice(1) : media;
      const additional: AdditionalMediaItem[] = additionalSource.map((item) => ({
        id: item.id,
        kind: item.type,
        status: "done",
        url: item.url,
        fileName: item.type === "IMAGE" ? "Image" : item.type === "VIDEO" ? "Video" : "Audio",
      }));
      const snapshotMedia: MediaInput[] = additional.map((item) => ({ url: item.url!, type: item.kind as MediaType }));
      setAdditionalMedia(additional);
      setOriginalSnapshot((prev) => (prev ? { ...prev, additionalMedia: snapshotMedia } : prev));
    });
    return () => {
      cancelled = true;
    };
  }, [open, mode, existingEntry]);

  function handleOpenChange(nextOpen: boolean, eventDetails: DialogPrimitive.Root.ChangeEventDetails) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (hasUnsavedChanges()) {
      eventDetails.cancel();
      setConfirmDiscardOpen(true);
      return;
    }
    onOpenChange(false);
  }

  function handleConfirmDiscard() {
    setConfirmDiscardOpen(false);
    onOpenChange(false);
  }

  function addTag(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setTagDraft("");
    markDirty();
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagDraft);
    } else if (event.key === "Backspace" && tagDraft === "" && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
      markDirty();
    }
  }

  async function handleCoverFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    const validation = validateImageFile(
      file,
      ALLOWED_COVER_TYPES,
      MAX_COVER_BYTES,
      "Please choose a PNG, JPEG, WEBP, or GIF image."
    );
    if (!validation.valid) {
      notifyError(validation.error!);
      return;
    }

    setIsUploadingCover(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setIsUploadingCover(false);
      notifyError("You must be signed in to do that.");
      return;
    }

    const path = `${user.id}/${crypto.randomUUID()}.${validation.extension}`;

    const { error: uploadError } = await supabase.storage
      .from("stash-covers")
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      console.error("Cover upload failed", uploadError);
      setIsUploadingCover(false);
      notifyError("Something went wrong while uploading your cover image. Please try again.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("stash-covers").getPublicUrl(path);

    setIsUploadingCover(false);
    setCoverUrl(publicUrl);
    markDirty();
  }

  // Single entry point for the unified "Additional Files" picker: classify
  // each selected file by MIME, then route it to the matching validator and
  // bucket (images -> stash-covers, video/audio -> stash-media). Every file
  // gets one list item that tracks its own upload/error state.
  function handleAdditionalFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    for (const file of files) {
      const id = crypto.randomUUID();
      const kind = classifyFile(file);

      if (!kind) {
        setAdditionalMedia((prev) => [
          ...prev,
          { id, kind: "UNKNOWN", status: "error", fileName: file.name, error: "Unsupported file type." },
        ]);
        continue;
      }

      const previewUrl = kind === "IMAGE" ? URL.createObjectURL(file) : undefined;
      setAdditionalMedia((prev) => [...prev, { id, kind, status: "uploading", fileName: file.name, previewUrl }]);
      markDirty();
      void uploadAdditionalFile(id, file, kind);
    }
  }

  async function uploadAdditionalFile(id: string, file: File, kind: MediaType) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAdditionalMedia((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "error", error: "You must be signed in to do that." } : item))
      );
      return;
    }

    const isImage = kind === "IMAGE";
    const bucket = isImage ? "stash-covers" : "stash-media";
    const allowedTypes = isImage ? ALLOWED_COVER_TYPES : ALLOWED_MEDIA_TYPES;
    const maxBytes = isImage ? MAX_COVER_BYTES : MAX_MEDIA_BYTES;
    const typeErrorMessage = isImage
      ? "Please choose a PNG, JPEG, WEBP, or GIF image."
      : "Please choose an MP4, WEBM, MOV, MP3, WAV, OGG, or M4A file.";

    const validation = validateImageFile(file, allowedTypes, maxBytes, typeErrorMessage);
    if (!validation.valid) {
      setAdditionalMedia((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "error", error: validation.error! } : item))
      );
      return;
    }

    if (kind === "VIDEO") {
      try {
        const duration = await getVideoDurationSeconds(file);
        if (duration > MAX_VIDEO_DURATION_SECONDS) {
          setAdditionalMedia((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, status: "error", error: `Videos must be ${MAX_VIDEO_DURATION_SECONDS} seconds or shorter.` }
                : item
            )
          );
          return;
        }
      } catch {
        // Couldn't read duration metadata — don't block the upload on it.
      }
    }

    const path = `${user.id}/${crypto.randomUUID()}.${validation.extension}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      console.error("Media upload failed", uploadError);
      setAdditionalMedia((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "error", error: "Upload failed. Please try again." } : item))
      );
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    setAdditionalMedia((prev) => prev.map((item) => (item.id === id ? { ...item, status: "done", url: publicUrl } : item)));
  }

  function removeAdditionalMediaItem(id: string) {
    setAdditionalMedia((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
    markDirty();
  }

  const titleError = touchedTitle && title.trim().length === 0 ? "Title is required." : null;
  const dateError = date.trim().length === 0 ? "Date is required." : null;
  const shortTakeWordCount = countWords(shortTake);
  const shortTakeError =
    shortTakeWordCount > SHORT_TAKE_WORD_LIMIT
      ? `over the word limit`
      : null;
  const isUploadingAdditional = additionalMedia.some((item) => item.status === "uploading");
  const canSave = title.trim().length > 0 && date.trim().length > 0 && !shortTakeError;

  function handleSave() {
    setTouchedTitle(true);
    if (!canSave) return;

    const trimmedCoverUrl = coverUrl.trim();
    const doneMedia = additionalMedia.filter(
      (item): item is AdditionalMediaItem & { status: "done"; url: string; kind: MediaType } => item.status === "done"
    );
    const entry: AddStashEntry = {
      title: title.trim(),
      category,
      rating,
      coverUrl: trimmedCoverUrl || null,
      externalLink: externalLink.trim() || null,
      date: new Date(date),
      shortTake: shortTake.trim() || null,
      deepReflection: deepReflection.trim() || null,
      tags,
      media: [
        ...(trimmedCoverUrl ? [{ url: trimmedCoverUrl, type: "IMAGE" as const }] : []),
        ...doneMedia.map((item): MediaInput => ({ url: item.url, type: item.kind })),
      ],
    };

    setSaveError(null);
    startSaveTransition(async () => {
      const result =
        mode === "edit" && existingEntry
          ? await updateEntry(existingEntry.id, entry)
          : await createEntry(entry);
      if (!result.success) {
        setSaveError(result.error);
        return;
      }
      onSaved(result.entry);
      onOpenChange(false);
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="scrollbar-hidden flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto sm:max-w-lg"
        initialFocus={titleInputRef}
      >
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Stash" : CATEGORY_HEADINGS[category]}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              const isActive = cat === category;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setCategory(cat);
                    markDirty();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="stash-title" className="text-sm font-medium text-foreground">
              Title
            </label>
            <Input
              id="stash-title"
              ref={titleInputRef}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                markDirty();
              }}
              onBlur={() => setTouchedTitle(true)}
              placeholder="Give it a name"
              aria-required="true"
              aria-invalid={!!titleError}
              aria-describedby={titleError ? "stash-title-error" : undefined}
            />
            {titleError && (
              <p id="stash-title-error" className="text-xs text-destructive">
                {titleError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="stash-short-take" className="text-sm font-medium text-foreground">
                Short Take
              </label>
              <span
                id="stash-short-take-count"
                className={cn("text-xs", shortTakeError ? "text-destructive" : "text-muted-foreground")}
              >
                {shortTakeWordCount}/{SHORT_TAKE_WORD_LIMIT} words
              </span>
            </div>
            <textarea
              id="stash-short-take"
              value={shortTake}
              onChange={(event) => {
                setShortTake(event.target.value);
                markDirty();
              }}
              rows={2}
              placeholder="A quick thought..."
              aria-invalid={!!shortTakeError}
              aria-describedby={shortTakeError ? "stash-short-take-count stash-short-take-error" : "stash-short-take-count"}
              className="w-full resize-none rounded-2xl border border-border bg-input/50 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
            {shortTakeError && (
              <p id="stash-short-take-error" role="alert" className="text-xs text-destructive">
                {shortTakeError}.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Rating (optional)</span>
            <StarRating
              value={rating}
              onChange={(next) => {
                setRating(next);
                markDirty();
              }}
              className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="stash-cover-url" className="text-sm font-medium text-foreground">
                Cover URL
              </label>
              <div className="flex items-center gap-2">
                {coverUrl.trim() ? (
                  <img
                    src={coverUrl}
                    alt=""
                    className="size-9 shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : null}
                <Input
                  id="stash-cover-url"
                  type="url"
                  value={coverUrl}
                  onChange={(event) => {
                    setCoverUrl(event.target.value);
                    markDirty();
                  }}
                  placeholder="https://..."
                />
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  hidden
                  onChange={handleCoverFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  disabled={isUploadingCover}
                  onClick={() => coverFileInputRef.current?.click()}
                  aria-label="Upload cover image"
                >
                  {isUploadingCover ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="stash-external-link" className="text-sm font-medium text-foreground">
                External Link
              </label>
              <Input
                id="stash-external-link"
                type="url"
                value={externalLink}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setExternalLink(nextValue);
                  markDirty();

                  const videoId = extractYouTubeVideoId(nextValue);
                  if (videoId) {
                    setCoverUrl(getYouTubeThumbnailUrl(videoId));
                  }
                }}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Additional Files (optional)</span>
              <input
                ref={additionalFilesInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/mp4"
                multiple
                hidden
                onChange={handleAdditionalFilesChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => additionalFilesInputRef.current?.click()}
              >
                <Upload className="size-4" aria-hidden="true" />
                Add files
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              images, video, and audio (up to 50MB)
            </p>
            {additionalMedia.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {additionalMedia.map((item) => {
                  const MediaIcon = item.kind === "VIDEO" ? Film : item.kind === "AUDIO" ? Music : AlertCircle;
                  const showImagePreview = item.kind === "IMAGE" && (item.previewUrl || item.url);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "relative flex size-16 items-center justify-center overflow-hidden rounded-lg border bg-foreground/5",
                        item.status === "error" ? "border-destructive" : "border-border"
                      )}
                    >
                      {showImagePreview ? (
                        <img
                          src={item.previewUrl ?? item.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <MediaIcon
                          className={cn("size-6", item.status === "error" ? "text-destructive" : "text-foreground/50")}
                          aria-hidden="true"
                        />
                      )}
                      {item.status === "uploading" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                          <Loader2 className="size-4 animate-spin text-foreground/60" aria-hidden="true" />
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${item.fileName}`}
                        onClick={() => removeAdditionalMediaItem(item.id)}
                        className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border-2 border-foreground bg-secondary text-foreground transition-colors hover:border-destructive hover:text-destructive"
                      >
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {additionalMedia.some((item) => item.status === "error") && (
              <ul className="flex flex-col gap-0.5">
                {additionalMedia
                  .filter((item) => item.status === "error")
                  .map((item) => (
                    <li key={item.id} role="alert" className="text-xs text-destructive">
                      {item.fileName}: {item.error}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="stash-date" className="text-sm font-medium text-foreground">
              Date
            </label>
            <Input
              id="stash-date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                markDirty();
              }}
              aria-required="true"
              aria-invalid={!!dateError}
              aria-describedby={dateError ? "stash-date-error" : undefined}
              className="w-full sm:w-48"
            />
            {dateError && (
              <p id="stash-date-error" className="text-xs text-destructive">
                {dateError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="stash-tags" className="text-sm font-medium text-foreground">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-input/50 px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-highlight px-2 py-0.5 text-[11px] font-medium text-highlight-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove tag ${tag}`}
                    onClick={() => {
                      setTags((prev) => prev.filter((t) => t !== tag));
                      markDirty();
                    }}
                    className="rounded-full hover:opacity-70"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              <input
                id="stash-tags"
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => addTag(tagDraft)}
                placeholder={tags.length === 0 ? "Add a tag..." : ""}
                className="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="stash-deep-reflection" className="text-sm font-medium text-foreground">
                Deep Reflection
              </label>
              <div className="flex items-center gap-1 rounded-full border border-border p-0.5 text-xs">
                <button
                  type="button"
                  aria-pressed={reflectionMode === "write"}
                  onClick={() => setReflectionMode("write")}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-medium transition-colors",
                    reflectionMode === "write"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Write
                </button>
                <button
                  type="button"
                  aria-pressed={reflectionMode === "preview"}
                  onClick={() => setReflectionMode("preview")}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-medium transition-colors",
                    reflectionMode === "preview"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Preview
                </button>
              </div>
            </div>
            {reflectionMode === "write" ? (
              <textarea
                id="stash-deep-reflection"
                value={deepReflection}
                onChange={(event) => {
                  setDeepReflection(event.target.value);
                  markDirty();
                }}
                rows={6}
                placeholder="Your detail thoughts..."
                className="w-full resize-none rounded-2xl border border-border bg-input/50 px-3 py-2 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            ) : (
              <div
                className={cn(
                  "min-h-32 rounded-2xl border border-border bg-input/50 px-3 py-2 text-sm text-foreground",
                  "[&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5",
                  "[&_strong]:font-semibold [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold",
                  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs"
                )}
              >
                {deepReflection.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{deepReflection}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button
                variant="outline"
                type="button"
                className="border-2 border-foreground text-foreground transition-colors hover:border-destructive hover:bg-destructive/5 hover:text-destructive"
              />
            }
          >
            Cancel
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={!canSave || isSaving || isUploadingAdditional}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {mode === "edit" ? "Updating…" : "Saving…"}
              </>
            ) : mode === "edit" ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
        {isUploadingAdditional && !saveError && (
          <p className="text-right text-xs text-muted-foreground">Waiting for files to finish uploading&hellip;</p>
        )}
        {saveError && (
          <p role="alert" className="text-right text-xs text-destructive">
            {saveError}
          </p>
        )}
      </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this stash entry?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDiscard}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
