"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export type DeleteEntriesResult =
  | { success: true; deletedCount: number }
  | { success: false; error: string };

export async function deleteEntries(ids: string[]): Promise<DeleteEntriesResult> {
  try {
    const result = await prisma.entry.deleteMany({ where: { id: { in: ids } } });

    revalidatePath("/wall");
    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error("deleteEntries failed", error);
    return { success: false, error: "Something went wrong while deleting. Please try again." };
  }
}
