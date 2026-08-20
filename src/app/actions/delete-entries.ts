"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/get-current-user";

export type DeleteEntriesResult =
  | { success: true; deletedCount: number }
  | { success: false; error: string };

export async function deleteEntries(ids: string[]): Promise<DeleteEntriesResult> {
  let userId: string;
  try {
    userId = await getCurrentUserId();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "You must be signed in to do that." };
  }

  const existing = await prisma.entry.findMany({ where: { id: { in: ids } }, select: { userId: true } });
  if (existing.some((entry) => entry.userId !== userId)) {
    return { success: false, error: "You don't have permission to delete one or more of these entries." };
  }

  try {
    const result = await prisma.entry.deleteMany({ where: { id: { in: ids }, userId } });

    revalidatePath("/wall");
    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error("deleteEntries failed", error);
    return { success: false, error: "Something went wrong while deleting. Please try again." };
  }
}
