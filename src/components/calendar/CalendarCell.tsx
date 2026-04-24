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

const STATUS_BG: Record<EffectiveStatus, string> = {
  WFO:     "bg-blue-50    dark:bg-blue-900/20  border-blue-200   dark:border-blue-800   hover:bg-blue-100   dark:hover:bg-blue-900/30",
  WFH:     "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
  WFC:     "bg-violet-50  dark:bg-violet-900/20 border-violet-200  dark:border-violet-800  hover:bg-violet-100  dark:hover:bg-violet-900/30",
  LEAVE:   "bg-amber-50   dark:bg-amber-900/20  border-amber-200   dark:border-amber-800   cursor-default",
  HOLIDAY: "bg-red-50     dark:bg-red-900/20    border-red-200     dark:border-red-800     cursor-default",
  WEEKEND: "bg-slate-50   dark:bg-slate-800/50  border-slate-200   dark:border-slate-700   cursor-default",
  UNSET:   "bg-[var(--bg-card)] border-[var(--border-card)] hover:bg-[var(--bg-card-hover)]",
};

const STATUS_TEXT: Record<EffectiveStatus, string> = {
  WFO:     "text-blue-700   dark:text-blue-400",
  WFH:     "text-emerald-700 dark:text-emerald-400",
  WFC:     "text-violet-700  dark:text-violet-400",
  LEAVE:   "text-amber-700   dark:text-amber-400",
  HOLIDAY: "text-red-700     dark:text-red-400",
  WEEKEND: "text-slate-400   dark:text-slate-500",
  UNSET:   "text-slate-300   dark:text-slate-600",
};

const STATUS_LABEL: Record<EffectiveStatus, string> = {
  WFO:     "WFO",
  WFH:     "WFH",
  WFC:     "WFC",
  LEAVE:   "Leave",
  HOLIDAY: "Holiday",
  WEEKEND: "—",
  UNSET:   "",
};

const STATUS_DOT: Record<EffectiveStatus, string> = {
  WFO:     "bg-blue-500",
  WFH:     "bg-emerald-500",
  WFC:     "bg-violet-500",
  LEAVE:   "bg-amber-500",
  HOLIDAY: "bg-red-500",
  WEEKEND: "",
  UNSET:   "",
};

export default function CalendarCell({
  date,
  dayStatus,
  inCurrentMonth,
  isToday,
  taskCount = 0,
  onClick,
}: CalendarCellProps) {
  const status = dayStatus?.effectiveStatus ?? "UNSET";
  const dayNum = format(date, "d");
  const isEditable = !["HOLIDAY", "LEAVE"].includes(status);

  return (
    <div
      onClick={onClick}
      className={cn(
        "calendar-cell min-h-[90px] border-b border-r p-2 flex flex-col gap-1 select-none group",
        inCurrentMonth ? STATUS_BG[status] : "bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 cursor-default",
        isEditable && inCurrentMonth ? "cursor-pointer" : "cursor-default",
        !inCurrentMonth && "opacity-40"
      )}
    >
      {/* Day number */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-sm font-semibold leading-none",
            isToday
              ? "flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white text-xs"
              : inCurrentMonth
              ? STATUS_TEXT[status]
              : "text-slate-300 dark:text-slate-700"
          )}
        >
          {dayNum}
        </span>

        <div className="flex items-center gap-1">
          {/* Task count pill */}
          {inCurrentMonth && taskCount > 0 && (
            <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 text-[9px] font-bold">
              {taskCount}
            </span>
          )}
          {/* Status dot */}
          {inCurrentMonth && STATUS_DOT[status] && (
            <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", STATUS_DOT[status])} />
          )}
        </div>
      </div>

      {/* Status label */}
      {inCurrentMonth && status !== "UNSET" && (
        <div className="mt-auto">
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wide",
              STATUS_TEXT[status]
            )}
          >
            {STATUS_LABEL[status]}
          </span>
          {status === "HOLIDAY" && dayStatus?.holidayName && (
            <p className="text-[9px] text-red-500 dark:text-red-400 truncate leading-tight mt-0.5">
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

      {/* Notes indicator */}
      {inCurrentMonth && dayStatus?.workEntry?.notes && (
        <div className="mt-auto flex items-center gap-0.5">
          <div className="h-1 w-1 rounded-full bg-slate-400" />
          <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{dayStatus.workEntry.notes}</span>
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

