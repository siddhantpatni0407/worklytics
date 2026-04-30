import { useState } from "react";
import { Pencil, Trash2, Clock, Tag, ChevronDown, ChevronUp, Briefcase, Users, Layers } from "lucide-react";
import { cn } from "@/utils/cn";
import type { Task, TaskStatus } from "@/types";
import { parseTaskMeta } from "@/types";
import { formatDisplayDate } from "@/utils/dateUtils";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  compact?: boolean;
  onSelect?: (task: Task) => void;
  selected?: boolean;
}

export const STATUS_STYLE: Record<string, {
  dot: string; badge: string; label: string;
  cardBorder: string; cardBg: string;
}> = {
  TODO: {
    dot:        "bg-slate-500",
    badge:      "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
    label:      "To Do",
    cardBorder: "border-l-4 border-l-slate-400",
    cardBg:     "",
  },
  IN_PROGRESS: {
    dot:        "bg-blue-500",
    badge:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    label:      "In Progress",
    cardBorder: "border-l-4 border-l-blue-500",
    cardBg:     "bg-blue-50/30 dark:bg-blue-950/10",
  },
  COMPLETED: {
    dot:        "bg-emerald-500",
    badge:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    label:      "Completed",
    cardBorder: "border-l-4 border-l-emerald-500",
    cardBg:     "bg-emerald-50/30 dark:bg-emerald-950/10",
  },
  BLOCKED: {
    dot:        "bg-red-500",
    badge:      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
    label:      "Blocked",
    cardBorder: "border-l-4 border-l-red-500",
    cardBg:     "bg-red-50/30 dark:bg-red-950/10",
  },
};

export function getStatusStyle(status: string) {
  return STATUS_STYLE[status] ?? {
    dot:        "bg-violet-400",
    badge:      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800",
    label:      status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    cardBorder: "border-l-4 border-l-violet-400",
    cardBg:     "",
  };
}

export default function TaskCard({ task, onEdit, onDelete, compact, onSelect, selected }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = getStatusStyle(task.status);
  const { sprint, project, team, regularTags } = parseTaskMeta(task.tags);

  return (
    <div
      className={cn(
        "wl-card overflow-hidden transition-all duration-150 hover:shadow-md",
        style.cardBorder,
        "border border-[var(--border-card)]",
        onSelect && "cursor-pointer",
        selected && "ring-2 ring-brand-500 ring-offset-1"
      )}
      onClick={onSelect ? () => onSelect(task) : undefined}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-app-primary leading-snug">
            {task.title}
          </p>
          {!compact && (
            <p className="text-[11px] text-app-muted mt-0.5">
              {formatDisplayDate(task.date)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className={cn("wl-badge text-[10px] font-semibold", style.badge)}>
            {style.label}
          </span>
          {!compact && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-app-muted transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
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

      {(sprint || project || team || regularTags.length > 0 || task.timeSpent > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2.5">
          {sprint && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Layers className="h-2.5 w-2.5" />{sprint}
            </span>
          )}
          {project && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <Briefcase className="h-2.5 w-2.5" />{project}
            </span>
          )}
          {team && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
              <Users className="h-2.5 w-2.5" />{team}
            </span>
          )}
          {regularTags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 text-app-secondary border border-[var(--border-card)]">
              <Tag className="h-2 w-2" />{tag}
            </span>
          ))}
          {task.timeSpent > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-app-muted ml-auto">
              <Clock className="h-2.5 w-2.5" />{task.timeSpent}h
            </span>
          )}
        </div>
      )}

      {expanded && !compact && (
        <div className="mx-4 mb-3 space-y-2 pl-3 border-l-2 border-brand-500/30 animate-[fadeIn_0.15s_ease]">
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
        </div>
      )}
    </div>
  );
}
