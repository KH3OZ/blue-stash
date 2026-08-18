"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

import { AddStashModal } from "@/components/stash/add-stash-modal";
import type { Entry } from "@/generated/prisma/client";

type OpenModalOptions = {
  initialShortTake?: string;
  onSaved?: () => void;
};

type AddStashModalContextValue = {
  openModal: (options?: OpenModalOptions) => void;
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

function SavedToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-60 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-xl duration-200 animate-in fade-in-0 slide-in-from-bottom-2"
    >
      <CheckCircle2 className="size-4" aria-hidden="true" />
      {message}
    </div>
  );
}

export function AddStashModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialShortTake, setInitialShortTake] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const onSavedRef = useRef<(() => void) | undefined>(undefined);
  const toastIdRef = useRef(0);

  const openModal = useCallback((options?: OpenModalOptions) => {
    setInitialShortTake(options?.initialShortTake ?? "");
    onSavedRef.current = options?.onSaved;
    setOpen(true);
  }, []);

  function handleSaved(entry: Entry) {
    onSavedRef.current?.();
    setRefreshToken((token) => token + 1);
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message: `"${entry.title}" added to your stash.` });
  }

  return (
    <AddStashModalContext.Provider value={{ openModal, refreshToken }}>
      {children}
      <AddStashModal
        open={open}
        onOpenChange={setOpen}
        initialShortTake={initialShortTake}
        onSaved={handleSaved}
      />
      {toast && (
        // Keying by id forces a fresh mount per save, so a save that lands
        // while a toast is already visible replaces it and restarts the
        // 3s timer, rather than the old effect instance lingering.
        <SavedToast key={toast.id} message={toast.message} onDismiss={() => setToast(null)} />
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
