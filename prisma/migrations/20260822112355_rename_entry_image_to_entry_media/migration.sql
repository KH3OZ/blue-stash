-- Generalize "EntryImage" into "EntryMedia" to support video/audio in
-- addition to images. This is a pure rename + additive column: existing
-- rows (all images today) are preserved as-is and backfilled with
-- type = 'IMAGE', so current image entries keep their exact data and
-- behavior. RLS policies stay attached automatically across the rename
-- (Postgres RLS is tied to the table's OID, not its name).

-- RenameTable
ALTER TABLE "EntryImage" RENAME TO "EntryMedia";

-- RenameConstraints/Indexes to match Prisma's naming convention for the new table name
ALTER TABLE "EntryMedia" RENAME CONSTRAINT "EntryImage_pkey" TO "EntryMedia_pkey";
ALTER TABLE "EntryMedia" RENAME CONSTRAINT "EntryImage_entryId_fkey" TO "EntryMedia_entryId_fkey";
ALTER INDEX "EntryImage_entryId_idx" RENAME TO "EntryMedia_entryId_idx";
ALTER INDEX "EntryImage_userId_idx" RENAME TO "EntryMedia_userId_idx";

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- AddColumn (backfills existing rows with 'IMAGE' in the same statement)
ALTER TABLE "EntryMedia" ADD COLUMN "type" "MediaType" NOT NULL DEFAULT 'IMAGE';
