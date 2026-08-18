"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Star, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
}

interface AddStashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialShortTake: string;
  initialCategory?: Category;
  onSaved: (entry: AddStashEntry) => void;
}

export function AddStashModal({
  open,
  onOpenChange,
  initialShortTake,
  initialCategory = "LIFE_MOMENTS",
  onSaved,
}: AddStashModalProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [shortTake, setShortTake] = useState(initialShortTake);
  const [rating, setRating] = useState<number | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [date, setDate] = useState(todayIso());
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [deepReflection, setDeepReflection] = useState("");
  const [reflectionMode, setReflectionMode] = useState<"write" | "preview">("write");
  const [dirty, setDirty] = useState(false);
  const [touchedTitle, setTouchedTitle] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  // Reseed the form when the modal transitions closed -> open. Adjusting
  // state during render (rather than in an effect) avoids an extra render
  // pass and matches the composer values at the moment the modal opens,
  // without reseeding on every composer keystroke while already open.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setTitle("");
      setCategory(initialCategory);
      setShortTake(initialShortTake);
      setRating(null);
      setCoverUrl("");
      setExternalLink("");
      setDate(todayIso());
      setTags([]);
      setTagDraft("");
      setDeepReflection("");
      setReflectionMode("write");
      setDirty(false);
      setTouchedTitle(false);
    }
  }

  function markDirty() {
    setDirty(true);
  }

  function handleOpenChange(nextOpen: boolean, eventDetails: DialogPrimitive.Root.ChangeEventDetails) {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (dirty) {
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

  const titleError = touchedTitle && title.trim().length === 0 ? "Title is required." : null;
  const dateError = date.trim().length === 0 ? "Date is required." : null;
  const canSave = title.trim().length > 0 && date.trim().length > 0;

  function handleSave() {
    setTouchedTitle(true);
    if (!canSave) return;

    const entry: AddStashEntry = {
      title: title.trim(),
      category,
      rating,
      coverUrl: coverUrl.trim() || null,
      externalLink: externalLink.trim() || null,
      date: new Date(date),
      shortTake: shortTake.trim() || null,
      deepReflection: deepReflection.trim() || null,
      tags,
    };

    console.log(entry);
    onSaved(entry);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="scrollbar-hidden flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto sm:max-w-lg"
        initialFocus={titleInputRef}
      >
        <DialogHeader>
          <DialogTitle>{CATEGORY_HEADINGS[category]}</DialogTitle>
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
            <label htmlFor="stash-short-take" className="text-sm font-medium text-foreground">
              Short Take
            </label>
            <textarea
              id="stash-short-take"
              value={shortTake}
              onChange={(event) => {
                setShortTake(event.target.value);
                markDirty();
              }}
              rows={2}
              placeholder="A quick thought..."
              className="w-full resize-none rounded-2xl border border-border bg-input/50 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Rating</span>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => {
                const filled = rating !== null && value <= rating;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value > 1 ? "s" : ""}`}
                    onClick={() => {
                      setRating((prev) => (prev === value ? null : value));
                      markDirty();
                    }}
                    className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Star
                      className={cn(
                        "size-5 transition-colors",
                        filled ? "fill-primary text-primary" : "text-muted-foreground"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="stash-cover-url" className="text-sm font-medium text-foreground">
                Cover URL
              </label>
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
                  setExternalLink(event.target.value);
                  markDirty();
                }}
                placeholder="https://..."
              />
            </div>
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
                placeholder="Write in Markdown..."
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{deepReflection}</ReactMarkdown>
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
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            Save
          </Button>
        </DialogFooter>
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
