"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { Star, StarHalf } from "lucide-react";

import { cn } from "@/lib/utils";

const STAR_COUNT = 5;
const STEP = 0.5;

function clampToStep(raw: number) {
  return Math.min(STAR_COUNT, Math.max(0, Math.round(raw / STEP) * STEP));
}

function valueFromPointer(row: HTMLDivElement, clientX: number) {
  const rect = row.getBoundingClientRect();
  const ratio = (clientX - rect.left) / rect.width;
  return clampToStep(ratio * STAR_COUNT);
}

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number | null) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({ value, onChange, readOnly = false, size = "md", className }: StarRatingProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const iconSize = size === "sm" ? "size-4" : "size-6";
  const display = value ?? 0;

  function commit(next: number) {
    onChange?.(next === value ? null : next);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (readOnly || !onChange) return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    commit(valueFromPointer(event.currentTarget, event.clientX));
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (readOnly || !onChange || !draggingRef.current) return;
    onChange(valueFromPointer(event.currentTarget, event.clientX));
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (readOnly || !onChange) return;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(clampToStep(display + STEP));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(display - STEP <= 0 ? null : clampToStep(display - STEP));
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(null);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(STAR_COUNT);
    }
  }

  return (
    <div
      ref={rowRef}
      className={cn("inline-flex w-fit shrink-0 items-center gap-1", !readOnly && "cursor-pointer touch-none", className)}
      role={readOnly ? undefined : "slider"}
      aria-label={readOnly ? undefined : "Rating"}
      aria-valuemin={readOnly ? undefined : 0}
      aria-valuemax={readOnly ? undefined : STAR_COUNT}
      aria-valuenow={readOnly ? undefined : display}
      aria-valuetext={readOnly ? undefined : value === null ? "No rating" : `${value} out of ${STAR_COUNT} stars`}
      tabIndex={readOnly ? undefined : 0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((position) => {
        const raw = display - (position - 1);
        const fill = raw >= 1 ? 1 : raw >= STEP ? STEP : 0;
        const Icon = fill >= 1 ? Star : fill >= STEP ? StarHalf : Star;
        return (
          <Icon
            key={position}
            className={cn(
              iconSize,
              "transition-colors",
              fill > 0 ? "fill-primary text-primary" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
