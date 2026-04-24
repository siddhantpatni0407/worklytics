import { useState } from "react";
import { Pin, PinOff, Edit2, Trash2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { cn } from "@/utils/cn";
import type { StickyNote, NoteColor } from "@/types";

// ─── Color design tokens ──────────────────────────────────────────────────────
export const NOTE_COLORS: Record<
  NoteColor,
  { label: string; dot: string; card: string; header: string; border: string; text: string }
> = {
  yellow: {
    label: "Yellow",
    dot: "bg-amber-400",
    card: "bg-amber-50 dark:bg-amber-900/20",
    header: "bg-amber-100 dark:bg-amber-900/40",
    border: "border-amber-200 dark:border-amber-700",
    text: "text-amber-800 dark:text-amber-200",
  },
  blue: {
    label: "Blue",
    dot: "bg-blue-400",
    card: "bg-blue-50 dark:bg-blue-900/20",
    header: "bg-blue-100 dark:bg-blue-900/40",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-800 dark:text-blue-200",
  },
  green: {
    label: "Green",
    dot: "bg-emerald-400",
    card: "bg-emerald-50 dark:bg-emerald-900/20",
    header: "bg-emerald-100 dark:bg-emerald-900/40",
    border: "border-emerald-200 dark:border-emerald-700",
    text: "text-emerald-800 dark:text-emerald-200",
  },
  pink: {
    label: "Pink",
    dot: "bg-pink-400",
    card: "bg-pink-50 dark:bg-pink-900/20",
    header: "bg-pink-100 dark:bg-pink-900/40",
    border: "border-pink-200 dark:border-pink-700",
    text: "text-pink-800 dark:text-pink-200",
  },
  purple: {
    label: "Purple",
    dot: "bg-violet-400",
    card: "bg-violet-50 dark:bg-violet-900/20",
    header: "bg-violet-100 dark:bg-violet-900/40",
    border: "border-violet-200 dark:border-violet-700",
    text: "text-violet-800 dark:text-violet-200",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────
interface NoteCardProps {
  note: StickyNote;
  onEdit: (note: StickyNote) => void;
  onDelete: (id: number) => void;
  onPin: (id: number, pinned: boolean) => void;
}

export default function NoteCard({ note, onEdit, onDelete, onPin }: NoteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = NOTE_COLORS[(note.color as NoteColor) ?? "yellow"];

  const PREVIEW_LEN = 120;
  const needsExpand = note.content.length > PREVIEW_LEN;
  const displayContent =
    expanded || !needsExpand
      ? note.content
      : note.content.slice(0, PREVIEW_LEN) + "…";

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border shadow-sm transition-shadow hover:shadow-md",
        style.card,
        style.border,
        note.pinned && "ring-2 ring-offset-1 ring-brand-400 dark:ring-brand-500"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-start justify-between gap-2 rounded-t-xl px-3 py-2.5",
          style.header,
          "border-b",
          style.border
        )}
      >
        <div className="flex-1 min-w-0">
          {note.pinned && (
            <Pin className="inline h-3 w-3 mr-1 mb-0.5 text-brand-500 flex-shrink-0" />
          )}
          <span
            className={cn(
              "text-sm font-semibold leading-tight",
              style.text,
              !note.title && "italic opacity-60"
            )}
          >
            {note.title || "Untitled"}
          </span>
        </div>

        {/* Action buttons — shown on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onPin(note.id, !note.pinned)}
            title={note.pinned ? "Unpin" : "Pin"}
            className={cn(
              "rounded p-1 transition-colors",
              note.pinned
                ? "text-brand-500 hover:bg-brand-100 dark:hover:bg-brand-900/30"
                : "text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"
            )}
          >
            {note.pinned ? (
              <PinOff className="h-3.5 w-3.5" />
            ) : (
              <Pin className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => onEdit(note)}
            title="Edit"
            className="rounded p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            title="Delete"
            className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 pt-2.5 pb-2">
        <p
          className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap break-words",
            style.text,
            "opacity-90"
          )}
        >
          {displayContent}
        </p>
        {needsExpand && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className={cn(
              "mt-1.5 flex items-center gap-1 text-xs font-medium transition-opacity",
              style.text,
              "opacity-60 hover:opacity-100"
            )}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> Show more
              </>
            )}
          </button>
        )}
      </div>

      {/* Footer */}
      <div
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-b-xl text-[11px] opacity-60",
          style.text
        )}
      >
        <Clock className="h-3 w-3" />
        <span>{formatRelativeDate(note.updatedAt)}</span>
      </div>
    </div>
  );
}
