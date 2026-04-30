import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAppStore, applyAccentColor, computeInitials } from "@/store/appStore";
import { getAllSettings } from "@/utils/tauriCommands";
import type { ThemeMode, ThemeAccentColor } from "@/types";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { settings, updateSettings, updateProfile } = useAppStore();

  // Load persisted settings from SQLite on startup (DB is source of truth)
  useEffect(() => {
    getAllSettings().then((rows) => {
      const kv = Object.fromEntries(rows);
      const patch: Partial<typeof settings> = {};

      if (kv["theme"])         patch.theme        = kv["theme"] as ThemeMode;
      if (kv["accent_color"])  patch.accentColor   = kv["accent_color"] as ThemeAccentColor;
      if (kv["timezone"])      patch.timezone       = kv["timezone"];
      if (kv["year_start"])    patch.yearStart      = Number(kv["year_start"]);
      if (kv["year_end"])      patch.yearEnd        = Number(kv["year_end"]);
      if (kv["custom_statuses"]) { try { patch.customStatuses = JSON.parse(kv["custom_statuses"]); } catch { /* ignore */ } }
      if (kv["work_saturday"]) patch.workSaturday   = kv["work_saturday"] === "true";
      if (kv["work_sunday"])   patch.workSunday     = kv["work_sunday"] === "true";
      if (kv["sprints"])       { try { patch.sprints  = JSON.parse(kv["sprints"]);  } catch { /* ignore */ } }
      if (kv["projects"])      { try { patch.projects = JSON.parse(kv["projects"]); } catch { /* ignore */ } }
      if (kv["teams"])         { try { patch.teams    = JSON.parse(kv["teams"]);    } catch { /* ignore */ } }
      if (kv["developer_name"])   patch.developerName   = kv["developer_name"];
      if (kv["developer_email"])  patch.developerEmail  = kv["developer_email"];
      if (kv["developer_github"]) patch.developerGithub = kv["developer_github"];

      if (Object.keys(patch).length > 0) updateSettings(patch);

      // Load profile
      const name  = kv["profile_name"]  ?? "";
      const email = kv["profile_email"] ?? "";
      const role  = kv["profile_role"]  ?? "";
      updateProfile({ name, email, role, avatarInitials: computeInitials(name) });
    }).catch(() => { /* tauri not available in browser preview */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, [settings.theme]);

  // Apply accent color CSS variables
  useEffect(() => {
    applyAccentColor(settings.accentColor ?? "indigo");
  }, [settings.accentColor]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-app">
      <Sidebar />
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
