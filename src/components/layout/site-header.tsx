import Link from "next/link";
import { Archive, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
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

        <Button className="ml-auto gap-1.5 shrink-0 transition-colors hover:bg-primary-hover">
          <Plus className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Add Stash</span>
        </Button>
      </div>
    </header>
  );
}
