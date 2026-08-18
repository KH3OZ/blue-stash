import {
  BookOpen,
  Calendar,
  Camera,
  Clapperboard,
  Film,
  Gamepad2,
  Headphones,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

export type Category =
  | "VIDEO"
  | "READING"
  | "GAMING"
  | "AUDIO"
  | "LIFE_MOMENTS"
  | "EVENTS"
  | "FILMS";

export const CATEGORIES: Category[] = [
  "VIDEO",
  "READING",
  "GAMING",
  "AUDIO",
  "LIFE_MOMENTS",
  "EVENTS",
  "FILMS",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  VIDEO: "Video",
  READING: "Reading",
  GAMING: "Gaming",
  AUDIO: "Audio",
  LIFE_MOMENTS: "Life Moments",
  EVENTS: "Events",
  FILMS: "Films",
};

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  VIDEO: Clapperboard,
  READING: BookOpen,
  GAMING: Gamepad2,
  AUDIO: Headphones,
  LIFE_MOMENTS: Camera,
  EVENTS: Calendar,
  FILMS: Film,
};

export type NavFilter = "ALL" | Category;

export const ALL_FILTER_ICON: LucideIcon = LayoutGrid;
export const ALL_FILTER_LABEL = "All";
