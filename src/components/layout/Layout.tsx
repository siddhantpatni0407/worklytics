import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAppStore } from "@/store/appStore";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { settings } = useAppStore();

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
    } else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, [settings.theme]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-app">
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-app">
          <div className="mx-auto max-w-7xl animate-[fadeIn_0.2s_ease-in-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
