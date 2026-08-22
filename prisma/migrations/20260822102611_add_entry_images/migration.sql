-- CreateTable
CREATE TABLE "EntryImage" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntryImage_entryId_idx" ON "EntryImage"("entryId");

-- CreateIndex
CREATE INDEX "EntryImage_userId_idx" ON "EntryImage"("userId");

-- AddForeignKey
ALTER TABLE "EntryImage" ADD CONSTRAINT "EntryImage_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-level security for "EntryImage", scoped to the owning user.
-- Mirrors the "Entry" RLS policy shape (see 20260820233000_add_entry_rls):
-- Server Actions enforce ownership via Prisma, but "EntryImage" is otherwise
-- reachable through Supabase's auto-generated REST/GraphQL API using the
-- public anon key. Without RLS, those app-layer ownership checks can be
-- bypassed by calling that API directly.

ALTER TABLE "EntryImage" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entry images"
ON "EntryImage"
FOR SELECT
TO authenticated
USING ((select auth.uid()) = "userId");

CREATE POLICY "Users can insert their own entry images"
ON "EntryImage"
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = "userId");

CREATE POLICY "Users can update their own entry images"
ON "EntryImage"
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = "userId")
WITH CHECK ((select auth.uid()) = "userId");

CREATE POLICY "Users can delete their own entry images"
ON "EntryImage"
FOR DELETE
TO authenticated
USING ((select auth.uid()) = "userId");
