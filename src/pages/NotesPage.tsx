import { useEffect, useState, useCallback } from "react";
import {
  StickyNote as StickyNoteIcon,
  Plus, Search, X, RefreshCw, Pin,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/utils/cn";
import {
  getAllNotes, searchNotes, getNotesByColor,
  addNote, updateNote, deleteNote, pinNote,
} from "@/utils/tauriCommands";
import type { StickyNote, NoteColor, CreateNotePayload, UpdateNotePayload } from "@/types";
import NoteCard, { NOTE_COLORS } from "@/components/notes/NoteCard";
import NoteEditor from "@/components/notes/NoteEditor";

const ALL_COLORS: NoteColor[] = ["yellow", "blue", "green", "pink", "purple"];

export default function NotesPage() {
  const [notes, setNotes]             = useState<StickyNote[]>([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState("");
  const [colorFilter, setColorFilter] = useState<NoteColor | "all">("all");
  const [sortNewest, setSortNewest]   = useState(true);

  // Editor state
  const [editorOpen, setEditorOpen]   = useState(false);
  const [editingNote, setEditingNote] = useState<StickyNote | undefined>();
  const [defaultColor, setDefaultColor] = useState<NoteColor>("yellow");

  // Delete confirm
  const [deletingId, setDeletingId]   = useState<number | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      let data: StickyNote[];
      if (search.trim()) {
        data = await searchNotes(search.trim());
      } else if (colorFilter !== "all") {
        data = await getNotesByColor(colorFilter);
      } else {
        data = await getAllNotes();
      }
      setNotes(data);
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [search, colorFilter]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // Debounce search so we don't fire on every keystroke
  useEffect(() => {
    const t = setTimeout(() => fetchNotes(), 250);
    return () => clearTimeout(t);
  }, [search, fetchNotes]);

  // ── Sorted notes ──────────────────────────────────────────────────────────
  const sorted = [...notes].sort((a, b) => {
    // Pinned always first
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const ta = new Date(a.updatedAt).getTime();
    const tb = new Date(b.updatedAt).getTime();
    return sortNewest ? tb - ta : ta - tb;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalNotes  = notes.length;
  const pinnedCount = notes.filter((n) => n.pinned).length;
  const colorCounts = ALL_COLORS.map((c) => ({
    color: c,
    count: notes.filter((n) => n.color === c).length,
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAdd = () => {
    setEditingNote(undefined);
    setDefaultColor(colorFilter !== "all" ? colorFilter : "yellow");
    setEditorOpen(true);
  };

  const handleEdit = (note: StickyNote) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const handleSave = async (payload: CreateNotePayload | UpdateNotePayload) => {
    if ("id" in payload) {
      const updated = await updateNote(payload as UpdateNotePayload);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      toast.success("Note updated");
    } else {
      const created = await addNote(payload as CreateNotePayload);
      setNotes((prev) => [created, ...prev]);
      toast.success("Note added");
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }
    try {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePin = async (id: number, pinned: boolean) => {
    try {
      const updated = await pinNote(id, pinned);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch {
      toast.error("Failed to update note");
    }
  };

  // Cancel pending delete if user clicks elsewhere
  const cancelDelete = () => setDeletingId(null);

  return (
    <div className="flex flex-col h-full" onClick={cancelDelete}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header mb-4">
        <div>
          <h2 className="page-title">Sticky Notes</h2>
          <p className="page-subtitle">Quick thoughts, reminders, and ideas — all in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotes}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-sm text-app-secondary hover:border-brand-400 transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 px-3 py-1.5 text-sm font-medium text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 wl-card px-3 py-2">
          <StickyNoteIcon className="h-4 w-4 text-brand-500" />
          <span className="text-sm font-semibold text-app-primary">{totalNotes}</span>
          <span className="text-xs text-app-muted">total</span>
        </div>
        {pinnedCount > 0 && (
          <div className="flex items-center gap-2 wl-card px-3 py-2">
            <Pin className="h-4 w-4 text-brand-400" />
            <span className="text-sm font-semibold text-app-primary">{pinnedCount}</span>
            <span className="text-xs text-app-muted">pinned</span>
          </div>
        )}
        {colorCounts.filter((c) => c.count > 0).map(({ color, count }) => (
          <div key={color} className="flex items-center gap-1.5 wl-card px-3 py-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", NOTE_COLORS[color].dot)} />
            <span className="text-sm font-medium text-app-secondary capitalize">{color}</span>
            <span className="text-xs text-app-muted">{count}</span>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="wl-input pl-8 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Color filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setColorFilter("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              colorFilter === "all"
                ? "bg-brand-500 border-brand-500 text-white"
                : "border-[var(--border-card)] text-app-secondary hover:border-brand-400"
            )}
          >
            All
          </button>
          {ALL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColorFilter(c)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize",
                colorFilter === c
                  ? cn(NOTE_COLORS[c].card, NOTE_COLORS[c].border, NOTE_COLORS[c].text)
                  : "border-[var(--border-card)] text-app-secondary hover:border-brand-300"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", NOTE_COLORS[c].dot)} />
              {c}
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortNewest((s) => !s)}
          className="ml-auto rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-xs text-app-secondary hover:border-brand-400 transition-colors"
        >
          {sortNewest ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {/* ── Notes Grid ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-36" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/20">
            <StickyNoteIcon className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-base font-semibold text-app-primary mb-1">
            {search || colorFilter !== "all" ? "No matching notes" : "No notes yet"}
          </h3>
          <p className="text-sm text-app-muted mb-4">
            {search || colorFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Click \"New Note\" to jot down your first thought."}
          </p>
          {!search && colorFilter === "all" && (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Create your first note
            </button>
          )}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start"
          style={{ gridAutoRows: "min-content" }}
        >
          {sorted.map((note) => (
            <div
              key={note.id}
              onClick={(e) => e.stopPropagation()}
            >
              {deletingId === note.id ? (
                // Inline delete confirm overlay
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-xl border p-4 text-center min-h-[120px]",
                    NOTE_COLORS[(note.color as NoteColor) ?? "yellow"].card,
                    NOTE_COLORS[(note.color as NoteColor) ?? "yellow"].border
                  )}
                >
                  <p className={cn("text-sm font-medium", NOTE_COLORS[(note.color as NoteColor) ?? "yellow"].text)}>
                    Delete this note?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                      className="rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-xs text-app-secondary hover:border-brand-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <NoteCard
                  note={note}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPin={handlePin}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Floating Add Button (bottom-right) ──────────────────────────── */}
      {sorted.length > 0 && (
        <button
          onClick={handleAdd}
          className={cn(
            "fixed bottom-6 right-6 z-40",
            "flex h-12 w-12 items-center justify-center rounded-full",
            "bg-brand-600 hover:bg-brand-700 shadow-lg hover:shadow-xl",
            "text-white transition-all active:scale-95"
          )}
          title="New Note"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* ── Editor Modal ─────────────────────────────────────────────────── */}
      <NoteEditor
        isOpen={editorOpen}
        note={editingNote}
        defaultColor={defaultColor}
        onSave={handleSave}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}
