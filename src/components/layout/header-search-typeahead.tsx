"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { getEntries } from "@/app/actions/get-entries";
import { useSearch } from "@/context/search-context";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { CATEGORY_ICONS, type Category } from "@/types/category";
import type { Entry } from "@/generated/prisma/client";

const RESULT_LIMIT = 4;
const DEBOUNCE_MS = 300;

export function HeaderSearchTypeahead() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { query, setQuery } = useSearch();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Entry[] | null>(null);
  // On mobile the input is icon-only until focused or typed into — this
  // tracks that separately from `open` (which governs the results dropdown)
  // since the input should stay expanded while focused even with no query.
  const [mobileFocused, setMobileFocused] = useState(false);
  // Which query `results` was fetched for — lets `loading` be derived
  // (debouncedQuery set but results not yet caught up to it) instead of
  // tracked as its own flag that would need setting synchronously in the
  // fetch effect's body.
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // Debounce the raw query before it drives a fetch. Opening the dropdown
  // happens inside the timer callback (not the effect body) so there's a
  // real async boundary between render and the state update.
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      setDebouncedQuery(trimmed);
      if (trimmed) setOpen(true);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) return;

    let cancelled = false;

    getEntries({ category: "ALL", search: debouncedQuery }).then((data) => {
      if (cancelled) return;
      setResults(data);
      setResultsFor(debouncedQuery);
      setExpanded(false);
      setHighlightedIndex(-1);
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const loading = debouncedQuery !== "" && resultsFor !== debouncedQuery;
  const currentResults = resultsFor === debouncedQuery ? results : null;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setMobileFocused(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  // On mobile the dropdown has room to scroll through everything, so skip
  // the desktop "See more" pagination and just show the full match list.
  const visibleResults = currentResults
    ? isMobile || expanded
      ? currentResults
      : currentResults.slice(0, RESULT_LIMIT)
    : [];
  const hasMoreRow = !isMobile && !expanded && (currentResults?.length ?? 0) > RESULT_LIMIT;
  const stopCount = visibleResults.length + (hasMoreRow ? 1 : 0);

  function selectEntry(entry: Entry) {
    setQuery("");
    setOpen(false);
    setMobileFocused(false);
    setResultsFor(null);
    router.push(`/wall?entry=${entry.id}`);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    // Clearing the input should close the dropdown immediately rather than
    // waiting out the debounce — there's nothing left to search for.
    if (!value.trim()) {
      setOpen(false);
      setExpanded(false);
      setHighlightedIndex(-1);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setHighlightedIndex(-1);
      if (!query.trim()) {
        setMobileFocused(false);
        inputRef.current?.blur();
      } else {
        inputRef.current?.focus();
      }
      return;
    }

    if (!open || stopCount === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.min(index + 1, stopCount - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (highlightedIndex === -1) return;
      event.preventDefault();
      if (highlightedIndex === visibleResults.length) {
        setExpanded(true);
      } else {
        selectEntry(visibleResults[highlightedIndex]);
      }
    }
  }

  const activeDescendantId =
    highlightedIndex === -1
      ? undefined
      : highlightedIndex === visibleResults.length
        ? `${listboxId}-see-more`
        : `${listboxId}-${visibleResults[highlightedIndex]?.id}`;

  // Collapsed to an icon-only tap target until focused or typed into; once
  // active it overlays the full header row so it has room to grow instead
  // of squeezing in next to the Add Stash button.
  const mobileCollapsed = isMobile && !mobileFocused && !query.trim();

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center transition-all duration-200 ease-out",
        isMobile
          ? mobileCollapsed
            ? "w-10 shrink-0"
            : "absolute inset-y-0 left-0 right-16 z-40 bg-background px-4 sm:px-6"
          : "flex-1"
      )}
    >
      <div className="relative w-full">
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
            mobileCollapsed ? "left-1/2 -translate-x-1/2" : "left-3"
          )}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setMobileFocused(true);
            if (currentResults !== null) setOpen(true);
          }}
          placeholder={mobileCollapsed ? undefined : "Search your stash..."}
          aria-label="Search your stash"
          className={cn(
            "h-9 w-full text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary",
            mobileCollapsed
              ? "h-10 cursor-pointer border-none bg-transparent p-0"
              : cn(
                  "border border-border bg-card pr-9 pl-9",
                  open ? "rounded-t-xl rounded-b-none border-b-transparent" : "rounded-xl"
                )
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              handleQueryChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute top-1/2 right-2.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}

        {open && (
          <div
            className={cn(
              "z-50 border-border bg-card shadow-lg",
              isMobile
                ? "fixed inset-x-4 top-20 max-h-[70vh] overflow-y-auto rounded-xl border"
                : "absolute inset-x-0 top-full overflow-hidden rounded-b-xl border border-t-0"
            )}
          >
            {loading ? (
              <div className="flex flex-col gap-2 p-3" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-9 animate-pulse rounded-lg bg-foreground/5" />
                ))}
              </div>
            ) : currentResults && currentResults.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches for &ldquo;{debouncedQuery}&rdquo;
              </p>
            ) : currentResults && currentResults.length > 0 ? (
              <ul
                id={listboxId}
                role="listbox"
                aria-label="Search results"
                onMouseLeave={() => setHighlightedIndex(-1)}
                className={cn("flex flex-col p-1.5", expanded && "max-h-80 overflow-y-auto")}
              >
                {visibleResults.map((entry, index) => {
                  const CategoryIcon = CATEGORY_ICONS[entry.category as Category];
                  const optionId = `${listboxId}-${entry.id}`;
                  const highlighted = index === highlightedIndex;

                  return (
                    <li key={entry.id} role="presentation">
                      <button
                        type="button"
                        tabIndex={-1}
                        id={optionId}
                        role="option"
                        aria-selected={highlighted}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => selectEntry(entry)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150 ease-out",
                          highlighted ? "translate-x-1 bg-accent" : "hover:translate-x-1 hover:bg-accent"
                        )}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-foreground/5">
                          {entry.coverUrl ? (
                            <img
                              src={entry.coverUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <CategoryIcon className="size-4 text-foreground/30" aria-hidden="true" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                          {entry.title}
                        </span>
                        <CategoryIcon
                          className="size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  );
                })}

                {hasMoreRow && currentResults && (
                  <li role="presentation">
                    <button
                      type="button"
                      tabIndex={-1}
                      id={`${listboxId}-see-more`}
                      role="option"
                      aria-selected={highlightedIndex === visibleResults.length}
                      onMouseEnter={() => setHighlightedIndex(visibleResults.length)}
                      onClick={() => setExpanded(true)}
                      className={cn(
                        "w-full rounded-lg px-2.5 py-2 text-center text-sm font-medium text-primary transition-all duration-150 ease-out",
                        highlightedIndex === visibleResults.length
                          ? "scale-[1.02] bg-accent"
                          : "hover:scale-[1.02] hover:bg-accent"
                      )}
                    >
                      See more ({currentResults.length - RESULT_LIMIT})
                    </button>
                  </li>
                )}
              </ul>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
