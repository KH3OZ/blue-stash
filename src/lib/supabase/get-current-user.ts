import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to do that.");
  }

  return user.id;
}
