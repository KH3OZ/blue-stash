"use client";

import { cn } from "@/lib/utils";
import { VIEW_MODES, VIEW_MODE_ICONS, VIEW_MODE_LABELS, type ViewMode } from "@/types/view-mode";

interface StashViewSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function StashViewSwitcher({ value, onChange }: StashViewSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Card view style"
      className="flex items-center gap-1 rounded-full border border-border bg-card p-1"
    >
      {VIEW_MODES.map((mode) => {
        const Icon = VIEW_MODE_ICONS[mode];
        const isActive = mode === value;

        return (
          <button
            key={mode}
            type="button"
            aria-pressed={isActive}
            aria-label={VIEW_MODE_LABELS[mode]}
            onClick={() => onChange(mode)}
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              isActive && "bg-primary text-primary-foreground hover:text-primary-foreground"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
