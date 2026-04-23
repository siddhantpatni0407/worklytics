import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { addLeave, updateLeave } from "@/utils/tauriCommands";
import type { Leave, LeaveType, LeaveStatus } from "@/types";
import { LEAVE_TYPE_LABELS } from "@/types";

interface LeaveFormProps {
  leave: Leave | null;
  defaultYear: number;
  onClose: (refresh: boolean) => void;
}

const LEAVE_TYPES: LeaveType[] = ["CASUAL", "SICK", "EARNED", "MATERNITY", "PATERNITY", "UNPAID", "COMP_OFF", "OTHER"];
const LEAVE_STATUSES: LeaveStatus[] = ["APPROVED", "PENDING", "REJECTED"];

export default function LeaveForm({ leave, defaultYear, onClose }: LeaveFormProps) {
  const isEdit = !!leave;

  const [startDate, setStartDate] = useState(leave?.startDate ?? `${defaultYear}-01-01`);
  const [endDate, setEndDate]     = useState(leave?.endDate   ?? `${defaultYear}-01-01`);
  const [leaveType, setLeaveType] = useState<LeaveType>((leave?.leaveType as LeaveType) ?? "CASUAL");
  const [reason, setReason]       = useState(leave?.reason ?? "");
  const [status, setStatus]       = useState<LeaveStatus>((leave?.status as LeaveStatus) ?? "APPROVED");
  const [saving, setSaving]       = useState(false);

  const handleSubmit = async () => {
    if (startDate > endDate) {
      toast.error("Start date must be on or before end date");
      return;
    }
    setSaving(true);
    try {
      if (isEdit && leave) {
        await updateLeave({ id: leave.id, startDate, endDate, leaveType, reason, status });
        toast.success("Leave updated");
      } else {
        await addLeave({ startDate, endDate, leaveType, reason, status });
        toast.success("Leave applied");
      }
      onClose(true);
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : "Failed to save leave";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => onClose(false)}
      title={isEdit ? "Edit Leave" : "Apply Leave"}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => onClose(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={saving}>
            {isEdit ? "Update" : "Apply"} Leave
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="wl-label">Start Date *</label>
            <input
              type="date"
              className="wl-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="wl-label">End Date *</label>
            <input
              type="date"
              className="wl-input"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="wl-label">Leave Type *</label>
          <select
            className="wl-select"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="wl-label">Status</label>
          <select
            className="wl-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeaveStatus)}
          >
            {LEAVE_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="wl-label">Reason</label>
          <textarea
            className="wl-input resize-none"
            rows={2}
            placeholder="Optional reason…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
          />
        </div>
      </div>
    </Modal>
  );
}
