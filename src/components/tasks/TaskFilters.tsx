import { Search, X, Filter } from "lucide-react";
import type { TaskStatus } from "@/types";

export interface TaskFiltersState {
  search: string;
  status: TaskStatus | "ALL";
  tag: string;
  dateFrom: string;
  dateTo: string;
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  allTags: string[];
  onChange: (filters: TaskFiltersState) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus | "ALL"; label: string }[] = [
  { value: "ALL",         label: "All Statuses" },
  { value: "IN_PROGRESS", label: "In Progress"  },
  { value: "COMPLETED",   label: "Completed"    },
  { value: "BLOCKED",     label: "Blocked"      },
];

export const DEFAULT_FILTERS: TaskFiltersState = {
  search: "",
  status: "ALL",
  tag: "",
  dateFrom: "",
  dateTo: "",
};

export default function TaskFilters({ filters, allTags, onChange, onReset }: TaskFiltersProps) {
  const set = (field: keyof TaskFiltersState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onChange({ ...filters, [field]: e.target.value });

  const hasActive =
    filters.search ||
    filters.status !== "ALL" ||
    filters.tag ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="wl-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-app-muted" />
        <span className="text-sm font-semibold text-app-primary">Filters</span>
        {hasActive && (
          <button
            onClick={onReset}
            className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative col-span-2 md:col-span-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-muted pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={set("search")}
            placeholder="Search tasks…"
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

        {/* Date from */}
        <div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={set("dateFrom")}
            className="wl-input"
            title="From date"
          />
        </div>

        {/* Date to */}
        <div>
          <input
            type="date"
            value={filters.dateTo}
            onChange={set("dateTo")}
            className="wl-input"
            title="To date"
          />
        </div>
      </div>
    </div>
  );
}
