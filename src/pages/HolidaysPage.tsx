import HolidayManager from "@/components/holidays/HolidayManager";
import { useAppStore } from "@/store/appStore";
import { yearRange } from "@/utils/dateUtils";

export default function HolidaysPage() {
  const { selectedYear, setSelectedYear } = useAppStore();
  const years = yearRange(selectedYear);

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h2 className="page-title">Holiday Management</h2>
          <p className="page-subtitle">Add, edit, or remove public and custom holidays</p>
        </div>
        <select
          className="wl-select w-24 text-sm"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <HolidayManager />
    </div>
  );
}
