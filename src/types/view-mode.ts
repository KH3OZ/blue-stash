import { Grid2x2, Images, Rows3, type LucideIcon } from "lucide-react";

export type ViewMode = "editorial" | "polaroid" | "timeline";

export const VIEW_MODES: ViewMode[] = ["editorial", "polaroid", "timeline"];

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  editorial: "Editorial",
  polaroid: "Polaroid",
  timeline: "Timeline",
};

export const VIEW_MODE_ICONS: Record<ViewMode, LucideIcon> = {
  editorial: Grid2x2,
  polaroid: Images,
  timeline: Rows3,
};

export const DEFAULT_VIEW_MODE: ViewMode = "editorial";
