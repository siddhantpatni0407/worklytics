import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  BarChart3,
  PartyPopper,
  UmbrellaOff,
  Settings,
  Activity,
  ListTodo,
  StickyNote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAppStore } from "@/store/appStore";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { to: "/",          icon: CalendarDays, label: "Calendar"  },
      { to: "/tasks",     icon: ListTodo,     label: "Tasks"     },
      { to: "/notes",     icon: StickyNote,   label: "Notes"     },
      { to: "/dashboard", icon: BarChart3,    label: "Analytics" },
    ],
  },
  {
    label: "Manage",
    items: [
      { to: "/holidays",  icon: PartyPopper,  label: "Holidays"  },
      { to: "/leaves",    icon: UmbrellaOff,  label: "Leaves"    },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings",  icon: Settings,     label: "Settings"  },
    ],
  },
] as const;

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "flex flex-col bg-[#0f172a] border-r border-[#1e293b] transition-all duration-200 flex-shrink-0",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-[#1e293b] drag-region">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2.5 no-drag">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 flex-shrink-0">
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">
              Worklytics
            </span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 mx-auto no-drag">
            <Activity className="h-3.5 w-3.5 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "no-drag flex items-center justify-center h-6 w-6 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors flex-shrink-0",
            sidebarCollapsed && "mx-auto mt-0"
          )}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label}>
            {!sidebarCollapsed && (
              <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-slate-600">
                {label}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label: itemLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  title={sidebarCollapsed ? itemLabel : undefined}
                  className={({ isActive }) =>
                    cn(
                      "sidebar-item",
                      isActive && "sidebar-item-active",
                      sidebarCollapsed && "justify-center px-2"
                    )
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{itemLabel}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="border-t border-[#1e293b] px-4 py-3">
          <p className="text-[10px] text-slate-600">v2.0.0 · Offline-First</p>
        </div>
      )}
    </aside>
  );
}
