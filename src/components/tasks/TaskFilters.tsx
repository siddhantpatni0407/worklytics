import { Search, X, Filter, Calendar } from "lucide-react";
import { cn } from "@/utils/cn";
import type { TaskStatus } from "@/types";

// ─── Period type ──────────────────────────────────────────────────────────────
export type TaskPeriod = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR" | "ALL" | "CUSTOM";

export interface TaskFiltersState {
  search: string;
  status: TaskStatus | "ALL";
  tag: string;
  period: TaskPeriod;
  dateFrom: string; // only used when period === "CUSTOM"
  dateTo: string;   // only used when period === "CUSTOM"
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  allTags: string[];
  /** Resolved date range currently in effect (for display hint). */
  resolvedFrom: string;
  resolvedTo: string;
  onChange: (filters: TaskFiltersState) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus | "ALL"; label: string }[] = [
  { value: "ALL",         label: "All Statuses" },
  { value: "IN_PROGRESS", label: "In Progress"  },
  { value: "COMPLETED",   label: "Completed"    },
  { value: "BLOCKED",     label: "Blocked"      },
];

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
  period:   "THIS_MONTH",
  dateFrom: "",
  dateTo:   "",
};

export default function TaskFilters({
  filters,
  allTags,
  resolvedFrom,
  resolvedTo,
  onChange,
  onReset,
}: TaskFiltersProps) {
  const set = (field: keyof TaskFiltersState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onChange({ ...filters, [field]: e.target.value });

  const setPeriod = (period: TaskPeriod) => onChange({ ...filters, period });

  const hasActive =
    filters.search ||
    filters.status !== "ALL" ||
    filters.tag ||
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

      {/* ── Search / Status / Tag row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Tag */}
        <select value={filters.tag} onChange={set("tag")} className="wl-select">
          <option value="">All Tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
