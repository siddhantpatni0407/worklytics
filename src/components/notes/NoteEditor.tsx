import { useState, useEffect, useRef, useCallback } from "react";
import { X, StickyNote as StickyNoteIcon, List, ListOrdered, Bold } from "lucide-react";
import { cn } from "@/utils/cn";
import type { StickyNote, NoteColor, CreateNotePayload, UpdateNotePayload } from "@/types";
import { NOTE_COLORS } from "./NoteCard";

interface NoteEditorProps {
  isOpen: boolean;
  note?: StickyNote;
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
  const backdropRef = useRef<HTMLDivElement>(null);

  // Use a stable key to avoid remounting issues (no flicker)
  useEffect(() => {
    if (!isOpen) return;
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setColor((note?.color as NoteColor) ?? defaultColor);
    setSaving(false);
    // Focus after paint to prevent flicker
    requestAnimationFrame(() => {
      contentRef.current?.focus();
    });
  }, [isOpen, note?.id, defaultColor]);  // Use note.id not full note object

  // Insert text helper for bullet/numbered list
  const insertAtCursor = useCallback((prefix: string) => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = content.slice(0, start);
    const selected = content.slice(start, end);
    const after = content.slice(end);
    // If at beginning or previous char is newline, prepend on current line
    const lineStart = before.lastIndexOf("\n") + 1;
    const lineContent = before.slice(lineStart);
    let newContent: string;
    if (lineContent.trim() === "") {
      // Empty line, just insert prefix
      newContent = before + prefix + selected + after;
    } else {
      // Add new line with prefix
      newContent = before + "\n" + prefix + selected + after;
    }
    setContent(newContent.slice(0, MAX_CONTENT));
    // Restore cursor
    requestAnimationFrame(() => {
      const pos = start + prefix.length + (lineContent.trim() === "" ? 0 : 1);
      el.setSelectionRange(pos, pos);
      el.focus();
    });
  }, [content]);

  if (!isOpen) return null;

  const isEdit = note !== undefined;
  const charLeft = MAX_CONTENT - content.length;
  const style = NOTE_COLORS[color];

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await onSave({ id: note.id, title: title.trim() || undefined, content: content.trim(), color } as UpdateNotePayload);
      } else {
        await onSave({ title: title.trim() || undefined, content: content.trim(), color } as CreateNotePayload);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col max-h-[90vh]",
          style.card, style.border
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn("flex items-center justify-between px-4 py-3 rounded-t-2xl border-b flex-shrink-0", style.header, style.border)}>
          <div className="flex items-center gap-2">
            <StickyNoteIcon className={cn("h-4 w-4", style.text)} />
            <span className={cn("text-sm font-semibold", style.text)}>
              {isEdit ? "Edit Note" : "New Note"}
            </span>
          </div>
          <button onClick={onClose} className={cn("rounded-lg p-1.5 transition-colors text-slate-500 hover:text-slate-700 hover:bg-black/10 dark:hover:bg-white/10")}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-3 space-y-3 overflow-y-auto flex-1">
            {/* Color picker */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} title={NOTE_COLORS[c].label}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform",
                      NOTE_COLORS[c].dot,
                      color === c ? "border-slate-700 dark:border-white scale-110" : "border-transparent hover:scale-105"
                    )}
                  />
                ))}
              </div>
              {/* Formatting toolbar */}
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => insertAtCursor("\u2022 ")} title="Bullet list"
                  className={cn("rounded px-2 py-1 text-xs transition-colors", style.text, "hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100")}>
                  <List className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => insertAtCursor("1. ")} title="Numbered list"
                  className={cn("rounded px-2 py-1 text-xs transition-colors", style.text, "hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100")}>
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Title */}
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)" maxLength={120}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-sm font-medium placeholder-opacity-50",
                "bg-white/60 dark:bg-black/20 outline-none transition-colors focus:ring-2 focus:ring-offset-1",
                style.border, style.text
              )}
            />

            {/* Content */}
            <div>
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
                placeholder="Write your note here\u2026  tip: click \u2022 above to insert bullets"
                rows={8}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-sm resize-none placeholder-opacity-50",
                  "bg-white/60 dark:bg-black/20 outline-none transition-colors focus:ring-2 focus:ring-offset-1 leading-relaxed",
                  style.border, style.text
                )}
              />
              <div className="flex justify-end">
                <span className={cn("text-[11px] mt-0.5", charLeft < 100 ? "text-red-500" : "opacity-50", style.text)}>
                  {charLeft} / {MAX_CONTENT}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={cn("flex items-center justify-end gap-2 px-4 py-3 border-t rounded-b-2xl flex-shrink-0", style.header, style.border)}>
            <button type="button" onClick={onClose}
              className={cn("rounded-lg px-4 py-1.5 text-sm font-medium transition-colors border", style.border, style.text, "hover:bg-black/10 dark:hover:bg-white/10")}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !content.trim()}
              className="rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Saving\u2026" : isEdit ? "Save Changes" : "Add Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
