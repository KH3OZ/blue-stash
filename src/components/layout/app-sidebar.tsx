"use client";

import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ALL_FILTER_ICON,
  ALL_FILTER_LABEL,
  CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type NavFilter,
} from "@/types/category";

const FILTERS: NavFilter[] = ["ALL", ...CATEGORIES];

function labelFor(filter: NavFilter) {
  return filter === "ALL" ? ALL_FILTER_LABEL : CATEGORY_LABELS[filter];
}

function iconFor(filter: NavFilter) {
  return filter === "ALL" ? ALL_FILTER_ICON : CATEGORY_ICONS[filter];
}

export function AppSidebar() {
  const [active, setActive] = useState<NavFilter>("ALL");

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarTrigger className="text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {FILTERS.map((filter) => {
                  const Icon = iconFor(filter);
                  const isActive = active === filter;

                  return (
                    <SidebarMenuItem key={filter}>
                      <SidebarMenuButton
                        isActive={isActive}
                        aria-current={isActive ? "true" : undefined}
                        tooltip={labelFor(filter)}
                        onClick={() => setActive(filter)}
                      >
                        <Icon aria-hidden="true" />
                        <span>{labelFor(filter)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
