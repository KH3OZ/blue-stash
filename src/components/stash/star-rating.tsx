"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { Star, StarHalf } from "lucide-react";

import { cn } from "@/lib/utils";

const STAR_COUNT = 5;
const MAX_POINTS = 10;
const POINTS_PER_STAR = MAX_POINTS / STAR_COUNT;

function clampPoints(raw: number) {
  return Math.min(MAX_POINTS, Math.max(0, Math.round(raw)));
}

function pointsFromPointer(row: HTMLDivElement, clientX: number) {
  const rect = row.getBoundingClientRect();
  const ratio = (clientX - rect.left) / rect.width;
  return clampPoints(ratio * MAX_POINTS);
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
    if (next <= 0) {
      onChange?.(null);
      return;
    }
    onChange?.(next === value ? null : next);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (readOnly || !onChange) return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    commit(pointsFromPointer(event.currentTarget, event.clientX));
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (readOnly || !onChange || !draggingRef.current) return;
    const next = pointsFromPointer(event.currentTarget, event.clientX);
    onChange(next <= 0 ? null : next);
  }

  function handlePointerUp() {
    draggingRef.current = false;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (readOnly || !onChange) return;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(clampPoints(display + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(display - 1 <= 0 ? null : clampPoints(display - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(null);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(MAX_POINTS);
    }
  }

  return (
    <div
      ref={rowRef}
      className={cn("inline-flex w-fit shrink-0 items-center gap-1", !readOnly && "cursor-pointer touch-none", className)}
      role={readOnly ? undefined : "slider"}
      aria-label={readOnly ? undefined : "Rating"}
      aria-valuemin={readOnly ? undefined : 0}
      aria-valuemax={readOnly ? undefined : MAX_POINTS}
      aria-valuenow={readOnly ? undefined : display}
      aria-valuetext={readOnly ? undefined : value === null ? "No rating" : `${value} out of ${MAX_POINTS}`}
      tabIndex={readOnly ? undefined : 0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((position) => {
        const raw = display - (position - 1) * POINTS_PER_STAR;
        const fill = raw >= POINTS_PER_STAR ? 1 : raw >= POINTS_PER_STAR / 2 ? 0.5 : 0;
        const Icon = fill >= 1 ? Star : fill >= 0.5 ? StarHalf : Star;
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
