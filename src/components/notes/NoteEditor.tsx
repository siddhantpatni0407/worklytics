import { useState, useEffect, useRef } from "react";
import { X, StickyNote as StickyNoteIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import type { StickyNote, NoteColor, CreateNotePayload, UpdateNotePayload } from "@/types";
import { NOTE_COLORS } from "./NoteCard";

interface NoteEditorProps {
  isOpen: boolean;
  note?: StickyNote;            // undefined = create mode
  defaultColor?: NoteColor;
  onSave: (payload: CreateNotePayload | UpdateNotePayload) => Promise<void>;
  onClose: () => void;
}

const COLORS: NoteColor[] = ["yellow", "blue", "green", "pink", "purple"];
const MAX_CONTENT = 2000;

export default function NoteEditor({
  isOpen,
  note,
  defaultColor = "yellow",
  onSave,
  onClose,
}: NoteEditorProps) {
  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [color, setColor]     = useState<NoteColor>(defaultColor);
  const [saving, setSaving]   = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when opening
  useEffect(() => {
    if (!isOpen) return;
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setColor((note?.color as NoteColor) ?? defaultColor);
    setSaving(false);
    // Auto-focus content area
    setTimeout(() => contentRef.current?.focus(), 80);
  }, [isOpen, note, defaultColor]);

  if (!isOpen) return null;

  const isEdit = note !== undefined;
  const charLeft = MAX_CONTENT - content.length;
  const style = NOTE_COLORS[color];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await onSave({
          id: note.id,
          title: title.trim() || undefined,
          content: content.trim(),
          color,
        } as UpdateNotePayload);
      } else {
        await onSave({
          title: title.trim() || undefined,
          content: content.trim(),
          color,
        } as CreateNotePayload);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col",
          style.card,
          style.border,
          "max-h-[90vh]"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 rounded-t-2xl border-b",
            style.header,
            style.border
          )}
        >
          <div className="flex items-center gap-2">
            <StickyNoteIcon className={cn("h-4 w-4", style.text)} />
            <span className={cn("text-sm font-semibold", style.text)}>
              {isEdit ? "Edit Note" : "New Note"}
            </span>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              "text-slate-500 hover:text-slate-700 hover:bg-black/10 dark:hover:bg-white/10"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-3 space-y-3 overflow-y-auto flex-1">
            {/* Color picker */}
            <div>
              <p className={cn("text-xs font-medium mb-1.5 opacity-70", style.text)}>Color</p>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    title={NOTE_COLORS[c].label}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform",
                      NOTE_COLORS[c].dot,
                      color === c
                        ? "border-slate-700 dark:border-white scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                maxLength={120}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm font-medium placeholder-opacity-50",
                  "bg-white/60 dark:bg-black/20 outline-none transition-colors",
                  "focus:ring-2 focus:ring-offset-1",
                  style.border,
                  style.text
                )}
              />
            </div>

            {/* Content */}
            <div>
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
                placeholder="Write your note here…"
                rows={7}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm resize-none placeholder-opacity-50",
                  "bg-white/60 dark:bg-black/20 outline-none transition-colors",
                  "focus:ring-2 focus:ring-offset-1",
                  style.border,
                  style.text
                )}
              />
              <div className="flex justify-end">
                <span
                  className={cn(
                    "text-[11px] mt-0.5",
                    charLeft < 100 ? "text-red-500" : "opacity-50",
                    style.text
                  )}
                >
                  {charLeft} / {MAX_CONTENT}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className={cn(
              "flex items-center justify-end gap-2 px-4 py-3 border-t rounded-b-2xl",
              style.header,
              style.border
            )}
          >
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                "border",
                style.border,
                style.text,
                "hover:bg-black/10 dark:hover:bg-white/10"
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors",
                "bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
