import { useState } from "react";
import { X, Save, Plus } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Task, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from "@/types";
import { todayISO } from "@/utils/dateUtils";

interface TaskFormProps {
  task?: Task;
  defaultDate?: string;
  onSave: (payload: CreateTaskPayload | UpdateTaskPayload) => Promise<void>;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: "IN_PROGRESS", label: "In Progress", color: "text-blue-600"   },
  { value: "COMPLETED",   label: "Completed",   color: "text-green-600"  },
  { value: "BLOCKED",     label: "Blocked",     color: "text-red-600"    },
];

export default function TaskForm({ task, defaultDate, onSave, onCancel }: TaskFormProps) {
  const isEditing = !!task;

  const [form, setForm] = useState({
    date:       task?.date       ?? defaultDate ?? todayISO(),
    title:      task?.title      ?? "",
    details:    task?.details    ?? "",
    notes:      task?.notes      ?? "",
    status:     (task?.status    ?? "IN_PROGRESS") as TaskStatus,
    tags:       task?.tags       ?? "",
    timeSpent:  String(task?.timeSpent ?? "0"),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...(isEditing ? { id: task!.id } : {}),
        date:      form.date,
        title:     form.title.trim(),
        details:   form.details.trim(),
        notes:     form.notes.trim(),
        status:    form.status,
        tags:      form.tags.trim(),
        timeSpent: parseFloat(form.timeSpent) || 0,
      };
      await onSave(payload as CreateTaskPayload | UpdateTaskPayload);
    } catch {
      setError("Failed to save task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row: date + status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="wl-label">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={set("date")}
            className="wl-input"
            required
          />
        </div>
        <div>
          <label className="wl-label">Status</label>
          <select value={form.status} onChange={set("status")} className="wl-select">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="wl-label">Task Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={set("title")}
          placeholder="What did you work on?"
          className="wl-input"
          autoFocus
        />
      </div>

      {/* Details */}
      <div>
        <label className="wl-label">Details</label>
        <textarea
          value={form.details}
          onChange={set("details")}
          placeholder="Describe what was done in detail…"
          className="wl-textarea"
          rows={3}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="wl-label">Notes</label>
        <textarea
          value={form.notes}
          onChange={set("notes")}
          placeholder="Any blockers, observations, or follow-ups…"
          className="wl-textarea"
          rows={2}
        />
      </div>

      {/* Row: tags + time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="wl-label">Tags (comma-separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={set("tags")}
            placeholder="e.g. backend, review, meeting"
            className="wl-input"
          />
        </div>
        <div>
          <label className="wl-label">Time Spent (hours)</label>
          <input
            type="number"
            value={form.timeSpent}
            onChange={set("timeSpent")}
            min={0}
            step={0.25}
            className="wl-input"
            placeholder="0"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                     text-app-secondary hover:text-app-primary transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white",
            "bg-brand-600 hover:bg-brand-700 transition-colors",
            saving && "opacity-60 cursor-not-allowed"
          )}
        >
          {isEditing ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : isEditing ? "Update Task" : "Add Task"}
        </button>
      </div>
    </form>
  );
}
