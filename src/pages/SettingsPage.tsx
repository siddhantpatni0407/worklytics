import { Info, Database, Monitor, Code2, Activity } from "lucide-react";

const INFO_ROWS = [
  { label: "Application",   value: "Worklytics v1.0.0"             },
  { label: "Frontend",      value: "React 18 + TypeScript + Vite"  },
  { label: "Backend",       value: "Rust + Tauri 2"                },
  { label: "Database",      value: "SQLite (bundled via rusqlite)"  },
  { label: "Storage",       value: "Local — 100% offline"          },
];

const STATUS_RULES = [
  { priority: 1, status: "Leave",   color: "bg-amber-500",  desc: "Overrides everything. Approved leave on any day." },
  { priority: 2, status: "Holiday", color: "bg-red-500",    desc: "Overrides work status but not Leave." },
  { priority: 3, status: "WFO/WFH/WFC", color: "bg-blue-500", desc: "Manual work status. Overrides Weekend/Unset." },
  { priority: 4, status: "Weekend", color: "bg-slate-400",  desc: "Auto-detected Saturday & Sunday." },
  { priority: 5, status: "Unset",   color: "bg-gray-200",   desc: "Weekday with no status set." },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="page-title">Settings & About</h2>
        <p className="page-subtitle">Application information and status priority rules</p>
      </div>

      {/* App info card */}
      <div className="wl-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <Info className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-slate-700">About Worklytics</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {INFO_ROWS.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-medium text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Priority rules */}
      <div className="wl-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <Activity className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-slate-700">Status Priority Rules</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {STATUS_RULES.map((r) => (
            <div key={r.priority} className="flex items-center gap-4 px-5 py-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                {r.priority}
              </span>
              <div className="flex items-center gap-2 min-w-[120px]">
                <span className={`h-3 w-3 rounded-sm ${r.color}`} />
                <span className="text-sm font-medium text-slate-800">{r.status}</span>
              </div>
              <span className="text-sm text-slate-500">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="wl-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <Code2 className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-slate-700">Technology Stack</h3>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-3">
          {[
            { name: "React 18",     desc: "Frontend UI"            },
            { name: "TypeScript",   desc: "Type-safe JavaScript"   },
            { name: "Tauri 2",      desc: "Desktop runtime"        },
            { name: "Rust",         desc: "Backend & commands"     },
            { name: "SQLite",       desc: "Local database"         },
            { name: "Tailwind CSS", desc: "Utility-first styling"  },
            { name: "Recharts",     desc: "Analytics charts"       },
            { name: "Zustand",      desc: "State management"       },
          ].map(({ name, desc }) => (
            <div key={name} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-brand-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-700">{name}</p>
                <p className="text-[11px] text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
