"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/get-current-user";

export type DeleteEntryResult = { success: true } | { success: false; error: string };

export async function deleteEntry(id: string): Promise<DeleteEntryResult> {
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
    return { success: false, error: "You don't have permission to delete this entry." };
  }

  try {
    await prisma.entry.delete({ where: { id, userId } });

    revalidatePath("/wall");
    return { success: true };
  } catch (error) {
    console.error("deleteEntry failed", error);
    return { success: false, error: "Something went wrong while deleting. Please try again." };
  }
}
