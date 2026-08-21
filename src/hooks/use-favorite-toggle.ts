"use client";

import { useState } from "react";

import { toggleFavorite } from "@/app/actions/toggle-favorite";
import { useAddStashModal } from "@/context/add-stash-modal-context";

export function useFavoriteToggle(id: string, initialFavorite: boolean, title: string) {
  const { notifyFavoriteToggled, notifyError } = useAddStashModal();
  const [favorite, setFavorite] = useState(initialFavorite);

  async function toggle() {
    const nextValue = !favorite;
    setFavorite(nextValue);

    const result = await toggleFavorite(id, nextValue);
    if (!result.success) {
      setFavorite(!nextValue);
      notifyError("Couldn't update favorite. Please try again.");
      return;
    }

    notifyFavoriteToggled(id, title, nextValue);
  }

  return { favorite, toggle };
}
