"use server";

import { prisma } from "@/lib/prisma";
import type { Entry } from "@/generated/prisma/client";

export type GetEntryResult = { success: true; entry: Entry } | { success: false; error: string };

export async function getEntry(id: string): Promise<GetEntryResult> {
  try {
    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry) {
      return { success: false, error: "This entry could not be found." };
    }
    return { success: true, entry };
  } catch (error) {
    console.error("getEntry failed", error);
    return { success: false, error: "Something went wrong while loading this entry. Please try again." };
  }
}
