"use client";

import Link from "next/link";
import { Archive, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { UserAvatarMenu } from "@/components/layout/user-avatar-menu";
import { HeaderSearchTypeahead } from "@/components/layout/header-search-typeahead";
import { useAddStashModal } from "@/context/add-stash-modal-context";

export function SiteHeader() {
  const { state, isMobile } = useSidebar();
  const { openModal } = useAddStashModal();
  const sidebarOffset = isMobile
    ? undefined
    : state === "expanded"
      ? "var(--sidebar-width)"
      : "var(--sidebar-width-icon)";

  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur transition-[padding-left] duration-200 ease-linear supports-backdrop-filter:bg-background/80"
      style={{ paddingLeft: sidebarOffset }}
    >
      {!isMobile && (
        <Link
          href="/"
          className="absolute left-5 top-1/2 flex shrink-0 -translate-y-1/2 items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
        >
          <Archive className="size-6 text-primary" aria-hidden="true" />
          <span>BlueStash</span>
        </Link>
      )}

      <div className="absolute right-5 top-1/2 -translate-y-1/2">
        <UserAvatarMenu />
      </div>

      <div className="flex h-16 items-center">
        {isMobile && (
          <>
            <SidebarTrigger className="ml-4 shrink-0 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 pl-2 text-lg font-semibold tracking-tight text-foreground"
            >
              <Archive className="size-6 text-primary" aria-hidden="true" />
              <span>BlueStash</span>
            </Link>
          </>
        )}

        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-4 px-4 pr-16 sm:px-6 sm:pr-16">
          <HeaderSearchTypeahead />

          <Button
            className="shrink-0 gap-1 transition-colors hover:bg-primary-hover"
            onClick={() => openModal()}
          >
            <Plus className="size-4.5" aria-hidden="true" />
            <span className="hidden sm:inline">Add Stash</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
