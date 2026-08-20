"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/supabase/get-current-user";
import { CATEGORIES, type Category } from "@/types/category";
import type { Entry } from "@/generated/prisma/client";

export interface UpdateEntryInput {
  title: string;
  category: Category;
  rating: number | null;
  coverUrl: string | null;
  externalLink: string | null;
  date: Date;
  shortTake: string | null;
  deepReflection: string | null;
  tags: string[];
}

export type UpdateEntryResult = { success: true; entry: Entry } | { success: false; error: string };

export async function updateEntry(id: string, input: UpdateEntryInput): Promise<UpdateEntryResult> {
  const title = input.title?.trim();
  if (!title) {
    return { success: false, error: "Title is required." };
  }

  if (!CATEGORIES.includes(input.category)) {
    return { success: false, error: "Invalid category." };
  }

  const date = input.date instanceof Date ? input.date : new Date(input.date);
  if (Number.isNaN(date.getTime())) {
    return { success: false, error: "A valid date is required." };
  }

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
    const entry = await prisma.entry.update({
      where: { id, userId },
      data: {
        title,
        category: input.category,
        rating: input.rating ?? null,
        coverUrl: input.coverUrl?.trim() || null,
        externalLink: input.externalLink?.trim() || null,
        date,
        shortTake: input.shortTake?.trim() || null,
        deepReflection: input.deepReflection?.trim() || null,
        tags: input.tags ?? [],
      },
    });

    revalidatePath("/wall");
    return { success: true, entry };
  } catch (error) {
    console.error("updateEntry failed", error);
    return { success: false, error: "Something went wrong while saving. Please try again." };
  }
}
