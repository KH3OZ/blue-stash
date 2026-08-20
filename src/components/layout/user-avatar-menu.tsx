"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { LogOut, Loader2, Moon, Sun, User } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { validateImageFile } from "@/lib/storage/validate-image-file";
import { useAddStashModal } from "@/context/add-stash-modal-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

// custom_avatar_url is our own field, separate from avatar_url (which
// Google OAuth writes into user_metadata on sign-in). Writing uploads into
// avatar_url directly would permanently overwrite Google's photo with no
// way back, since nothing re-syncs it on later logins. Keeping our own
// field and layering priority here means a custom upload takes precedence
// without destroying the provider-supplied one underneath it.
function resolveAvatarUrl(metadata: Record<string, unknown> | undefined): string | null {
  const custom = metadata?.custom_avatar_url;
  if (typeof custom === "string" && custom) return custom;
  const provider = metadata?.avatar_url;
  if (typeof provider === "string" && provider) return provider;
  return null;
}

export function UserAvatarMenu() {
  const router = useRouter();
  const { notifyError } = useAddStashModal();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setAvatarUrl(resolveAvatarUrl(data.user?.user_metadata));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      setAvatarUrl(resolveAvatarUrl(session?.user?.user_metadata));
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    const validation = validateImageFile(
      file,
      ALLOWED_AVATAR_TYPES,
      MAX_AVATAR_BYTES,
      "Please choose a PNG, JPEG, or WEBP image."
    );
    if (!validation.valid) {
      notifyError(validation.error!);
      return;
    }
    const extension = validation.extension!;

    setIsUploading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setIsUploading(false);
      notifyError("You must be signed in to do that.");
      return;
    }

    const path = `${user.id}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error("Avatar upload failed", uploadError);
      setIsUploading(false);
      notifyError("Something went wrong while uploading your photo. Please try again.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { custom_avatar_url: cacheBustedUrl },
    });

    setIsUploading(false);

    if (updateError) {
      console.error("Avatar metadata update failed", updateError);
      notifyError("Something went wrong while uploading your photo. Please try again.");
      return;
    }

    setAvatarUrl(cacheBustedUrl);
  }

  if (!email) return null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={handleFileChange}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <Avatar>
            <AvatarImage src={avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="size-4" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/wall")}>View Wall</DropdownMenuItem>
          <DropdownMenuItem
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {isUploading ? "Uploading…" : "Change photo"}
          </DropdownMenuItem>
          {mounted ? (
            <DropdownMenuItem
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? (
                <Sun aria-hidden="true" />
              ) : (
                <Moon aria-hidden="true" />
              )}
              {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut aria-hidden="true" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
