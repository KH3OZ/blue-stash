export type SortOption = "NEWEST" | "OLDEST" | "RATING" | "ALPHABETICAL";

export const DEFAULT_SORT: SortOption = "NEWEST";

export const SORT_LABELS: Record<SortOption, string> = {
  NEWEST: "Newest first",
  OLDEST: "Oldest first",
  RATING: "Highest rating",
  ALPHABETICAL: "A–Z",
};
