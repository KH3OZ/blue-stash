"use client";

import { useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";
import { ArrowUp, Archive, Loader2, Upload } from "lucide-react";

import { useAddStashModal } from "@/context/add-stash-modal-context";
import { createClient } from "@/lib/supabase/client";
import { validateImageFile } from "@/lib/storage/validate-image-file";

const PLACEHOLDER = "anything that makes you smile today...";

const ALLOWED_COVER_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_COVER_BYTES = 8 * 1024 * 1024;

export function StashComposer() {
  const [value, setValue] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const { openModal, notifyError } = useAddStashModal();

  function handleSubmit() {
    if (value.trim().length === 0) return;
    openModal({
      initialShortTake: value,
      onSaved: () => setValue(""),
    });
  }

  async function captureImage(file: File) {
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
    openModal({
      initialCoverUrl: publicUrl,
      onSaved: () => setValue(""),
    });
  }

  async function handleCoverFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    await captureImage(file);
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const item = Array.from(event.clipboardData.items).find(
      (candidate) => candidate.kind === "file" && candidate.type.startsWith("image/")
    );
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    event.preventDefault();
    void captureImage(file);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <section className="w-full max-w-2xl">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Archive className="size-8.5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            How&rsquo;s your day going?
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
         Capture anything you&rsquo;ll want back later.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-2 transition-colors focus-within:border-primary dark:focus-within:border-primary">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={3}
          placeholder={PLACEHOLDER}
          aria-label={PLACEHOLDER}
          className="w-full resize-none bg-transparent px-4 pt-3 text-base text-foreground placeholder:text-muted-foreground outline-none"
        />
        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-2">
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={handleCoverFileChange}
            />
            <button
              type="button"
              disabled={isUploadingCover}
              aria-label="Upload cover image"
              onClick={() => coverFileInputRef.current?.click()}
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUploadingCover ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <button
            type="button"
            disabled={value.trim().length === 0}
            aria-label="Save to your stash"
            onClick={handleSubmit}
            className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
