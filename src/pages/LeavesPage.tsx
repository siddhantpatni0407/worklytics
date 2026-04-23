import LeaveManager from "@/components/leaves/LeaveManager";
import { useAppStore } from "@/store/appStore";
import { yearRange } from "@/utils/dateUtils";

export default function LeavesPage() {
  const { selectedYear, setSelectedYear } = useAppStore();
  const years = yearRange(selectedYear);

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h2 className="page-title">Leave Management</h2>
          <p className="page-subtitle">Track and manage all your leave records</p>
        </div>
        <select
          className="wl-select w-24 text-sm"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <LeaveManager />
    </div>
  );
}
