import { format } from "date-fns";
import { cn } from "@/utils/cn";
import type { DayStatus, EffectiveStatus } from "@/types";

interface CalendarCellProps {
  date: Date;
  dayStatus: DayStatus | null;
  inCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
}

const STATUS_BG: Record<EffectiveStatus, string> = {
  WFO:     "bg-blue-100   border-blue-300   hover:bg-blue-200",
  WFH:     "bg-emerald-100 border-emerald-300 hover:bg-emerald-200",
  WFC:     "bg-violet-100  border-violet-300  hover:bg-violet-200",
  LEAVE:   "bg-amber-100   border-amber-300   cursor-default",
  HOLIDAY: "bg-red-100     border-red-300     cursor-default",
  WEEKEND: "bg-slate-100   border-slate-200   cursor-default",
  UNSET:   "bg-white       border-slate-100   hover:bg-slate-50",
};

const STATUS_TEXT: Record<EffectiveStatus, string> = {
  WFO:     "text-blue-700",
  WFH:     "text-emerald-700",
  WFC:     "text-violet-700",
  LEAVE:   "text-amber-700",
  HOLIDAY: "text-red-700",
  WEEKEND: "text-slate-400",
  UNSET:   "text-slate-300",
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
  onClick,
}: CalendarCellProps) {
  const status = dayStatus?.effectiveStatus ?? "UNSET";
  const dayNum = format(date, "d");
  const isEditable = !["HOLIDAY", "LEAVE"].includes(status);

  return (
    <div
      onClick={onClick}
      className={cn(
        "calendar-cell min-h-[88px] border-b border-r border-slate-100 p-2 flex flex-col gap-1 select-none",
        inCurrentMonth ? STATUS_BG[status] : "bg-slate-50 cursor-default",
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
              : "text-slate-300"
          )}
        >
          {dayNum}
        </span>

        {/* Dot indicator */}
        {inCurrentMonth && STATUS_DOT[status] && (
          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
        )}
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
          {/* Holiday / Leave name */}
          {(status === "HOLIDAY" && dayStatus?.holidayName) && (
            <p className="text-[9px] text-red-500 truncate leading-tight mt-0.5">
              {dayStatus.holidayName}
            </p>
          )}
          {(status === "LEAVE" && dayStatus?.leaveType) && (
            <p className="text-[9px] text-amber-600 truncate leading-tight mt-0.5">
              {dayStatus.leaveType.replace(/_/g, " ")}
            </p>
          )}
        </div>
      )}

      {/* Notes indicator */}
      {inCurrentMonth && dayStatus?.workEntry?.notes && (
        <div className="mt-auto flex items-center gap-0.5">
          <div className="h-1 w-1 rounded-full bg-slate-400" />
          <span className="text-[9px] text-slate-400 truncate">{dayStatus.workEntry.notes}</span>
        </div>
      )}
    </div>
  );
}
