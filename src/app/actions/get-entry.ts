"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/get-current-user";
import type { Entry } from "@/generated/prisma/client";

export type GetEntryResult = { success: true; entry: Entry } | { success: false; error: string };

export async function getEntry(id: string): Promise<GetEntryResult> {
  let userId: string;
  try {
    userId = await getCurrentUserId();
  } catch {
    return { success: false, error: "This entry could not be found." };
  }

  try {
    const entry = await prisma.entry.findFirst({ where: { id, userId } });
    if (!entry) {
      return { success: false, error: "This entry could not be found." };
    }
    return { success: true, entry };
  } catch (error) {
    console.error("getEntry failed", error);
    return { success: false, error: "Something went wrong while loading this entry. Please try again." };
  }
}
