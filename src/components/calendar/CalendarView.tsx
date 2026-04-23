import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { isSameMonth, isToday, parseISO, formatDateISO } from "@/utils/dateUtils";
import { getCalendarGrid, formatDisplayMonth, SHORT_DAY_NAMES } from "@/utils/dateUtils";
import { getMonthStatuses } from "@/utils/tauriCommands";
import { useAppStore } from "@/store/appStore";
import type { DayStatus } from "@/types";
import CalendarCell from "./CalendarCell";
import WorkStatusModal from "./WorkStatusModal";
import Button from "@/components/common/Button";

export default function CalendarView() {
  const { selectedYear, selectedMonth, navigatePrevMonth, navigateNextMonth, calendarRefreshKey, triggerCalendarRefresh } =
    useAppStore();

  const [dayStatuses, setDayStatuses] = useState<Map<string, DayStatus>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const gridDays = getCalendarGrid(selectedYear, selectedMonth);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const statuses = await getMonthStatuses(selectedYear, selectedMonth);
      const map = new Map<string, DayStatus>();
      statuses.forEach((s) => map.set(s.date, s));
      setDayStatuses(map);
    } catch (err) {
      toast.error("Failed to load calendar data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses, calendarRefreshKey]);

  const handleCellClick = (date: Date) => {
    // Only allow clicking dates in the current month
    if (!isSameMonth(date, new Date(selectedYear, selectedMonth - 1, 1))) return;
    const dateStr = formatDateISO(date);
    const status = dayStatuses.get(dateStr);
    // Don't open modal for weekends with no override, holidays, or leaves
    if (status?.effectiveStatus === "WEEKEND" && !status.workEntry) return;
    if (status?.effectiveStatus === "HOLIDAY") return;
    if (status?.effectiveStatus === "LEAVE") return;
    setSelectedDate(dateStr);
  };

  const handleModalClose = () => {
    setSelectedDate(null);
    triggerCalendarRefresh();
  };

  // Status legend
  const LEGEND = [
    { label: "WFO",     color: "bg-blue-500"    },
    { label: "WFH",     color: "bg-emerald-500" },
    { label: "WFC",     color: "bg-violet-500"  },
    { label: "Leave",   color: "bg-amber-500"   },
    { label: "Holiday", color: "bg-red-500"     },
    { label: "Weekend", color: "bg-slate-400"   },
    { label: "Unset",   color: "bg-gray-200 border border-gray-300" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Month navigation ──────────────────────────────────────────────── */}
      <div className="wl-card px-5 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={navigatePrevMonth} leftIcon={<ChevronLeft className="h-4 w-4" />}>
          Prev
        </Button>

        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            {formatDisplayMonth(selectedYear, selectedMonth)}
          </h2>
          <button
            onClick={fetchStatuses}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <Button variant="ghost" size="sm" onClick={navigateNextMonth} rightIcon={<ChevronRight className="h-4 w-4" />}>
          Next
        </Button>
      </div>

      {/* ── Calendar grid ──────────────────────────────────────────────────── */}
      <div className="wl-card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {SHORT_DAY_NAMES.map((day) => (
            <div
              key={day}
              className={`py-2.5 text-center text-xs font-semibold uppercase tracking-wide ${
                day === "Sun" || day === "Sat" ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {gridDays.map((date, idx) => {
            const dateStr = formatDateISO(date);
            const status = dayStatuses.get(dateStr) ?? null;
            const inCurrentMonth = isSameMonth(date, new Date(selectedYear, selectedMonth - 1, 1));
            return (
              <CalendarCell
                key={idx}
                date={date}
                dayStatus={status}
                inCurrentMonth={inCurrentMonth}
                isToday={isToday(date)}
                onClick={() => handleCellClick(date)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="wl-card px-5 py-3 flex flex-wrap items-center gap-4">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Legend:</span>
        {LEGEND.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm ${color}`} />
            <span className="text-xs text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Status modal ───────────────────────────────────────────────────── */}
      {selectedDate && (
        <WorkStatusModal
          date={selectedDate}
          dayStatus={dayStatuses.get(selectedDate) ?? null}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
