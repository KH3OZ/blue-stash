"use client";

import Link from "next/link";
import { Archive, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function SiteHeader() {
  const { state, isMobile } = useSidebar();
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
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {isMobile && (
          <SidebarTrigger className="shrink-0 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
        )}

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
        >
          <Archive className="size-6 text-primary" aria-hidden="true" />
          <span>BlueStash</span>
        </Link>

        <div className="relative ml-2 flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search your stash..."
            disabled
            aria-label="Search your stash"
            className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed"
          />
        </div>

        <ThemeToggle />

        <Button className="shrink-0 gap-1.5 transition-colors hover:bg-primary-hover">
          <Plus className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Add Stash</span>
        </Button>
      </div>
    </header>
  );
}
