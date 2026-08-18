"use client";

import { useState } from "react";

import { StashCardPolaroid } from "@/components/stash/stash-card-polaroid";
import { StashTimelineRow } from "@/components/stash/stash-timeline-row";
import { StashViewSwitcher } from "@/components/stash/stash-view-switcher";
import type { Entry } from "@/generated/prisma/client";
import { DEFAULT_VIEW_MODE, type ViewMode } from "@/types/view-mode";

interface StashCollectionProps {
  entries: Entry[];
}

export function StashCollection({ entries }: StashCollectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(DEFAULT_VIEW_MODE);

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <StashViewSwitcher value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "timeline" ? (
        <div className="flex flex-col">
          {entries.map((entry) => (
            <StashTimelineRow key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, index) => (
            <StashCardPolaroid key={entry.id} entry={entry} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
