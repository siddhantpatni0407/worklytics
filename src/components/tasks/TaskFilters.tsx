import { Search, X, Filter, Calendar, Layers, Briefcase, Users } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAppStore } from "@/store/appStore";

// ─── Period type ──────────────────────────────────────────────────────────────
export type TaskPeriod = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR" | "ALL" | "CUSTOM";

export interface TaskFiltersState {
  search: string;
  status: string;       // "ALL" or any status value
  tag: string;
  sprint: string;       // "" = all
  project: string;      // "" = all
  team: string;         // "" = all
  period: TaskPeriod;
  dateFrom: string; // only used when period === "CUSTOM"
  dateTo: string;   // only used when period === "CUSTOM"
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  allTags: string[];
  allSprints: string[];
  allProjects: string[];
  allTeams: string[];
  /** Resolved date range currently in effect (for display hint). */
  resolvedFrom: string;
  resolvedTo: string;
  onChange: (filters: TaskFiltersState) => void;
  onReset: () => void;
}

const PERIOD_OPTIONS: { value: TaskPeriod; label: string }[] = [
  { value: "TODAY",      label: "Today"      },
  { value: "THIS_WEEK",  label: "This Week"  },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "THIS_YEAR",  label: "This Year"  },
  { value: "ALL",        label: "All Time"   },
  { value: "CUSTOM",     label: "Custom"     },
];

export const DEFAULT_FILTERS: TaskFiltersState = {
  search:   "",
  status:   "ALL",
  tag:      "",
  sprint:   "",
  project:  "",
  team:     "",
  period:   "THIS_MONTH",
  dateFrom: "",
  dateTo:   "",
};

export default function TaskFilters({
  filters,
  allTags,
  allSprints,
  allProjects,
  allTeams,
  resolvedFrom,
  resolvedTo,
  onChange,
  onReset,
}: TaskFiltersProps) {
  const { settings } = useAppStore();
  const statusOptions = [
    { value: "ALL",         label: "All Statuses" },
    { value: "TODO",        label: "To Do"        },
    { value: "IN_PROGRESS", label: "In Progress"  },
    { value: "COMPLETED",   label: "Completed"    },
    { value: "BLOCKED",     label: "Blocked"      },
    ...(settings.customStatuses ?? []).map((s) => ({
      value: s,
      label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    })),
  ];

  const set = (field: keyof TaskFiltersState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onChange({ ...filters, [field]: e.target.value });

  const setPeriod = (period: TaskPeriod) => onChange({ ...filters, period });

  const hasActive =
    filters.search ||
    filters.status !== "ALL" ||
    filters.tag ||
    filters.sprint ||
    filters.project ||
    filters.team ||
    filters.period !== "THIS_MONTH";

  return (
    <div className="wl-card p-4 space-y-3">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-app-muted" />
        <span className="text-sm font-semibold text-app-primary">Filters</span>
        {hasActive && (
          <button
            onClick={onReset}
            className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* ── Period quick-select ────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {PERIOD_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              filters.period === value
                ? "bg-brand-600 border-brand-600 text-white"
                : "border-[var(--border-card)] text-app-secondary hover:border-brand-400 hover:text-brand-600"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Custom date range (only when CUSTOM selected) ─────────────── */}
      {filters.period === "CUSTOM" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="wl-label text-[11px] mb-1">From</label>
            <input type="date" value={filters.dateFrom} onChange={set("dateFrom")} className="wl-input" />
          </div>
          <div>
            <label className="wl-label text-[11px] mb-1">To</label>
            <input type="date" value={filters.dateTo} onChange={set("dateTo")} className="wl-input" />
          </div>
        </div>
      ) : (
        /* Show the resolved range as a readable hint */
        resolvedFrom && (
          <div className="flex items-center gap-1.5 text-xs text-app-muted">
            <Calendar className="h-3 w-3" />
            <span>
              {resolvedFrom === resolvedTo
                ? resolvedFrom
                : `${resolvedFrom} → ${resolvedTo}`}
            </span>
          </div>
        )
      )}

      {/* ── Search / Status row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-muted pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={set("search")}
            placeholder="Search title, details, notes…"
            className="wl-input pl-8"
          />
        </div>

        {/* Status */}
        <select value={filters.status} onChange={set("status")} className="wl-select">
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Sprint / Project / Team / Tag row ─────────────────────────── */}
      {(allSprints.length > 0 || allProjects.length > 0 || allTeams.length > 0 || allTags.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Sprint */}
          {allSprints.length > 0 && (
            <div className="relative">
              <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-400 pointer-events-none" />
              <select value={filters.sprint} onChange={set("sprint")} className="wl-select pl-8">
                <option value="">All Sprints</option>
                {allSprints.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Project */}
          {allProjects.length > 0 && (
            <div className="relative">
              <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-teal-400 pointer-events-none" />
              <select value={filters.project} onChange={set("project")} className="wl-select pl-8">
                <option value="">All Projects</option>
                {allProjects.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {/* Team */}
          {allTeams.length > 0 && (
            <div className="relative">
              <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-orange-400 pointer-events-none" />
              <select value={filters.team} onChange={set("team")} className="wl-select pl-8">
                <option value="">All Teams</option>
                {allTeams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* Tag */}
          {allTags.length > 0 && (
            <select value={filters.tag} onChange={set("tag")} className="wl-select">
              <option value="">All Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ── Active metadata chips ──────────────────────────────────────── */}
      {(filters.sprint || filters.project || filters.team || filters.tag) && (
        <div className="flex flex-wrap gap-1.5">
          {filters.sprint && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Layers className="h-3 w-3" />{filters.sprint}
              <button onClick={() => onChange({ ...filters, sprint: "" })} className="hover:text-red-500 ml-0.5"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {filters.project && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Briefcase className="h-3 w-3" />{filters.project}
              <button onClick={() => onChange({ ...filters, project: "" })} className="hover:text-red-500 ml-0.5"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {filters.team && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
              <Users className="h-3 w-3" />{filters.team}
              <button onClick={() => onChange({ ...filters, team: "" })} className="hover:text-red-500 ml-0.5"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {filters.tag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
              #{filters.tag}
              <button onClick={() => onChange({ ...filters, tag: "" })} className="hover:text-red-500 ml-0.5"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
