import { Images, Rows3, type LucideIcon } from "lucide-react";

export type ViewMode = "polaroid" | "timeline";

export const VIEW_MODES: ViewMode[] = ["polaroid", "timeline"];

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  polaroid: "Polaroid",
  timeline: "Timeline",
};

export const VIEW_MODE_ICONS: Record<ViewMode, LucideIcon> = {
  polaroid: Images,
  timeline: Rows3,
};

export const DEFAULT_VIEW_MODE: ViewMode = "polaroid";
