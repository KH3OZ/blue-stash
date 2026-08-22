"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/get-current-user";
import type { EntryMedia } from "@/generated/prisma/client";

export async function getEntryMedia(entryId: string): Promise<EntryMedia[]> {
  let userId: string;
  try {
    userId = await getCurrentUserId();
  } catch {
    return [];
  }

  try {
    return await prisma.entryMedia.findMany({
      where: { entryId, userId },
      orderBy: { position: "asc" },
    });
  } catch (error) {
    console.error("getEntryMedia failed", error);
    return [];
  }
}
