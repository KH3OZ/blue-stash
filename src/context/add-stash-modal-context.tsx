"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import { AddStashModal } from "@/components/stash/add-stash-modal";

type OpenModalOptions = {
  initialShortTake?: string;
  onSaved?: () => void;
};

type AddStashModalContextValue = {
  openModal: (options?: OpenModalOptions) => void;
};

const AddStashModalContext = createContext<AddStashModalContextValue | null>(null);

export function AddStashModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialShortTake, setInitialShortTake] = useState("");
  const onSavedRef = useRef<(() => void) | undefined>(undefined);

  const openModal = useCallback((options?: OpenModalOptions) => {
    setInitialShortTake(options?.initialShortTake ?? "");
    onSavedRef.current = options?.onSaved;
    setOpen(true);
  }, []);

  return (
    <AddStashModalContext.Provider value={{ openModal }}>
      {children}
      <AddStashModal
        open={open}
        onOpenChange={setOpen}
        initialShortTake={initialShortTake}
        onSaved={() => onSavedRef.current?.()}
      />
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
