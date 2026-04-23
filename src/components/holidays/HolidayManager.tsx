import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, CalendarDays, RefreshCw } from "lucide-react";
import { getHolidaysByYear, deleteHoliday } from "@/utils/tauriCommands";
import { useAppStore } from "@/store/appStore";
import type { Holiday } from "@/types";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import HolidayForm from "./HolidayForm";
import { formatDisplayDate } from "@/utils/dateUtils";

export default function HolidayManager() {
  const { selectedYear, triggerCalendarRefresh, triggerAnalyticsRefresh } = useAppStore();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const data = await getHolidaysByYear(selectedYear);
      setHolidays(data.sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHolidays(); }, [selectedYear]);

  const handleFormClose = (refresh: boolean) => {
    setFormOpen(false);
    setEditTarget(null);
    if (refresh) {
      fetchHolidays();
      triggerCalendarRefresh();
      triggerAnalyticsRefresh();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteHoliday(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchHolidays();
      triggerCalendarRefresh();
      triggerAnalyticsRefresh();
    } catch (err) {
      toast.error("Failed to delete holiday");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{holidays.length} holidays in {selectedYear}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchHolidays} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setFormOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Add Holiday
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="wl-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <CalendarDays className="h-10 w-10 text-slate-200" />
            <p className="text-sm">No holidays for {selectedYear}</p>
            <Button variant="secondary" size="sm" onClick={() => setFormOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Add first holiday
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holidays.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-slate-700 font-mono text-xs whitespace-nowrap">
                    {formatDisplayDate(h.date)}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900">{h.name}</td>
                  <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{h.description || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`status-pill ${h.isRecurring ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                      {h.isRecurring ? "Recurring" : "One-time"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditTarget(h); setFormOpen(true); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(h)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form modal */}
      {formOpen && (
        <HolidayForm
          holiday={editTarget}
          defaultYear={selectedYear}
          onClose={handleFormClose}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Holiday"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
