"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export type ToggleFavoriteResult = { success: true } | { success: false; error: string };

export async function toggleFavorite(id: string, nextValue: boolean): Promise<ToggleFavoriteResult> {
  try {
    await prisma.entry.update({ where: { id }, data: { favorite: nextValue } });

    revalidatePath("/wall");
    return { success: true };
  } catch (error) {
    console.error("toggleFavorite failed", error);
    return { success: false, error: "Something went wrong while updating favorite. Please try again." };
  }
}
