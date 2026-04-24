import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, RefreshCw, ListTodo, CheckSquare, Clock, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { getAllTasks, addTask, updateTask, deleteTask } from "@/utils/tauriCommands";
import { useAppStore } from "@/store/appStore";
import type { Task, CreateTaskPayload, UpdateTaskPayload } from "@/types";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TaskCard from "@/components/tasks/TaskCard";
import TaskForm from "@/components/tasks/TaskForm";
import TaskFilters, { DEFAULT_FILTERS, type TaskFiltersState } from "@/components/tasks/TaskFilters";
import { todayISO } from "@/utils/dateUtils";

export default function TasksPage() {
  const { tasksRefreshKey, triggerTasksRefresh } = useAppStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [filters, setFilters] = useState<TaskFiltersState>(DEFAULT_FILTERS);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllTasks();
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks, tasksRefreshKey]);

  // ── All unique tags (for filter dropdown) ────────────────────────────────
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.tags) t.tags.split(",").forEach((tag) => { const s = tag.trim(); if (s) set.add(s); });
    });
    return Array.from(set).sort();
  }, [tasks]);

  // ── Filtered tasks ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.status !== "ALL" && t.status !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.details.toLowerCase().includes(q) && !t.notes.toLowerCase().includes(q)) return false;
      }
      if (filters.tag) {
        const tags = t.tags.split(",").map((s) => s.trim());
        if (!tags.includes(filters.tag)) return false;
      }
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo   && t.date > filters.dateTo)   return false;
      return true;
    });
  }, [tasks, filters]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:      tasks.length,
    completed:  tasks.filter((t) => t.status === "COMPLETED").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    blocked:    tasks.filter((t) => t.status === "BLOCKED").length,
    hours:      tasks.reduce((sum, t) => sum + t.timeSpent, 0),
  }), [tasks]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleAdd = async (payload: CreateTaskPayload | UpdateTaskPayload) => {
    await addTask(payload as CreateTaskPayload);
    toast.success("Task added");
    setShowAddModal(false);
    triggerTasksRefresh();
  };

  const handleEdit = async (payload: CreateTaskPayload | UpdateTaskPayload) => {
    await updateTask(payload as UpdateTaskPayload);
    toast.success("Task updated");
    setEditingTask(null);
    triggerTasksRefresh();
  };

  const handleDelete = async () => {
    if (deletingId == null) return;
    await deleteTask(deletingId);
    toast.success("Task deleted");
    setDeletingId(null);
    triggerTasksRefresh();
  };

  // ── Group filtered tasks by date ──────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    });
    // Sort dates descending
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Daily Tasks</h2>
          <p className="page-subtitle">Track your work items and productivity</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTasks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-app-secondary
                       hover:text-app-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium
                       bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: ListTodo,    label: "Total",       value: stats.total,      color: "text-brand-500"   },
          { icon: CheckSquare, label: "Completed",   value: stats.completed,  color: "text-emerald-500" },
          { icon: RefreshCw,   label: "In Progress", value: stats.inProgress, color: "text-blue-500"    },
          { icon: Clock,       label: "Hours Logged",value: `${stats.hours.toFixed(1)}h`, color: "text-violet-500" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="wl-card px-4 py-3 flex items-center gap-3">
            <Icon className={`h-5 w-5 ${color}`} />
            <div>
              <p className="text-lg font-bold text-app-primary">{value}</p>
              <p className="text-xs text-app-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <TaskFilters
        filters={filters}
        allTags={allTags}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* ── Task list ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="wl-card p-4">
              <div className="space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="wl-card flex flex-col items-center justify-center py-16 text-center">
          <ListTodo className="h-10 w-10 text-app-muted mb-3" />
          <p className="text-base font-semibold text-app-primary">No tasks found</p>
          <p className="text-sm text-app-muted mt-1">
            {tasks.length === 0
              ? "Add your first task to start tracking your work"
              : "Try adjusting your filters"}
          </p>
          {tasks.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                         bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add your first task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, dayTasks]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-app-muted uppercase tracking-wide">
                  {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "short", day: "numeric", year: "numeric"
                  })}
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-app-muted px-1.5 py-0.5 rounded-full">
                  {dayTasks.length}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="space-y-2">
                {dayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={setEditingTask}
                    onDelete={setDeletingId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={showAddModal} title="Add Task" onClose={() => setShowAddModal(false)}>
        <TaskForm
          defaultDate={todayISO()}
          onSave={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      <Modal isOpen={!!editingTask} title="Edit Task" onClose={() => setEditingTask(null)}>
        {editingTask && (
          <TaskForm
            task={editingTask}
            onSave={handleEdit}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>

      {/* ── Delete Confirm ──────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deletingId != null}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
      />
    </div>
  );
}
