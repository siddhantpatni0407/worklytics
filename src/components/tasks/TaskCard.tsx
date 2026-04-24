import { useState } from "react";
import { Pencil, Trash2, Clock, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Task, TaskStatus } from "@/types";
import { formatDisplayDate } from "@/utils/dateUtils";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const STATUS_STYLE: Record<TaskStatus, { dot: string; badge: string; label: string }> = {
  IN_PROGRESS: {
    dot:   "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    label: "In Progress",
  },
  COMPLETED: {
    dot:   "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    label: "Completed",
  },
  BLOCKED: {
    dot:   "bg-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    label: "Blocked",
  },
};

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLE[task.status];
  const tags = task.tags ? task.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div
      className={cn(
        "wl-card p-4 transition-all duration-150",
        task.status === "COMPLETED" && "opacity-80"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className={cn("mt-1.5 h-2 w-2 rounded-full flex-shrink-0", style.dot)} />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-semibold text-app-primary truncate",
                task.status === "COMPLETED" && "line-through text-app-muted"
              )}
            >
              {task.title}
            </p>
            <p className="text-xs text-app-muted mt-0.5">
              {formatDisplayDate(task.date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn("wl-badge text-[10px]", style.badge)}>{style.label}</span>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-app-muted transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-app-muted hover:text-brand-500 transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-app-muted hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable detail */}
      {expanded && (
        <div className="mt-3 space-y-2 pl-4 border-l-2 border-brand-500/30 animate-[fadeIn_0.15s_ease]">
          {task.details && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted mb-1">Details</p>
              <p className="text-sm text-app-secondary whitespace-pre-wrap">{task.details}</p>
            </div>
          )}
          {task.notes && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted mb-1">Notes</p>
              <p className="text-sm text-app-secondary whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}
          {/* Footer meta */}
          <div className="flex items-center gap-3 pt-1">
            {task.timeSpent > 0 && (
              <span className="flex items-center gap-1 text-xs text-app-muted">
                <Clock className="h-3 w-3" /> {task.timeSpent}h
              </span>
            )}
            {tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <Tag className="h-3 w-3 text-app-muted" />
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-app-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compact footer when collapsed */}
      {!expanded && (tags.length > 0 || task.timeSpent > 0) && (
        <div className="flex items-center gap-3 mt-2 pl-4">
          {task.timeSpent > 0 && (
            <span className="flex items-center gap-1 text-xs text-app-muted">
              <Clock className="h-3 w-3" /> {task.timeSpent}h
            </span>
          )}
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-app-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
