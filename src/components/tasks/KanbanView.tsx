import { useState } from "react";
import type { Task } from "@/types";
import { parseTaskMeta } from "@/types";
import TaskCard, { getStatusStyle } from "./TaskCard";
import { cn } from "@/utils/cn";
import { useAppStore } from "@/store/appStore";
import {
  X, Pencil, Trash2, Clock, Tag, Briefcase, Users, Layers,
  CalendarDays, AlignLeft, StickyNote, Info,
} from "lucide-react";
import { formatDisplayDate } from "@/utils/dateUtils";

interface KanbanViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const BASE_COLUMNS = [
  { status: "TODO",        label: "To Do",       color: "border-t-slate-400",   headerBg: "bg-slate-50 dark:bg-slate-800/30"     },
  { status: "IN_PROGRESS", label: "In Progress",  color: "border-t-blue-500",    headerBg: "bg-blue-50 dark:bg-blue-950/20"       },
  { status: "BLOCKED",     label: "Blocked",      color: "border-t-red-500",     headerBg: "bg-red-50 dark:bg-red-950/20"         },
  { status: "COMPLETED",   label: "Completed",    color: "border-t-emerald-500", headerBg: "bg-emerald-50 dark:bg-emerald-950/20" },
];

// ─── Task Detail Drawer ───────────────────────────────────────────────────────
interface DrawerProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

function TaskDetailDrawer({ task, onClose, onEdit, onDelete }: DrawerProps) {
  const style = getStatusStyle(task.status);
  const { sprint, project, team, regularTags } = parseTaskMeta(task.tags);

  const handleEdit = () => { onEdit(task); onClose(); };
  const handleDelete = () => { onDelete(task.id); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex flex-col w-full max-w-sm h-full bg-[var(--bg-card)] border-l border-[var(--border-card)] shadow-2xl animate-[slideFromRight_0.22s_ease-out]">

        {/* Status colour bar */}
        <div className={cn("h-1 w-full flex-shrink-0",
          task.status === "TODO"        ? "bg-slate-400" :
          task.status === "IN_PROGRESS" ? "bg-blue-500"  :
          task.status === "BLOCKED"     ? "bg-red-500"   :
          task.status === "COMPLETED"   ? "bg-emerald-500" : "bg-violet-400"
        )} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-[var(--border-card)] flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-app-primary leading-snug">{task.title}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn("wl-badge text-[11px] font-semibold", style.badge)}>
                {style.label}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-app-muted">
                <CalendarDays className="h-3 w-3" />
                {formatDisplayDate(task.date)}
              </span>
              {task.timeSpent > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-app-muted">
                  <Clock className="h-3 w-3" />
                  {task.timeSpent}h logged
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-app-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Meta: Sprint / Project / Team */}
          {(sprint || project || team) && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-app-muted flex items-center gap-1">
                <Info className="h-3 w-3" /> Meta
              </p>
              <div className="flex flex-wrap gap-2">
                {sprint && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <Layers className="h-3 w-3" />
                    <span className="font-medium">Sprint</span>
                    <span className="text-indigo-500 dark:text-indigo-400">{sprint}</span>
                  </div>
                )}
                {project && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    <Briefcase className="h-3 w-3" />
                    <span className="font-medium">Project</span>
                    <span className="text-teal-500 dark:text-teal-400">{project}</span>
                  </div>
                )}
                {team && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                    <Users className="h-3 w-3" />
                    <span className="font-medium">Team</span>
                    <span className="text-orange-500 dark:text-orange-400">{team}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {regularTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-app-muted flex items-center gap-1">
                <Tag className="h-3 w-3" /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {regularTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-app-secondary border border-[var(--border-card)]">
                    <Tag className="h-2.5 w-2.5" />{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          {task.details ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-app-muted flex items-center gap-1">
                <AlignLeft className="h-3 w-3" /> Details
              </p>
              <div className="p-3 rounded-xl bg-[var(--bg-app)] border border-[var(--border-card)] text-sm text-app-secondary whitespace-pre-wrap leading-relaxed">
                {task.details}
              </div>
            </div>
          ) : null}

          {/* Notes */}
          {task.notes ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-app-muted flex items-center gap-1">
                <StickyNote className="h-3 w-3" /> Notes
              </p>
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-sm text-app-secondary whitespace-pre-wrap leading-relaxed">
                {task.notes}
              </div>
            </div>
          ) : null}

          {/* Empty state */}
          {!task.details && !task.notes && !sprint && !project && !team && regularTags.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlignLeft className="h-8 w-8 text-app-muted mb-2 opacity-40" />
              <p className="text-sm text-app-muted">No additional details for this task.</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 px-5 py-4 border-t border-[var(--border-card)] flex-shrink-0">
          <button
            onClick={handleEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium
                       bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Task
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────
export default function KanbanView({ tasks, onEdit, onDelete }: KanbanViewProps) {
  const { settings } = useAppStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const columns = [
    ...BASE_COLUMNS,
    ...(settings.customStatuses ?? []).map((s) => ({
      status:   s,
      label:    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      color:    "border-t-violet-400",
      headerBg: "bg-violet-50 dark:bg-violet-950/20",
    })),
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(({ status, label, color, headerBg }) => {
          const colTasks = tasks.filter((t) => t.status === status);
          const style = getStatusStyle(status);
          return (
            <div key={status} className={cn("wl-card overflow-hidden border-t-4", color)}>
              {/* Column header */}
              <div className={cn("flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-card)]", headerBg)}>
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", style.dot)} />
                  <span className="text-sm font-semibold text-app-primary">{label}</span>
                </div>
                <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", style.badge)}>
                  {colTasks.length}
                </span>
              </div>
              {/* Tasks */}
              <div className="p-3 space-y-2 min-h-[120px] max-h-[60vh] overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-20 text-app-muted text-xs">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onSelect={setSelectedTask}
                      selected={selectedTask?.id === task.id}
                      compact
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
