import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { CategoryFilterProvider } from "@/context/category-filter-context";
import { AddStashModalProvider } from "@/context/add-stash-modal-context";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlueStash",
  description: "Your personal stash of videos, reads, games, audio, and life moments.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <CategoryFilterProvider>
            <AddStashModalProvider>
              <SidebarProvider defaultOpen={sidebarOpen} className="flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                  <AppSidebar />
                  <SidebarInset>
                    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
                      {children}
                    </main>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            </AddStashModalProvider>
          </CategoryFilterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
