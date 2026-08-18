"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { NavFilter } from "@/types/category";

type CategoryFilterContextValue = {
  activeFilter: NavFilter;
  setActiveFilter: (filter: NavFilter) => void;
};

const CategoryFilterContext = createContext<CategoryFilterContextValue | null>(null);

export function CategoryFilterProvider({ children }: { children: ReactNode }) {
  const [activeFilter, setActiveFilter] = useState<NavFilter>("ALL");

  return (
    <CategoryFilterContext.Provider value={{ activeFilter, setActiveFilter }}>
      {children}
    </CategoryFilterContext.Provider>
  );
}

export function useCategoryFilter() {
  const context = useContext(CategoryFilterContext);

  if (!context) {
    throw new Error("useCategoryFilter must be used within a CategoryFilterProvider");
  }

  return context;
}
