import { useState } from "react";
import { X, Save, Plus, Layers, Briefcase, Users } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Task, CreateTaskPayload, UpdateTaskPayload } from "@/types";
import { parseTaskMeta, buildTaskTags } from "@/types";
import { useAppStore } from "@/store/appStore";
import { todayISO } from "@/utils/dateUtils";

interface TaskFormProps {
  task?: Task;
  defaultDate?: string;
  onSave: (payload: CreateTaskPayload | UpdateTaskPayload) => Promise<void>;
  onCancel: () => void;
}

export default function TaskForm({ task, defaultDate, onSave, onCancel }: TaskFormProps) {
  const isEditing = !!task;
  const { settings } = useAppStore();
  const existing = task ? parseTaskMeta(task.tags ?? "") : { sprint: "", project: "", team: "", regularTags: [] };

  const statusOptions = [
    { value: "TODO",        label: "To Do",       color: "text-slate-600"  },
    { value: "IN_PROGRESS", label: "In Progress", color: "text-blue-600"   },
    { value: "COMPLETED",   label: "Completed",   color: "text-green-600"  },
    { value: "BLOCKED",     label: "Blocked",     color: "text-red-600"    },
    ...(settings.customStatuses ?? []).map((s) => ({
      value: s,
      label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      color: "text-violet-600",
    })),
  ];

  const [form, setForm] = useState({
    date:       task?.date       ?? defaultDate ?? todayISO(),
    title:      task?.title      ?? "",
    details:    task?.details    ?? "",
    notes:      task?.notes      ?? "",
    status:     task?.status ?? "TODO",
    tags:       existing.regularTags.join(", "),
    sprint:     existing.sprint,
    project:    existing.project,
    team:       existing.team,
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
      const combinedTags = buildTaskTags(form.sprint, form.project, form.team, form.tags);
      const payload = {
        ...(isEditing ? { id: task!.id } : {}),
        date:      form.date,
        title:     form.title.trim(),
        details:   form.details.trim(),
        notes:     form.notes.trim(),
        status:    form.status,
        tags:      combinedTags,
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
          <input type="date" value={form.date} onChange={set("date")} className="wl-input" required />
        </div>
        <div>
          <label className="wl-label">Status</label>
          <select value={form.status} onChange={set("status")} className="wl-select">
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="wl-label">Task Title *</label>
        <input
          type="text" value={form.title} onChange={set("title")}
          placeholder="What did you work on?"
          className="wl-input" autoFocus
        />
      </div>

      {/* Sprint / Project / Team row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="wl-label flex items-center gap-1">
            <Layers className="h-3 w-3 text-indigo-500" /> Sprint
          </label>
          {settings.sprints.length > 0 ? (
            <select value={form.sprint} onChange={set("sprint")} className="wl-select">
              <option value="">None</option>
              {settings.sprints.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input type="text" value={form.sprint} onChange={set("sprint")} placeholder="e.g. Sprint 5" className="wl-input" />
          )}
        </div>
        <div>
          <label className="wl-label flex items-center gap-1">
            <Briefcase className="h-3 w-3 text-teal-500" /> Project
          </label>
          {settings.projects.length > 0 ? (
            <select value={form.project} onChange={set("project")} className="wl-select">
              <option value="">None</option>
              {settings.projects.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            <input type="text" value={form.project} onChange={set("project")} placeholder="e.g. Phoenix" className="wl-input" />
          )}
        </div>
        <div>
          <label className="wl-label flex items-center gap-1">
            <Users className="h-3 w-3 text-orange-500" /> Team
          </label>
          {settings.teams.length > 0 ? (
            <select value={form.team} onChange={set("team")} className="wl-select">
              <option value="">None</option>
              {settings.teams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          ) : (
            <input type="text" value={form.team} onChange={set("team")} placeholder="e.g. Platform" className="wl-input" />
          )}
        </div>
      </div>

      {/* Details */}
      <div>
        <label className="wl-label">Details</label>
        <textarea value={form.details} onChange={set("details")} placeholder="Describe what was done in detail…" className="wl-textarea" rows={3} />
      </div>

      {/* Notes */}
      <div>
        <label className="wl-label">Notes</label>
        <textarea value={form.notes} onChange={set("notes")} placeholder="Any blockers, observations, or follow-ups…" className="wl-textarea" rows={2} />
      </div>

      {/* Row: tags + time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="wl-label">Tags (comma-separated)</label>
          <input type="text" value={form.tags} onChange={set("tags")} placeholder="e.g. backend, review" className="wl-input" />
        </div>
        <div>
          <label className="wl-label">Time Spent (hours)</label>
          <input type="number" value={form.timeSpent} onChange={set("timeSpent")} min={0} step={0.25} className="wl-input" placeholder="0" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-card)]">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-app-secondary hover:text-app-primary transition-colors">
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          type="submit" disabled={saving}
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
