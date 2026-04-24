import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Sun, Moon, Monitor, Clock } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import type { ThemeMode } from "@/types";

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/":          { title: "Calendar",     subtitle: "Track your daily work status"        },
  "/dashboard": { title: "Analytics",   subtitle: "Monthly & yearly insights"           },
  "/holidays":  { title: "Holidays",    subtitle: "Manage public & custom holidays"     },
  "/leaves":    { title: "Leaves",      subtitle: "Track and manage leave records"       },
  "/tasks":     { title: "Tasks",       subtitle: "Daily task updates & tracking"        },
  "/notes":     { title: "Sticky Notes",subtitle: "Quick thoughts, reminders & ideas"  },
  "/settings":  { title: "Settings",    subtitle: "Application preferences & about"     },
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
  const { settings, updateSettings } = useAppStore();
  const meta = ROUTE_TITLES[pathname] ?? ROUTE_TITLES["/"];

  const [time, setTime] = useState(() => new Date());
  const today = format(new Date(), "EEE, dd MMM yyyy");

  // Real-time clock — updates every second
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

  // Abbreviation for the configured timezone
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
      className="flex h-14 items-center justify-between border-b px-6 flex-shrink-0"
    >
      <div>
        <h1 className="text-sm font-semibold text-app-primary">{meta.title}</h1>
        <p className="text-xs text-app-muted">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-2 no-drag">
        {/* Clock */}
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5">
          <Clock className="h-3 w-3 text-app-muted" />
          <span className="text-xs font-mono font-medium text-app-primary tabular-nums">
            {timeStr}
          </span>
          <span className="text-[10px] text-app-muted">{tzLabel}</span>
        </div>

        {/* Date */}
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5">
          <span className="text-xs font-medium text-app-primary">{today}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800
                     px-2.5 py-1.5 text-app-secondary hover:text-app-primary
                     transition-colors duration-150 cursor-pointer"
          title={`Theme: ${settings.theme} — click to cycle`}
        >
          {THEME_ICONS[settings.theme]}
          <span className="text-[10px] font-medium capitalize">{settings.theme}</span>
        </button>
      </div>
    </header>
  );
}
