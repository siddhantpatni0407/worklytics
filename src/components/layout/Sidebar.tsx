import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  BarChart3,
  PartyPopper,
  UmbrellaOff,
  Settings,
  Activity,
} from "lucide-react";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { to: "/",          icon: CalendarDays, label: "Calendar"  },
  { to: "/dashboard", icon: BarChart3,    label: "Analytics" },
  { to: "/holidays",  icon: PartyPopper,  label: "Holidays"  },
  { to: "/leaves",    icon: UmbrellaOff,  label: "Leaves"    },
  { to: "/settings",  icon: Settings,     label: "Settings"  },
] as const;

export default function Sidebar() {
  return (
    <aside className="flex w-60 flex-col bg-sidebar-bg border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border drag-region">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
          <Activity className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-white tracking-tight no-drag">
          Worklytics
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Navigation
        </p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "sidebar-item",
                isActive && "sidebar-item-active"
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] text-slate-600">v1.0.0 · Offline-First</p>
      </div>
    </aside>
  );
}
