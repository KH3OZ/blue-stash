-- Row-level security for "Entry", scoped to the owning user.
-- Server Actions already enforce ownership via Prisma (which connects
-- directly to Postgres, bypassing PostgREST/RLS entirely), but "Entry"
-- is otherwise reachable through Supabase's auto-generated REST/GraphQL
-- API using the public anon key. Without RLS, those app-layer ownership
-- checks can be bypassed by calling that API directly.

ALTER TABLE "Entry" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entries"
ON "Entry"
FOR SELECT
TO authenticated
USING ((select auth.uid()) = "userId");

CREATE POLICY "Users can insert their own entries"
ON "Entry"
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = "userId");

CREATE POLICY "Users can update their own entries"
ON "Entry"
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = "userId")
WITH CHECK ((select auth.uid()) = "userId");

CREATE POLICY "Users can delete their own entries"
ON "Entry"
FOR DELETE
TO authenticated
USING ((select auth.uid()) = "userId");
