import { format } from "date-fns";
import { cn } from "@/utils/cn";
import type { DayStatus, EffectiveStatus } from "@/types";

interface CalendarCellProps {
  date: Date;
  dayStatus: DayStatus | null;
  inCurrentMonth: boolean;
  isToday: boolean;
  taskCount?: number;
  onClick: () => void;
}

const STATUS_STYLES: Record<EffectiveStatus, { cell: string; label: string; dot: string; badge: string }> = {
  WFO: {
    cell:  "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-950/50",
    label: "text-blue-700 dark:text-blue-300",
    dot:   "bg-blue-500",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  WFH: {
    cell:  "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
    label: "text-emerald-700 dark:text-emerald-300",
    dot:   "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  WFC: {
    cell:  "bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/40 hover:bg-violet-100 dark:hover:bg-violet-950/50",
    label: "text-violet-700 dark:text-violet-300",
    dot:   "bg-violet-500",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  },
  LEAVE: {
    cell:  "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40",
    label: "text-amber-700 dark:text-amber-300",
    dot:   "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  HOLIDAY: {
    cell:  "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/40",
    label: "text-red-600 dark:text-red-300",
    dot:   "bg-red-500",
    badge: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  WEEKEND: {
    cell:  "bg-slate-50/60 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800",
    label: "text-slate-400 dark:text-slate-600",
    dot:   "",
    badge: "",
  },
  UNSET: {
    cell:  "bg-[var(--bg-card)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]",
    label: "text-slate-300 dark:text-slate-700",
    dot:   "",
    badge: "",
  },
};

const STATUS_LABEL: Record<EffectiveStatus, string> = {
  WFO: "WFO", WFH: "WFH", WFC: "WFC",
  LEAVE: "Leave", HOLIDAY: "Holiday", WEEKEND: "â€”", UNSET: "",
};

export default function CalendarCell({
  date, dayStatus, inCurrentMonth, isToday, taskCount = 0, onClick,
}: CalendarCellProps) {
  const status = dayStatus?.effectiveStatus ?? "UNSET";
  const styles = STATUS_STYLES[status];
  const dayNum = format(date, "d");
  const isEditable = !["HOLIDAY", "LEAVE"].includes(status) && inCurrentMonth;

  return (
    <div
      onClick={onClick}
      className={cn(
        "min-h-[88px] border-b border-r p-2 flex flex-col gap-1 select-none group transition-colors duration-100",
        inCurrentMonth ? styles.cell : "bg-slate-50/40 dark:bg-slate-900/20 border-slate-100/50 dark:border-slate-800/50",
        isEditable ? "cursor-pointer" : "cursor-default",
        !inCurrentMonth && "opacity-30"
      )}
    >
      {/* Day number row */}
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "text-sm font-bold leading-none",
            isToday
              ? "flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white text-xs shadow-md"
              : inCurrentMonth
              ? (status === "WEEKEND" || status === "UNSET"
                  ? "text-app-secondary"
                  : styles.label)
              : "text-slate-300 dark:text-slate-700"
          )}
        >
          {dayNum}
        </span>

        <div className="flex items-center gap-1">
          {inCurrentMonth && taskCount > 0 && (
            <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 text-[9px] font-bold leading-none">
              {taskCount}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      {inCurrentMonth && status !== "UNSET" && status !== "WEEKEND" && (
        <div className="mt-auto">
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border",
            styles.badge
          )}>
            {styles.dot && <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", styles.dot)} />}
            {STATUS_LABEL[status]}
          </span>
          {status === "HOLIDAY" && dayStatus?.holidayName && (
            <p className="text-[9px] text-red-500 dark:text-red-400 truncate leading-tight mt-0.5 max-w-full">
              {dayStatus.holidayName}
            </p>
          )}
          {status === "LEAVE" && dayStatus?.leaveType && (
            <p className="text-[9px] text-amber-600 dark:text-amber-400 truncate leading-tight mt-0.5">
              {dayStatus.leaveType.replace(/_/g, " ")}
            </p>
          )}
        </div>
      )}

      {/* Weekend label */}
      {inCurrentMonth && status === "WEEKEND" && (
        <div className="mt-auto">
          <span className="text-[10px] text-slate-400 dark:text-slate-600 font-medium">Weekend</span>
        </div>
      )}

      {/* Notes indicator */}
      {inCurrentMonth && dayStatus?.workEntry?.notes && (
        <div className="flex items-center gap-0.5 mt-0.5">
          <div className="h-1 w-1 rounded-full bg-slate-400" />
          <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
            {dayStatus.workEntry.notes}
          </span>
        </div>
      )}

      {/* Quick-action hover hint */}
      {inCurrentMonth && isEditable && status === "UNSET" && (
        <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] text-app-muted">+ Set status</span>
        </div>
      )}
    </div>
  );
}
