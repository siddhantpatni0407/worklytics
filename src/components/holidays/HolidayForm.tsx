import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { addHoliday, updateHoliday } from "@/utils/tauriCommands";
import type { Holiday } from "@/types";

interface HolidayFormProps {
  holiday: Holiday | null;   // null → create mode
  defaultYear: number;
  onClose: (refresh: boolean) => void;
}

export default function HolidayForm({ holiday, defaultYear, onClose }: HolidayFormProps) {
  const isEdit = !!holiday;

  const [name, setName] = useState(holiday?.name ?? "");
  const [date, setDate] = useState(holiday?.date ?? `${defaultYear}-01-01`);
  const [description, setDescription] = useState(holiday?.description ?? "");
  const [isRecurring, setIsRecurring] = useState(holiday?.isRecurring ?? false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Holiday name is required"); return; }
    if (!date)        { toast.error("Date is required"); return; }

    setSaving(true);
    try {
      if (isEdit && holiday) {
        await updateHoliday({ id: holiday.id, name: name.trim(), date, description, isRecurring });
        toast.success("Holiday updated");
      } else {
        await addHoliday({ name: name.trim(), date, description, isRecurring });
        toast.success("Holiday added");
      }
      onClose(true);
    } catch (err: unknown) {
      const msg = typeof err === "string" ? err : "Failed to save holiday";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => onClose(false)}
      title={isEdit ? "Edit Holiday" : "Add Holiday"}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={() => onClose(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={saving}>
            {isEdit ? "Update" : "Add"} Holiday
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="wl-label">Name *</label>
          <input
            className="wl-input"
            placeholder="e.g. Republic Day"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </div>
        <div>
          <label className="wl-label">Date *</label>
          <input
            type="date"
            className="wl-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="wl-label">Description</label>
          <textarea
            className="wl-input resize-none"
            rows={2}
            placeholder="Optional description…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => setIsRecurring(!isRecurring)}
            className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${isRecurring ? "bg-brand-600" : "bg-slate-300"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${isRecurring ? "translate-x-4" : "translate-x-0"}`}
            />
          </div>
          <span className="text-sm text-slate-700">
            Recurring yearly <span className="text-slate-400">(repeat every year on same date)</span>
          </span>
        </label>
      </div>
    </Modal>
  );
}
