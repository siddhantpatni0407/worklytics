import { useState } from "react";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { Briefcase, Home, Building2, Trash2 } from "lucide-react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { setWorkEntry, deleteWorkEntry } from "@/utils/tauriCommands";
import type { DayStatus, WorkStatus } from "@/types";
import { cn } from "@/utils/cn";

interface WorkStatusModalProps {
  date: string;
  dayStatus: DayStatus | null;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: WorkStatus; label: string; icon: React.ReactNode; color: string; activeClasses: string }[] = [
  {
    value: "WFO",
    label: "Work From Office",
    icon: <Briefcase className="h-5 w-5" />,
    color: "text-blue-600",
    activeClasses: "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-300",
  },
  {
    value: "WFH",
    label: "Work From Home",
    icon: <Home className="h-5 w-5" />,
    color: "text-emerald-600",
    activeClasses: "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300",
  },
  {
    value: "WFC",
    label: "Work From Client",
    icon: <Building2 className="h-5 w-5" />,
    color: "text-violet-600",
    activeClasses: "border-violet-500 bg-violet-50 text-violet-700 ring-2 ring-violet-300",
  },
];

export default function WorkStatusModal({ date, dayStatus, onClose }: WorkStatusModalProps) {
  const existing = dayStatus?.workEntry;
  const [selectedStatus, setSelectedStatus] = useState<WorkStatus | null>(
    (existing?.status as WorkStatus) ?? null
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const displayDate = format(parseISO(date), "EEEE, dd MMMM yyyy");

  const handleSave = async () => {
    if (!selectedStatus) {
      toast.error("Please select a work status");
      return;
    }
    setSaving(true);
    try {
      await setWorkEntry({ date, status: selectedStatus, notes });
      toast.success(`Status set to ${selectedStatus} for ${format(parseISO(date), "dd MMM")}`);
      onClose();
    } catch (err) {
      toast.error("Failed to save status");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setDeleting(true);
    try {
      await deleteWorkEntry(date);
      toast.success("Status cleared");
      onClose();
    } catch (err) {
      toast.error("Failed to clear status");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Set Work Status"
      size="sm"
      footer={
        <>
          {existing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
              leftIcon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}
              className="mr-auto text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving || deleting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving} disabled={!selectedStatus}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm font-medium text-slate-700">{displayDate}</p>

        {/* Status selection */}
        <div className="grid grid-cols-1 gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedStatus(opt.value)}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-150 text-left",
                selectedStatus === opt.value
                  ? opt.activeClasses
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700"
              )}
            >
              <span className={selectedStatus === opt.value ? "" : opt.color}>{opt.icon}</span>
              <span className="text-sm font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Notes */}
        <div>
          <label className="wl-label">Notes (optional)</label>
          <textarea
            className="wl-input resize-none"
            rows={2}
            placeholder="Any additional notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
          />
        </div>
      </div>
    </Modal>
  );
}
