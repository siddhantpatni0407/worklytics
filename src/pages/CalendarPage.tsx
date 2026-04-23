import CalendarView from "@/components/calendar/CalendarView";
import { useAppStore } from "@/store/appStore";
import { yearRange, MONTH_NAMES } from "@/utils/dateUtils";

export default function CalendarPage() {
  const { selectedYear, selectedMonth, setSelectedYear, setSelectedMonth } = useAppStore();
  const years = yearRange(selectedYear);

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Work Calendar</h2>
          <p className="page-subtitle">Click any weekday to mark your work status</p>
        </div>
        {/* Quick year/month selectors */}
        <div className="flex items-center gap-2">
          <select
            className="wl-select w-28 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="wl-select w-24 text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <CalendarView />
    </div>
  );
}
