// One-off seed script for Phase 3.3 verification data.
// Run with: npx tsx prisma/seed.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type Prisma } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const OWNER_USER_ID = "a85c7ba7-eef5-4d1d-923a-4260dbf7d430";

const entries: Omit<Prisma.EntryCreateManyInput, "userId">[] = [
  {
    title: "Arcane Season 2 — the finale hit harder than expected",
    category: "VIDEO",
    rating: 8,
    coverUrl: "https://picsum.photos/seed/arcane/600/450",
    externalLink: "https://example.com",
    date: new Date("2026-08-10"),
    shortTake: "Gorgeous animation, bittersweet ending. Worth the wait.",
    tags: ["animation", "sci-fi", "netflix"],
  },
  {
    title: "Late-night rewatch: Cowboy Bebop ep. 5",
    category: "VIDEO",
    rating: null,
    coverUrl: null,
    externalLink: null,
    date: new Date("2026-06-02"),
    shortTake: null,
    tags: ["anime"],
  },
  {
    title: "Project Hail Mary",
    category: "READING",
    rating: 4,
    coverUrl: null,
    externalLink: null,
    date: new Date("2026-07-22"),
    shortTake: "Andy Weir does it again — funny, tense, genuinely moving.",
    tags: ["sci-fi", "book-club"],
  },
  {
    title: "Baldur's Gate 3 — Act 2 run",
    category: "GAMING",
    rating: null,
    coverUrl: "https://picsum.photos/seed/bg3/600/450",
    externalLink: null,
    date: new Date("2026-08-01"),
    shortTake: "Still deciding if I romance the vampire or the druid.",
    tags: ["rpg", "co-op", "long-haul", "steam"],
  },
  {
    title: "Late Night Radio — Episode 214",
    category: "AUDIO",
    rating: 9,
    coverUrl: "https://picsum.photos/seed/radio/600/450",
    externalLink: "https://example.com/episode-214",
    date: new Date("2026-08-15"),
    shortTake: null,
    tags: ["podcast"],
  },
  {
    title: "Beach day with the whole crew",
    category: "LIFE_MOMENTS",
    rating: 5,
    coverUrl: "https://picsum.photos/seed/beach/600/450",
    externalLink: null,
    date: new Date("2026-08-16"),
    shortTake: "Perfect weather, terrible sunburn, worth it.",
    tags: ["friends", "summer", "beach", "roadtrip", "memories", "2026"],
  },
  {
    title: "Local Jazz Festival",
    category: "EVENTS",
    rating: 7,
    coverUrl: "https://picsum.photos/seed/jazz/600/450",
    externalLink: "https://example.com/jazz-fest",
    date: new Date("2026-08-05"),
    shortTake: "Discovered a new favorite trio in the side tent.",
    tags: ["live-music", "jazz"],
  },
  {
    title: "Dune: Part Two",
    category: "FILMS",
    rating: 10,
    coverUrl: "https://picsum.photos/seed/dune/600/450",
    externalLink: null,
    date: new Date("2026-08-12"),
    shortTake: "IMAX was non-negotiable for this one.",
    tags: ["sci-fi", "cinema"],
  },
  {
    title: "Untitled draft — everything empty",
    category: "FILMS",
    rating: null,
    coverUrl: null,
    externalLink: null,
    date: null,
    shortTake: null,
    tags: [],
  },
];

async function main() {
  const existing = await prisma.entry.count();

  if (existing > 0) {
    console.log(`Entry table already has ${existing} row(s) — skipping seed.`);
    return;
  }

  await prisma.entry.createMany({
    data: entries.map((entry) => ({ ...entry, userId: OWNER_USER_ID })),
  });
  console.log(`Seeded ${entries.length} entries.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
