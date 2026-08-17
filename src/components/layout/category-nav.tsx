"use client";

import { useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import {
  ALL_FILTER_ICON,
  ALL_FILTER_LABEL,
  CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type NavFilter,
} from "@/types/category";

const FILTERS: NavFilter[] = ["ALL", ...CATEGORIES];

function labelFor(filter: NavFilter) {
  return filter === "ALL" ? ALL_FILTER_LABEL : CATEGORY_LABELS[filter];
}

function iconFor(filter: NavFilter) {
  return filter === "ALL" ? ALL_FILTER_ICON : CATEGORY_ICONS[filter];
}

export function CategoryNav() {
  const [active, setActive] = useState<NavFilter>("ALL");

  return (
    <nav
      aria-label="Filter by category"
      className="border-b border-border bg-background"
    >
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
        {FILTERS.map((filter) => {
          const Icon = iconFor(filter);
          const isActive = active === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActive(filter)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-secondary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {labelFor(filter)}
              {isActive && (
                <motion.span
                  layoutId="category-nav-active"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-secondary shadow-[0_0_8px_0_var(--secondary)]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
