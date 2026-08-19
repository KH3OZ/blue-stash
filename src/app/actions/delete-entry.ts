"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export type DeleteEntryResult = { success: true } | { success: false; error: string };

export async function deleteEntry(id: string): Promise<DeleteEntryResult> {
  try {
    await prisma.entry.delete({ where: { id } });

    revalidatePath("/wall");
    return { success: true };
  } catch (error) {
    console.error("deleteEntry failed", error);
    return { success: false, error: "Something went wrong while deleting. Please try again." };
  }
}
