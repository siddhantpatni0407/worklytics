import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, UmbrellaOff, RefreshCw } from "lucide-react";
import { getLeavesByYear, deleteLeave } from "@/utils/tauriCommands";
import { useAppStore } from "@/store/appStore";
import type { Leave } from "@/types";
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from "@/types";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import LeaveForm from "./LeaveForm";
import { formatDisplayDate } from "@/utils/dateUtils";

const LEAVE_STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING:  "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function LeaveManager() {
  const { selectedYear, triggerCalendarRefresh, triggerAnalyticsRefresh } = useAppStore();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Leave | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Leave | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const data = await getLeavesByYear(selectedYear);
      setLeaves(data);
    } catch (err) {
      toast.error("Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [selectedYear]);

  const handleFormClose = (refresh: boolean) => {
    setFormOpen(false);
    setEditTarget(null);
    if (refresh) {
      fetchLeaves();
      triggerCalendarRefresh();
      triggerAnalyticsRefresh();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLeave(deleteTarget.id);
      toast.success("Leave deleted");
      setDeleteTarget(null);
      fetchLeaves();
      triggerCalendarRefresh();
      triggerAnalyticsRefresh();
    } catch (err) {
      toast.error("Failed to delete leave");
    } finally {
      setDeleting(false);
    }
  };

  // Summary
  const totalDays = leaves
    .filter((l) => l.status === "APPROVED")
    .reduce((acc, l) => {
      const start = new Date(l.startDate);
      const end   = new Date(l.endDate);
      return acc + Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    }, 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Records", value: leaves.length, color: "text-brand-600 bg-brand-50" },
          { label: "Approved Days", value: totalDays, color: "text-emerald-600 bg-emerald-50" },
          { label: "Pending", value: leaves.filter(l => l.status === "PENDING").length, color: "text-amber-600 bg-amber-50" },
          { label: "Rejected", value: leaves.filter(l => l.status === "REJECTED").length, color: "text-red-600 bg-red-50" },
        ].map(({ label, value, color }) => (
          <div key={label} className="wl-card px-4 py-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color.split(" ")[0]}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{leaves.length} leave record(s) in {selectedYear}</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={fetchLeaves} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setFormOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="wl-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <UmbrellaOff className="h-10 w-10 text-slate-200" />
            <p className="text-sm">No leave records for {selectedYear}</p>
            <Button variant="secondary" size="sm" onClick={() => setFormOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Apply first leave
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["From", "To", "Type", "Days", "Status", "Reason", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => {
                const start = new Date(l.startDate);
                const end   = new Date(l.endDate);
                const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">{formatDisplayDate(l.startDate)}</td>
                    <td className="px-5 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">{formatDisplayDate(l.endDate)}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="status-pill bg-amber-100 text-amber-700">
                        {LEAVE_TYPE_LABELS[l.leaveType as keyof typeof LEAVE_TYPE_LABELS] ?? l.leaveType}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-700">{days}d</td>
                    <td className="px-5 py-3">
                      <span className={`status-pill ${LEAVE_STATUS_COLORS[l.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {LEAVE_STATUS_LABELS[l.status as keyof typeof LEAVE_STATUS_LABELS] ?? l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">{l.reason || "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditTarget(l); setFormOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(l)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <LeaveForm
          leave={editTarget}
          defaultYear={selectedYear}
          onClose={handleFormClose}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Leave"
        message="Are you sure you want to delete this leave record?"
        loading={deleting}
      />
    </div>
  );
}
