-- Add userId as nullable so existing rows aren't rejected
ALTER TABLE "Entry" ADD COLUMN "userId" UUID;

-- Backfill existing rows to the current single owner account
UPDATE "Entry" SET "userId" = 'a85c7ba7-eef5-4d1d-923a-4260dbf7d430' WHERE "userId" IS NULL;

-- Every entry must have an owner from here on
ALTER TABLE "Entry" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Entry_userId_idx" ON "Entry"("userId");

-- Tie entries to Supabase's auth.users; not modeled as a Prisma relation
-- because auth.users lives in a schema Prisma doesn't manage.
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
