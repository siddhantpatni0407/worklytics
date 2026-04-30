import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Sun, Moon, Monitor, Clock, UserCircle2 } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import type { ThemeMode } from "@/types";

const ROUTE_TITLES: Record<string, { title: string; subtitle: string; emoji: string }> = {
  "/home":      { title: "Home",         subtitle: "Welcome back — here's your overview",     emoji: "🏠" },
  "/":          { title: "Calendar",     subtitle: "Track your daily work status",             emoji: "📅" },
  "/dashboard": { title: "Analytics",   subtitle: "Monthly & yearly insights",                emoji: "📊" },
  "/holidays":  { title: "Holidays",    subtitle: "Manage public & custom holidays",          emoji: "🎉" },
  "/leaves":    { title: "Leaves",      subtitle: "Track and manage leave records",           emoji: "🌿" },
  "/tasks":     { title: "Tasks",       subtitle: "Daily task updates & tracking",            emoji: "✅" },
  "/notes":     { title: "Sticky Notes",subtitle: "Quick thoughts, reminders & ideas",       emoji: "📌" },
  "/settings":  { title: "Settings",    subtitle: "Application preferences & configuration", emoji: "⚙️" },
  "/about":     { title: "About",       subtitle: "App info, tech stack & status rules",      emoji: "ℹ️" },
  "/profile":   { title: "Profile",     subtitle: "Manage your personal information",         emoji: "👤" },
};

const THEME_ICONS: Record<ThemeMode, React.ReactNode> = {
  light:  <Sun  className="h-3.5 w-3.5" />,
  dark:   <Moon className="h-3.5 w-3.5" />,
  system: <Monitor className="h-3.5 w-3.5" />,
};

const NEXT_THEME: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark:  "system",
  system: "light",
};

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { settings, updateSettings, profile } = useAppStore();
  const meta = ROUTE_TITLES[pathname] ?? ROUTE_TITLES["/"];

  const [time, setTime] = useState(() => new Date());
  const today = format(new Date(), "EEE, dd MMM yyyy");

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: settings.timezone,
  });

  const tzLabel = new Intl.DateTimeFormat("en", {
    timeZoneName: "short",
    timeZone: settings.timezone,
  })
    .formatToParts(new Date())
    .find((p) => p.type === "timeZoneName")?.value ?? settings.timezone;

  const cycleTheme = () => updateSettings({ theme: NEXT_THEME[settings.theme] });

  return (
    <header
      style={{ backgroundColor: "var(--header-bg)", borderColor: "var(--header-border)" }}
      className="flex h-14 items-center justify-between border-b px-5 flex-shrink-0 gap-4"
    >
      {/* Left: page title with accent bar */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-7 w-1 rounded-full bg-brand-500 flex-shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-app-primary leading-none">{meta.title}</h1>
          </div>
          <p className="text-[11px] text-app-muted mt-0.5 truncate">{meta.subtitle}</p>
        </div>
      </div>

      {/* Right: clock, date, theme */}
      <div className="flex items-center gap-1.5 no-drag flex-shrink-0">
        {/* Clock pill */}
        <div className="flex items-center gap-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 px-3 py-1.5">
          <Clock className="h-3 w-3 text-brand-500" />
          <span className="text-xs font-mono font-semibold text-brand-600 dark:text-brand-400 tabular-nums">
            {timeStr}
          </span>
          <span className="text-[10px] text-app-muted hidden sm:inline">{tzLabel}</span>
        </div>

        {/* Date pill */}
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 border border-[var(--border-card)] px-3 py-1.5 hidden sm:block">
          <span className="text-xs font-medium text-app-primary">{today}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800
                     border border-[var(--border-card)] px-2.5 py-1.5
                     text-app-secondary hover:text-app-primary hover:border-brand-400
                     transition-all duration-150 cursor-pointer"
          title={`Theme: ${settings.theme} — click to cycle`}
        >
          {THEME_ICONS[settings.theme]}
          <span className="text-[10px] font-medium capitalize hidden sm:inline">{settings.theme}</span>
        </button>

        {/* User avatar pill */}
        <button
          onClick={() => navigate("/profile")}
          title="View profile"
          className="flex items-center gap-2 rounded-lg border border-[var(--border-card)]
                     bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5
                     hover:border-brand-400 transition-all duration-150 cursor-pointer"
        >
          {profile.name ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[9px] font-extrabold text-white flex-shrink-0">
              {profile.avatarInitials}
            </span>
          ) : (
            <UserCircle2 className="h-4 w-4 text-app-muted" />
          )}
          {profile.name && (
            <span className="text-xs font-medium text-app-primary hidden sm:inline max-w-[120px] truncate">
              {profile.name}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
