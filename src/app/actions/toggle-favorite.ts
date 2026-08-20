"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/get-current-user";

export type ToggleFavoriteResult = { success: true } | { success: false; error: string };

export async function toggleFavorite(id: string, nextValue: boolean): Promise<ToggleFavoriteResult> {
  let userId: string;
  try {
    userId = await getCurrentUserId();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "You must be signed in to do that." };
  }

  const existing = await prisma.entry.findUnique({ where: { id }, select: { userId: true } });
  if (!existing) {
    return { success: false, error: "Entry not found." };
  }
  if (existing.userId !== userId) {
    return { success: false, error: "You don't have permission to modify this entry." };
  }

  try {
    await prisma.entry.update({ where: { id, userId }, data: { favorite: nextValue } });

    revalidatePath("/wall");
    return { success: true };
  } catch (error) {
    console.error("toggleFavorite failed", error);
    return { success: false, error: "Something went wrong while updating favorite. Please try again." };
  }
}
