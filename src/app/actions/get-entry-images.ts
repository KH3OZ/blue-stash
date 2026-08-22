"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/get-current-user";
import type { EntryImage } from "@/generated/prisma/client";

export async function getEntryImages(entryId: string): Promise<EntryImage[]> {
  let userId: string;
  try {
    userId = await getCurrentUserId();
  } catch {
    return [];
  }

  try {
    return await prisma.entryImage.findMany({
      where: { entryId, userId },
      orderBy: { position: "asc" },
    });
  } catch (error) {
    console.error("getEntryImages failed", error);
    return [];
  }
}
