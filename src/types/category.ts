import {
  BookOpen,
  Camera,
  Clapperboard,
  Gamepad2,
  Headphones,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

export type Category = "VIDEO" | "READING" | "GAMING" | "AUDIO" | "LIFE_MOMENTS";

export const CATEGORIES: Category[] = [
  "VIDEO",
  "READING",
  "GAMING",
  "AUDIO",
  "LIFE_MOMENTS",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  VIDEO: "Video",
  READING: "Reading",
  GAMING: "Gaming",
  AUDIO: "Audio",
  LIFE_MOMENTS: "Life Moments",
};

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  VIDEO: Clapperboard,
  READING: BookOpen,
  GAMING: Gamepad2,
  AUDIO: Headphones,
  LIFE_MOMENTS: Camera,
};

export type NavFilter = "ALL" | Category;

export const ALL_FILTER_ICON: LucideIcon = LayoutGrid;
export const ALL_FILTER_LABEL = "All";
