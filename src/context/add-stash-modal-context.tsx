"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { AddStashModal } from "@/components/stash/add-stash-modal";
import { cn } from "@/lib/utils";
import type { Entry } from "@/generated/prisma/client";

type OpenModalOptions = {
  initialShortTake?: string;
  onSaved?: () => void;
};

type AddStashModalContextValue = {
  openModal: (options?: OpenModalOptions) => void;
  openEditModal: (entry: Entry) => void;
  notifyDeleted: (title: string) => void;
  notifyBulkDeleted: (deletedCount: number) => void;
  /**
   * Bumps refreshToken silently (no toast) — for updates like a favorite
   * toggle that are already reflected optimistically in the UI and don't
   * need their own confirmation message.
   */
  notifyRefetchNeeded: () => void;
  /** Shows an error toast without touching refreshToken. */
  notifyError: (message: string) => void;
  /**
   * Increments every time a save succeeds, regardless of which trigger opened
   * the modal. StashCollectionContainer depends on this to know when to
   * re-fetch — its own data fetch is client-side (a direct Server Action call
   * in a useEffect), so neither revalidatePath nor router.refresh() causes it
   * to re-run on their own; it needs a dependency that actually changes.
   */
  refreshToken: number;
};

const AddStashModalContext = createContext<AddStashModalContextValue | null>(null);

type ToastState = { id: number; message: string; variant: "success" | "error" };

function SavedToast({ message, variant, onDismiss }: { message: string; variant: "success" | "error"; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = variant === "error" ? XCircle : CheckCircle2;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-60 flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-50 shadow-xl duration-200 animate-in fade-in-0 slide-in-from-bottom-2 dark:bg-neutral-700"
    >
      <Icon className={cn("size-4", variant === "error" && "text-destructive")} aria-hidden="true" />
      {message}
    </div>
  );
}

export function AddStashModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [initialShortTake, setInitialShortTake] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const onSavedRef = useRef<(() => void) | undefined>(undefined);
  const toastIdRef = useRef(0);

  const openModal = useCallback((options?: OpenModalOptions) => {
    setMode("create");
    setEditingEntry(null);
    setInitialShortTake(options?.initialShortTake ?? "");
    onSavedRef.current = options?.onSaved;
    setOpen(true);
  }, []);

  const openEditModal = useCallback((entry: Entry) => {
    setMode("edit");
    setEditingEntry(entry);
    onSavedRef.current = undefined;
    setOpen(true);
  }, []);

  function handleSaved(entry: Entry) {
    onSavedRef.current?.();
    setRefreshToken((token) => token + 1);
    toastIdRef.current += 1;
    const message = mode === "edit" ? `"${entry.title}" updated.` : `"${entry.title}" added to your stash.`;
    setToast({ id: toastIdRef.current, message, variant: "success" });
  }

  const notifyDeleted = useCallback((title: string) => {
    setRefreshToken((token) => token + 1);
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message: `"${title}" deleted.`, variant: "success" });
  }, []);

  const notifyBulkDeleted = useCallback((deletedCount: number) => {
    setRefreshToken((token) => token + 1);
    toastIdRef.current += 1;
    const noun = deletedCount === 1 ? "entry" : "entries";
    setToast({ id: toastIdRef.current, message: `${deletedCount} ${noun} deleted.`, variant: "success" });
  }, []);

  const notifyRefetchNeeded = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  const notifyError = useCallback((message: string) => {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message, variant: "error" });
  }, []);

  return (
    <AddStashModalContext.Provider
      value={{
        openModal,
        openEditModal,
        notifyDeleted,
        notifyBulkDeleted,
        notifyRefetchNeeded,
        notifyError,
        refreshToken,
      }}
    >
      {children}
      <AddStashModal
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        existingEntry={editingEntry}
        initialShortTake={initialShortTake}
        onSaved={handleSaved}
      />
      {toast && (
        // Keying by id forces a fresh mount per toast, so a new toast that
        // lands while one is already visible replaces it and restarts the
        // 3s timer, rather than the old effect instance lingering.
        <SavedToast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </AddStashModalContext.Provider>
  );
}

export function useAddStashModal() {
  const context = useContext(AddStashModalContext);

  if (!context) {
    throw new Error("useAddStashModal must be used within an AddStashModalProvider");
  }

  return context;
}
