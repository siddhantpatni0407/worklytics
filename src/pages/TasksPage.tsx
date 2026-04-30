import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, RefreshCw, ListTodo, CheckSquare, Clock, AlertCircle, LayoutGrid, List } from "lucide-react";
import toast from "react-hot-toast";
import { getAllTasks, addTask, updateTask, deleteTask } from "@/utils/tauriCommands";
import { useAppStore } from "@/store/appStore";
import type { Task, CreateTaskPayload, UpdateTaskPayload } from "@/types";
import { parseTaskMeta } from "@/types";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TaskCard from "@/components/tasks/TaskCard";
import TaskForm from "@/components/tasks/TaskForm";
import KanbanView from "@/components/tasks/KanbanView";
import TaskFilters, {
  DEFAULT_FILTERS,
  type TaskFiltersState,
  type TaskPeriod,
} from "@/components/tasks/TaskFilters";
import { todayISO, formatDateISO } from "@/utils/dateUtils";
import { cn } from "@/utils/cn";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear,
} from "date-fns";

// ─── Resolve the from/to ISO strings for a given period ──────────────────────
function resolvePeriodRange(period: TaskPeriod, customFrom: string, customTo: string): { from: string; to: string } {
  const today = new Date();
  switch (period) {
    case "TODAY":
      return { from: todayISO(), to: todayISO() };
    case "THIS_WEEK":
      return {
        from: formatDateISO(startOfWeek(today, { weekStartsOn: 1 })),
        to:   formatDateISO(endOfWeek(today,   { weekStartsOn: 1 })),
      };
    case "THIS_MONTH":
      return {
        from: formatDateISO(startOfMonth(today)),
        to:   formatDateISO(endOfMonth(today)),
      };
    case "THIS_YEAR":
      return {
        from: formatDateISO(startOfYear(today)),
        to:   formatDateISO(endOfYear(today)),
      };
    case "ALL":
      return { from: "", to: "" };
    case "CUSTOM":
      return { from: customFrom, to: customTo };
  }
}

export default function TasksPage() {
  const { tasksRefreshKey, triggerTasksRefresh, taskViewMode, setTaskViewMode, settings } = useAppStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [filters, setFilters] = useState<TaskFiltersState>(DEFAULT_FILTERS);

  // ── Fetch all tasks once ─────────────────────────────────────────────────
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

  // ── Resolved date range for the current period ───────────────────────────
  const { from: resolvedFrom, to: resolvedTo } = useMemo(
    () => resolvePeriodRange(filters.period, filters.dateFrom, filters.dateTo),
    [filters.period, filters.dateFrom, filters.dateTo]
  );

  // ── All unique sprints / projects / teams / tags ─────────────────────────
  const { allSprints, allProjects, allTeams, allTags } = useMemo(() => {
    const sprints  = new Set<string>(settings.sprints  ?? []);
    const projects = new Set<string>(settings.projects ?? []);
    const teams    = new Set<string>(settings.teams    ?? []);
    const tags     = new Set<string>();
    tasks.forEach((t) => {
      if (!t.tags) return;
      const { sprint, project, team, regularTags } = parseTaskMeta(t.tags);
      if (sprint)  sprints.add(sprint);
      if (project) projects.add(project);
      if (team)    teams.add(team);
      regularTags.forEach((tag) => tags.add(tag));
    });
    return {
      allSprints:  Array.from(sprints).sort(),
      allProjects: Array.from(projects).sort(),
      allTeams:    Array.from(teams).sort(),
      allTags:     Array.from(tags).sort(),
    };
  }, [tasks, settings.sprints, settings.projects, settings.teams]);

  // ── Filtered tasks ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      // Period / date range
      if (resolvedFrom && t.date < resolvedFrom) return false;
      if (resolvedTo   && t.date > resolvedTo)   return false;
      // Status
      if (filters.status !== "ALL" && t.status !== filters.status) return false;
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.details.toLowerCase().includes(q) &&
          !t.notes.toLowerCase().includes(q)
        ) return false;
      }
      // Sprint / Project / Team / Tag — parsed from tags column
      if (filters.sprint || filters.project || filters.team || filters.tag) {
        const { sprint, project, team, regularTags } = parseTaskMeta(t.tags);
        if (filters.sprint  && sprint  !== filters.sprint)            return false;
        if (filters.project && project !== filters.project)          return false;
        if (filters.team    && team    !== filters.team)              return false;
        if (filters.tag     && !regularTags.includes(filters.tag))   return false;
      }
      return true;
    });
  }, [tasks, filters, resolvedFrom, resolvedTo]);

  // ── Stats (from filtered set) ─────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:      filtered.length,
    completed:  filtered.filter((t) => t.status === "COMPLETED").length,
    inProgress: filtered.filter((t) => t.status === "IN_PROGRESS").length,
    blocked:    filtered.filter((t) => t.status === "BLOCKED").length,
    hours:      filtered.reduce((sum, t) => sum + t.timeSpent, 0),
  }), [filtered]);

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

  // ── Group filtered tasks by date (newest date first) ─────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    filtered.forEach((t) => {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    });
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
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-[var(--border-card)] overflow-hidden">
            <button
              onClick={() => setTaskViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
                taskViewMode === "list"
                  ? "bg-brand-600 text-white"
                  : "text-app-secondary hover:text-app-primary hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setTaskViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
                taskViewMode === "kanban"
                  ? "bg-brand-600 text-white"
                  : "text-app-secondary hover:text-app-primary hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
              title="Kanban view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
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

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <TaskFilters
        filters={filters}
        allTags={allTags}
        allSprints={allSprints}
        allProjects={allProjects}
        allTeams={allTeams}
        resolvedFrom={resolvedFrom}
        resolvedTo={resolvedTo}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* ── Stats (reflect filtered set) ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: ListTodo,    label: "Total",       value: stats.total,      color: "text-brand-500"   },
          { icon: CheckSquare, label: "Completed",   value: stats.completed,  color: "text-emerald-500" },
          { icon: RefreshCw,   label: "In Progress", value: stats.inProgress, color: "text-blue-500"    },
          { icon: AlertCircle, label: "Blocked",     value: stats.blocked,    color: "text-red-500"     },
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

      {/* ── Hours logged ────────────────────────────────────────────────── */}
      {stats.hours > 0 && (
        <div className="wl-card px-4 py-2.5 flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-violet-500" />
          <span className="font-semibold text-app-primary">{stats.hours.toFixed(1)}h</span>
          <span className="text-app-muted">logged in this period</span>
        </div>
      )}

      {/* ── Task list / Kanban ──────────────────────────────────────── */}
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
      ) : filtered.length === 0 ? (
        <div className="wl-card flex flex-col items-center justify-center py-16 text-center">
          <ListTodo className="h-10 w-10 text-app-muted mb-3" />
          <p className="text-base font-semibold text-app-primary">No tasks found</p>
          <p className="text-sm text-app-muted mt-1">
            {tasks.length === 0
              ? "Add your first task to start tracking your work"
              : "No tasks match the current filters"}
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
      ) : taskViewMode === "kanban" ? (
        <KanbanView tasks={filtered} onEdit={setEditingTask} onDelete={setDeletingId} />
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, dayTasks]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold text-app-muted uppercase tracking-wide">
                  {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "short", day: "numeric", year: "numeric",
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
