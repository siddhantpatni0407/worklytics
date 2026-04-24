import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { isSameMonth, isToday, parseISO, formatDateISO } from "@/utils/dateUtils";
import { getCalendarGrid, formatDisplayMonth, SHORT_DAY_NAMES, yearRangeFromBounds } from "@/utils/dateUtils";
import { getMonthStatuses, getTaskCountsForMonth } from "@/utils/tauriCommands";
import { useAppStore } from "@/store/appStore";
import type { DayStatus } from "@/types";
import CalendarCell from "./CalendarCell";
import WorkStatusModal from "./WorkStatusModal";
import Button from "@/components/common/Button";

export default function CalendarView() {
  const {
    selectedYear, selectedMonth, setSelectedYear, setSelectedMonth,
    navigatePrevMonth, navigateNextMonth,
    calendarRefreshKey, triggerCalendarRefresh,
    settings,
  } = useAppStore();

  const [dayStatuses, setDayStatuses]   = useState<Map<string, DayStatus>>(new Map());
  const [taskCounts,  setTaskCounts]    = useState<Map<string, number>>(new Map());
  const [loading,     setLoading]       = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const gridDays = getCalendarGrid(selectedYear, selectedMonth);
  const years    = yearRangeFromBounds(settings.yearStart, settings.yearEnd);
  const months   = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const [statuses, counts] = await Promise.all([
        getMonthStatuses(selectedYear, selectedMonth),
        getTaskCountsForMonth(selectedYear, selectedMonth),
      ]);
      const map = new Map<string, DayStatus>();
      statuses.forEach((s) => map.set(s.date, s));
      setDayStatuses(map);

      const cmap = new Map<string, number>();
      counts.forEach(([date, cnt]) => cmap.set(date, cnt));
      setTaskCounts(cmap);
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
    if (!isSameMonth(date, new Date(selectedYear, selectedMonth - 1, 1))) return;
    const dateStr = formatDateISO(date);
    const status = dayStatuses.get(dateStr);
    if (status?.effectiveStatus === "WEEKEND" && !status.workEntry) return;
    if (status?.effectiveStatus === "HOLIDAY") return;
    if (status?.effectiveStatus === "LEAVE") return;
    setSelectedDate(dateStr);
  };

  const handleModalClose = () => {
    setSelectedDate(null);
    triggerCalendarRefresh();
  };

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
      {/* ── Month navigation ─────────────────────────────────────────────── */}
      <div className="wl-card px-5 py-3 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={navigatePrevMonth} leftIcon={<ChevronLeft className="h-4 w-4" />}>
          Prev
        </Button>

        <div className="flex items-center gap-2">
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="wl-select w-36 text-sm"
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="wl-select w-24 text-sm"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <button
            onClick={fetchStatuses}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-app-muted hover:text-app-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <Button variant="ghost" size="sm" onClick={navigateNextMonth} rightIcon={<ChevronRight className="h-4 w-4" />}>
          Next
        </Button>
      </div>

      {/* ── Calendar grid ────────────────────────────────────────────────── */}
      <div className="wl-card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border-card)]">
          {SHORT_DAY_NAMES.map((day) => (
            <div
              key={day}
              className={`py-2.5 text-center text-xs font-semibold uppercase tracking-wide ${
                day === "Sun" || day === "Sat"
                  ? "text-slate-400 dark:text-slate-600"
                  : "text-app-secondary"
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
            const status  = dayStatuses.get(dateStr) ?? null;
            const inCurrentMonth = isSameMonth(date, new Date(selectedYear, selectedMonth - 1, 1));
            return (
              <CalendarCell
                key={idx}
                date={date}
                dayStatus={status}
                inCurrentMonth={inCurrentMonth}
                isToday={isToday(date)}
                taskCount={taskCounts.get(dateStr) ?? 0}
                onClick={() => handleCellClick(date)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="wl-card px-5 py-3 flex flex-wrap items-center gap-4">
        <span className="text-xs font-medium text-app-muted uppercase tracking-wide">Legend:</span>
        {LEGEND.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm ${color}`} />
            <span className="text-xs text-app-secondary">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="flex items-center justify-center h-4 w-4 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 text-[9px] font-bold">3</span>
          <span className="text-xs text-app-muted">= task count</span>
        </div>
      </div>

      {/* ── Status modal ─────────────────────────────────────────────────── */}
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

