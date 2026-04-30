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
  PanelLeftClose,
  PanelLeftOpen,
  Info,
  Home,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAppStore } from "@/store/appStore";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/home",      icon: Home,         label: "Home"      },
      { to: "/",          icon: CalendarDays, label: "Calendar"  },
      { to: "/dashboard", icon: BarChart3,    label: "Analytics" },
    ],
  },
  {
    label: "Work",
    items: [
      { to: "/tasks",     icon: ListTodo,     label: "Tasks"     },
      { to: "/notes",     icon: StickyNote,   label: "Notes"     },
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
      { to: "/about",     icon: Info,          label: "About"     },
      { to: "/profile",   icon: UserCircle2,   label: "Profile"   },
    ],
  },
] as const;

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, profile } = useAppStore();

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 ease-in-out flex-shrink-0 relative z-10",
        sidebarCollapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border drag-region flex-shrink-0",
          sidebarCollapsed ? "justify-center px-2" : "px-4 gap-3"
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 flex-shrink-0 shadow-md no-drag">
          <Activity className="h-4 w-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0 no-drag">
            <span className="text-sm font-bold text-white tracking-tight leading-tight">Worklytics</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Offline · v2.0</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden space-y-1">
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label} className="mb-3">
            {!sidebarCollapsed && (
              <p className="px-3 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600 select-none">
                {label}
              </p>
            )}
            {sidebarCollapsed && <div className="mx-3 my-2 h-px bg-slate-800" />}
            <div className="space-y-0.5">
              {items.map(({ to, icon: Icon, label: itemLabel }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/" || to === "/home"}
                  title={sidebarCollapsed ? itemLabel : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 select-none",
                      sidebarCollapsed ? "justify-center px-0 py-2.5 mx-1" : "px-3 py-2.5",
                      isActive
                        ? "bg-brand-600/20 text-brand-400 border border-brand-600/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] flex-shrink-0 transition-colors",
                          isActive ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300"
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="truncate">{itemLabel}</span>
                      )}
                      {!sidebarCollapsed && isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile card at bottom */}
      {profile.name && (
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "mx-2 mb-2 flex items-center gap-2.5 rounded-xl p-2.5 border transition-all duration-150",
              isActive
                ? "bg-brand-600/20 border-brand-600/30"
                : "border-transparent hover:bg-slate-800/60"
            )
          }
          title={sidebarCollapsed ? profile.name : undefined}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 flex-shrink-0 shadow-sm">
            <span className="text-[11px] font-extrabold text-white">{profile.avatarInitials}</span>
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{profile.name}</p>
              {profile.role && <p className="text-[9px] text-slate-500 truncate">{profile.role}</p>}
            </div>
          )}
        </NavLink>
      )}

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border px-2 py-2 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className={cn(
            "no-drag w-full flex items-center rounded-lg py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors",
            sidebarCollapsed ? "justify-center px-0" : "px-3 gap-2.5"
          )}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="text-xs font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
