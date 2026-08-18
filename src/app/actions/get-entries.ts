"use server";

import { prisma } from "@/lib/prisma";
import type { Entry } from "@/generated/prisma/client";
import type { NavFilter } from "@/types/category";

export async function getEntries(filter: NavFilter): Promise<Entry[]> {
  return prisma.entry.findMany({
    where: filter === "ALL" ? undefined : { category: filter },
    orderBy: { date: { sort: "desc", nulls: "last" } },
  });
}
