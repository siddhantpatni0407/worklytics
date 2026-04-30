import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek } from "date-fns";
import {
  CalendarDays, ListTodo, StickyNote, BarChart3,
  TrendingUp, CheckCircle2, Clock, AlertTriangle,
  ArrowRight, Zap, Plus, MapPin, Home, Users,
  Target, Activity, PieChart, CalendarCheck, Pin,
  Flame, CircleDot,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/appStore";
import { getSummaryStats, getAllTasks, getAllNotes, getMonthStatuses } from "@/utils/tauriCommands";
import type { SummaryStats, Task, StickyNote as StickyNoteType, DayStatus } from "@/types";
import { getStatusStyle } from "@/components/tasks/TaskCard";
import { cn } from "@/utils/cn";
import { todayISO, formatDateISO, formatDisplayDate } from "@/utils/dateUtils";

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color, iconColor, onClick, progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  iconColor: string;
  onClick?: () => void;
  progress?: number; // 0-100
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "wl-card p-4 flex flex-col gap-3 transition-all duration-150 group relative overflow-hidden",
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      {/* Subtle bg accent */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200", color, "opacity-[0.03]")} />
      <div className="flex items-center justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", color)}>
          <span className={iconColor}>{icon}</span>
        </div>
        {onClick && <ArrowRight className="h-3.5 w-3.5 text-app-muted opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-app-primary leading-none">{value}</p>
        <p className="text-xs font-semibold text-app-secondary mt-1">{label}</p>
        {sub && <p className="text-[11px] text-app-muted mt-0.5 truncate">{sub}</p>}
      </div>
      {progress !== undefined && (
        <div className="h-1 bg-[var(--border-card)] rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", iconColor.replace("text-", "bg-"))}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}

const NOTE_STYLES: Record<string, { bar: string; bg: string; border: string }> = {
  yellow: { bar: "bg-amber-400",   bg: "bg-amber-50 dark:bg-amber-900/15",   border: "border-amber-200 dark:border-amber-800/50" },
  blue:   { bar: "bg-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/15",     border: "border-blue-200 dark:border-blue-800/50"   },
  green:  { bar: "bg-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/15", border: "border-emerald-200 dark:border-emerald-800/50" },
  pink:   { bar: "bg-pink-400",    bg: "bg-pink-50 dark:bg-pink-900/15",     border: "border-pink-200 dark:border-pink-800/50"   },
  purple: { bar: "bg-violet-400",  bg: "bg-violet-50 dark:bg-violet-900/15", border: "border-violet-200 dark:border-violet-800/50" },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const { settings, selectedYear, calendarRefreshKey, profile } = useAppStore();

  const [stats, setStats]                 = useState<SummaryStats | null>(null);
  const [recentTasks, setRecentTasks]     = useState<Task[]>([]);
  const [recentNotes, setRecentNotes]     = useState<StickyNoteType[]>([]);
  const [totalNotes, setTotalNotes]       = useState(0);
  const [totalTasks, setTotalTasks]       = useState(0);
  const [monthStatuses, setMonthStatuses] = useState<DayStatus[]>([]);
  const [loading, setLoading]             = useState(true);

  const today        = new Date();
  const currentYear  = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const todayStr     = todayISO();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, tasks, notes, statuses] = await Promise.all([
        getSummaryStats(selectedYear),
        getAllTasks(),
        getAllNotes(),
        getMonthStatuses(currentYear, currentMonth),
      ]);
      setStats(s);
      setTotalTasks(tasks.length);
      const sortedTasks = [...tasks].sort((a, b) =>
        b.date.localeCompare(a.date) || b.id - a.id
      );
      setRecentTasks(sortedTasks.slice(0, 6));
      const sorted = [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setRecentNotes(sorted.slice(0, 4));
      setTotalNotes(notes.length);
      setMonthStatuses(statuses);
    } catch {
      toast.error("Failed to load home data");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, currentYear, currentMonth]);

  useEffect(() => { fetchData(); }, [fetchData, calendarRefreshKey]);

  // Calendar mini-grid
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDow    = new Date(currentYear, currentMonth - 1, 1).getDay();
  const statusMap   = new Map(monthStatuses.map((s) => [s.date, s.effectiveStatus]));

  const STATUS_DOT: Record<string, string> = {
    WFO:     "bg-blue-500",
    WFH:     "bg-emerald-500",
    WFC:     "bg-violet-500",
    LEAVE:   "bg-amber-500",
    HOLIDAY: "bg-red-500",
    WEEKEND: "bg-slate-300 dark:bg-slate-700",
    UNSET:   "bg-slate-200 dark:bg-slate-700",
  };

  // Task-derived counters
  const activeTasks    = recentTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedToday = recentTasks.filter((t) => t.status === "COMPLETED" && t.date === todayStr).length;
  const blockedTasks   = recentTasks.filter((t) => t.status === "BLOCKED").length;
  const hoursToday     = recentTasks
    .filter((t) => t.date === todayStr)
    .reduce((s, t) => s + (t.timeSpent ?? 0), 0);

  // Week range label
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(today,   { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`;

  // Greeting
  const hour     = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile.name ? profile.name.split(" ")[0] : "";

  // Today work status
  const todayStatus = statusMap.get(todayStr);
  const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    WFO:     { label: "Working from Office", icon: <MapPin  className="h-3.5 w-3.5" />, color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"    },
    WFH:     { label: "Working from Home",   icon: <Home    className="h-3.5 w-3.5" />, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
    WFC:     { label: "Working from Client", icon: <Users   className="h-3.5 w-3.5" />, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"  },
    LEAVE:   { label: "On Leave",            icon: <CalendarCheck className="h-3.5 w-3.5" />, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"  },
    HOLIDAY: { label: "Public Holiday",      icon: <Flame   className="h-3.5 w-3.5" />, color: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"          },
  };

  // Year progress bar segments
  const yearBar = stats ? [
    { label: "Office",   value: stats.totalWfo,           color: "bg-blue-500"    },
    { label: "Remote",   value: stats.totalWfh,           color: "bg-emerald-500" },
    { label: "Client",   value: stats.totalWfc,           color: "bg-violet-500"  },
    { label: "Leave",    value: stats.totalLeave,         color: "bg-amber-500"   },
    { label: "Holiday",  value: stats.totalHoliday,       color: "bg-red-500"     },
    { label: "Unlogged", value: stats.unloggedWorkingDays, color: "bg-slate-300 dark:bg-slate-600" },
  ] : [];
  const yearTotal = stats?.totalWorkingDays || 1;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-32 wl-card animate-pulse rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 wl-card animate-pulse rounded-2xl" />)}
        </div>
        <div className="h-20 wl-card animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-72 wl-card animate-pulse rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="wl-card overflow-hidden">
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-brand-600/[0.12] via-brand-500/[0.06] to-transparent">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-brand-500/[0.07] blur-xl pointer-events-none" />
          <div className="absolute top-4 right-24 h-16 w-16 rounded-full bg-brand-400/[0.1] blur-lg pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Left: greeting */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-500 mb-1">
                {format(today, "EEEE, MMMM d, yyyy")}
              </p>
              <h1 className="text-2xl font-extrabold text-app-primary leading-tight">
                {greeting}{firstName ? `, ${firstName}` : ""}! 👋
              </h1>
              <p className="text-sm text-app-secondary mt-1">
                {format(today, "MMMM yyyy")} &nbsp;·&nbsp; Week {format(today, "w")} &nbsp;·&nbsp; {weekLabel}
              </p>
            </div>

            {/* Right: today status + quick actions */}
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              {todayStatus && STATUS_META[todayStatus] ? (
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold",
                  STATUS_META[todayStatus].color, STATUS_META[todayStatus].bg
                )}>
                  {STATUS_META[todayStatus].icon}
                  {STATUS_META[todayStatus].label}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-card)] text-xs font-semibold text-app-muted">
                  <CircleDot className="h-3.5 w-3.5" /> Status not set
                </div>
              )}
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
              >
                <CalendarDays className="h-3.5 w-3.5" /> Open Calendar
              </button>
            </div>
          </div>

          {/* Today at a glance strip */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-[var(--border-card)]">
            {[
              {
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                label: "Completed today",
                value: completedToday,
                color: "text-emerald-600",
              },
              {
                icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
                label: "Blocked",
                value: blockedTasks,
                color: "text-red-600",
              },
              {
                icon: <Clock className="h-4 w-4 text-violet-500" />,
                label: "Hours today",
                value: hoursToday > 0 ? `${hoursToday}h` : "—",
                color: "text-violet-600",
              },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="flex-shrink-0">{icon}</div>
                <div>
                  <p className={cn("text-lg font-extrabold leading-none", color)}>{value}</p>
                  <p className="text-[11px] text-app-muted mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MapPin className="h-4.5 w-4.5" />}
          label="WFO Days"
          value={stats?.totalWfo ?? 0}
          sub={`${stats?.officeWorkPct.toFixed(0) ?? 0}% of working days`}
          color="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600"
          progress={stats?.officeWorkPct}
          onClick={() => navigate("/dashboard")}
        />
        <StatCard
          icon={<Home className="h-4.5 w-4.5" />}
          label="WFH Days"
          value={stats?.totalWfh ?? 0}
          sub={`${stats?.remoteWorkPct.toFixed(0) ?? 0}% remote`}
          color="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600"
          progress={stats?.remoteWorkPct}
          onClick={() => navigate("/dashboard")}
        />
        <StatCard
          icon={<Activity className="h-4.5 w-4.5" />}
          label="Active Tasks"
          value={activeTasks}
          sub={`${totalTasks} total · ${completedToday} done today`}
          color="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600"
          onClick={() => navigate("/tasks")}
        />
        <StatCard
          icon={<StickyNote className="h-4.5 w-4.5" />}
          label="Sticky Notes"
          value={totalNotes}
          sub={recentNotes.some((n) => n.pinned) ? `${recentNotes.filter((n) => n.pinned).length} pinned` : "Quick reminders"}
          color="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600"
          onClick={() => navigate("/notes")}
        />
      </div>

      {/* ── Year Progress Bar ────────────────────────────────────────────── */}
      {stats && (
        <div className="wl-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-bold text-app-primary">{selectedYear} — Work Distribution</h3>
              <span className="text-xs text-app-muted">
                ({stats.daysLogged}/{stats.totalWorkingDays} days logged)
              </span>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium"
            >
              Full analytics <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Segmented bar */}
          <div className="flex h-3 rounded-full overflow-hidden gap-px mb-3 bg-[var(--border-card)]">
            {yearBar.filter((s) => s.value > 0).map(({ label, value, color }) => (
              <div
                key={label}
                className={cn("h-full transition-all duration-700", color)}
                style={{ width: `${(value / yearTotal) * 100}%` }}
                title={`${label}: ${value} days`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {yearBar.map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-sm flex-shrink-0", color)} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-app-primary leading-none">{value}</p>
                  <p className="text-[10px] text-app-muted truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Log Work Status", icon: <CalendarDays className="h-5 w-5" />, path: "/",          color: "text-brand-600",   bg: "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800"     },
          { label: "Add Task",        icon: <Plus         className="h-5 w-5" />, path: "/tasks",     color: "text-violet-600",  bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800" },
          { label: "New Note",        icon: <StickyNote   className="h-5 w-5" />, path: "/notes",     color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"     },
          { label: "View Analytics",  icon: <BarChart3    className="h-5 w-5" />, path: "/dashboard", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
        ].map(({ label, icon, path, color, bg }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={cn(
              "wl-card flex items-center gap-3 px-4 py-3 border text-left",
              "hover:shadow-md hover:-translate-y-0.5 transition-all duration-150",
              bg
            )}
          >
            <span className={cn("flex-shrink-0", color)}>{icon}</span>
            <span className={cn("text-sm font-semibold", color)}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Main three-panel grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Mini Calendar */}
        <div className="wl-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-bold text-app-primary">{format(today, "MMMM yyyy")}</h3>
            </div>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium"
            >
              Full view <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-7 mb-1">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-app-muted py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d       = i + 1;
                const dateStr = formatDateISO(new Date(currentYear, currentMonth - 1, d));
                const eff     = statusMap.get(dateStr);
                const isToday = dateStr === todayStr;
                const isFuture = dateStr > todayStr;
                return (
                  <div
                    key={d}
                    onClick={() => navigate("/")}
                    className={cn(
                      "flex items-center justify-center h-7 w-7 mx-auto rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-100 hover:scale-110",
                      isToday ? "ring-2 ring-brand-500 ring-offset-1" : "",
                      eff && !isFuture ? STATUS_DOT[eff] : "bg-[var(--bg-app)]",
                      eff && eff !== "UNSET" && eff !== "WEEKEND" && !isFuture ? "text-white" : "text-app-secondary"
                    )}
                    title={eff ?? (isFuture ? "Future" : "Unset")}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-[var(--border-card)]">
              {[["WFO","bg-blue-500"],["WFH","bg-emerald-500"],["WFC","bg-violet-500"],["Leave","bg-amber-500"],["Holiday","bg-red-500"]].map(([l,c]) => (
                <div key={l} className="flex items-center gap-1">
                  <span className={cn("h-2 w-2 rounded-sm", c)} />
                  <span className="text-[10px] text-app-muted">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="wl-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-bold text-app-primary">Recent Tasks</h3>
              <span className="text-[11px] text-app-muted bg-[var(--bg-app)] px-1.5 py-0.5 rounded-full border border-[var(--border-card)]">{totalTasks}</span>
            </div>
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium"
            >
              All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 divide-y divide-[var(--border-card)]">
            {recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Zap className="h-9 w-9 text-app-muted mb-2 opacity-50" />
                <p className="text-sm font-medium text-app-secondary">No tasks yet</p>
                <button onClick={() => navigate("/tasks")} className="mt-2 text-xs text-brand-500 hover:text-brand-600 font-medium">
                  Add your first task →
                </button>
              </div>
            ) : (
              recentTasks.map((task) => {
                const s = getStatusStyle(task.status);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-app)] transition-colors cursor-pointer group"
                    onClick={() => navigate("/tasks")}
                  >
                    <span className={cn("h-2 w-2 rounded-full flex-shrink-0", s.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium text-app-primary truncate",
                        task.status === "COMPLETED" && "line-through text-app-muted"
                      )}>
                        {task.title}
                      </p>
                      <p className="text-[11px] text-app-muted">{formatDisplayDate(task.date)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {task.timeSpent > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-app-muted">
                          <Clock className="h-2.5 w-2.5" />{task.timeSpent}h
                        </span>
                      )}
                      <span className={cn("wl-badge text-[10px] font-semibold", s.badge)}>{s.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {recentTasks.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[var(--border-card)] bg-[var(--bg-app)]">
              <button
                onClick={() => navigate("/tasks")}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 font-semibold py-0.5"
              >
                <Plus className="h-3 w-3" /> Add new task
              </button>
            </div>
          )}
        </div>

        {/* Recent Notes */}
        <div className="wl-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-bold text-app-primary">Sticky Notes</h3>
              <span className="text-[11px] text-app-muted bg-[var(--bg-app)] px-1.5 py-0.5 rounded-full border border-[var(--border-card)]">{totalNotes}</span>
            </div>
            <button
              onClick={() => navigate("/notes")}
              className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium"
            >
              All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 p-3 space-y-2.5">
            {recentNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <StickyNote className="h-9 w-9 text-app-muted mb-2 opacity-50" />
                <p className="text-sm font-medium text-app-secondary">No notes yet</p>
                <button onClick={() => navigate("/notes")} className="mt-2 text-xs text-brand-500 hover:text-brand-600 font-medium">
                  Create a note →
                </button>
              </div>
            ) : (
              recentNotes.map((note) => {
                const ns = NOTE_STYLES[note.color] ?? NOTE_STYLES.yellow;
                return (
                  <div
                    key={note.id}
                    onClick={() => navigate("/notes")}
                    className={cn(
                      "rounded-xl border overflow-hidden cursor-pointer hover:shadow-sm transition-all group",
                      ns.bg, ns.border
                    )}
                  >
                    <div className={cn("h-1 w-full", ns.bar)} />
                    <div className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        {note.pinned && <Pin className="h-3 w-3 text-app-muted" />}
                        <p className="text-xs font-bold text-app-primary truncate flex-1">
                          {note.title || "Untitled"}
                        </p>
                      </div>
                      <p className="text-[11px] text-app-secondary line-clamp-2 leading-relaxed">
                        {note.content || <span className="text-app-muted italic">No content</span>}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {recentNotes.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[var(--border-card)] bg-[var(--bg-app)]">
              <button
                onClick={() => navigate("/notes")}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 font-semibold py-0.5"
              >
                <Plus className="h-3 w-3" /> New note
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


function QuickStat({
  icon, label, value, sub, color, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "wl-card p-4 flex items-start gap-3 transition-all duration-150",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
      )}
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0", color)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-app-muted font-medium truncate">{label}</p>
        <p className="text-2xl font-bold text-app-primary leading-tight">{value}</p>
        {sub && <p className="text-xs text-app-muted mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { settings, selectedYear, calendarRefreshKey, profile } = useAppStore();

  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentNotes, setRecentNotes] = useState<StickyNoteType[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [monthStatuses, setMonthStatuses] = useState<DayStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, tasks, notes, statuses] = await Promise.all([
        getSummaryStats(selectedYear),
        getAllTasks(),
        getAllNotes(),
        getMonthStatuses(currentYear, currentMonth),
      ]);
      setStats(s);
      setTotalTasks(tasks.length);
      // Last 5 tasks sorted by date desc then id desc
      const sortedTasks = [...tasks].sort((a, b) =>
        b.date.localeCompare(a.date) || b.id - a.id
      );
      setRecentTasks(sortedTasks.slice(0, 5));
      // Last 4 notes (pinned first)
      const sorted = [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setRecentNotes(sorted.slice(0, 4));
      setTotalNotes(notes.length);
      setMonthStatuses(statuses);
    } catch {
      toast.error("Failed to load home data");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, currentYear, currentMonth]);

  useEffect(() => { fetchData(); }, [fetchData, calendarRefreshKey]);

  // Calendar mini-grid
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDow = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0=Sun
  const statusMap = new Map(monthStatuses.map((s) => [s.date, s.effectiveStatus]));

  const STATUS_COLOR: Record<string, string> = {
    WFO:     "bg-blue-500",
    WFH:     "bg-emerald-500",
    WFC:     "bg-violet-500",
    LEAVE:   "bg-amber-500",
    HOLIDAY: "bg-red-500",
    WEEKEND: "bg-slate-300 dark:bg-slate-700",
    UNSET:   "bg-slate-200 dark:bg-slate-800",
  };

  const todayStr = todayISO();

  // Task quick counts — status-agnostic: "active" = anything not COMPLETED/BLOCKED
  const pendingTasks = recentTasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "BLOCKED"
  ).length;
  const completedToday = recentTasks.filter(
    (t) => t.status === "COMPLETED" && t.date === todayStr
  ).length;
  const blockedTasks = recentTasks.filter((t) => t.status === "BLOCKED").length;

  const greeting = () => {
    const h = today.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 wl-card animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 wl-card animate-pulse rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 wl-card animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Welcome banner ─────────────────────────────────────────────── */}
      <div className="wl-card p-5 flex items-center justify-between gap-4 bg-gradient-to-r from-brand-600/10 to-brand-500/5 border-brand-500/20">
        <div>
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-1">
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
          <h2 className="text-xl font-bold text-app-primary">
            {greeting()}{profile.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋
          </h2>
          <p className="text-sm text-app-muted mt-1">Here's what's happening today</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-app-muted">Work Status Today</p>
            <p className={cn(
              "text-sm font-bold mt-0.5",
              statusMap.get(todayStr) === "WFO" ? "text-blue-500" :
              statusMap.get(todayStr) === "WFH" ? "text-emerald-500" :
              statusMap.get(todayStr) === "WFC" ? "text-violet-500" :
              "text-app-muted"
            )}>
              {statusMap.get(todayStr) ?? "Not Set"}
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            <span>Update</span>
          </button>
        </div>
      </div>

      {/* ── Quick stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
          label="WFO Days"
          value={stats?.totalWfo ?? 0}
          sub={`${stats?.officeWorkPct.toFixed(0) ?? 0}% of working days`}
          color="bg-blue-100 dark:bg-blue-900/30"
          onClick={() => navigate("/dashboard")}
        />
        <QuickStat
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          label="WFH Days"
          value={stats?.totalWfh ?? 0}
          sub={`${stats?.remoteWorkPct.toFixed(0) ?? 0}% remote`}
          color="bg-emerald-100 dark:bg-emerald-900/30"
          onClick={() => navigate("/dashboard")}
        />
        <QuickStat
          icon={<CheckCircle2 className="h-5 w-5 text-violet-600" />}
          label="Tasks In Progress"
          value={pendingTasks}
          sub={`of ${totalTasks} total`}
          color="bg-violet-100 dark:bg-violet-900/30"
          onClick={() => navigate("/tasks")}
        />
        <QuickStat
          icon={<StickyNote className="h-5 w-5 text-amber-600" />}
          label="Total Notes"
          value={totalNotes}
          sub={recentNotes.some((n) => n.pinned) ? "Some pinned" : "Quick reminders"}
          color="bg-amber-100 dark:bg-amber-900/30"
          onClick={() => navigate("/notes")}
        />
      </div>

      {/* ── Main panels ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Mini Calendar */}
        <div className="wl-card overflow-hidden lg:col-span-1">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-semibold text-app-primary">
                {format(today, "MMMM yyyy")}
              </h3>
            </div>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              Full view <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-app-muted py-1">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const dateStr = formatDateISO(new Date(currentYear, currentMonth - 1, d));
                const eff = statusMap.get(dateStr);
                const isT = dateStr === todayStr;
                return (
                  <div
                    key={d}
                    className={cn(
                      "flex items-center justify-center h-7 w-7 mx-auto rounded-lg text-[11px] font-medium cursor-pointer transition-transform hover:scale-110",
                      isT ? "ring-2 ring-brand-500 font-bold text-brand-600 dark:text-brand-400" : "",
                      eff ? STATUS_COLOR[eff] : "bg-slate-100 dark:bg-slate-800",
                      eff && eff !== "UNSET" && eff !== "WEEKEND" ? "text-white" : "text-app-secondary"
                    )}
                    title={eff ?? "Unset"}
                    onClick={() => navigate("/")}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--border-card)]">
              {[["WFO","bg-blue-500"],["WFH","bg-emerald-500"],["WFC","bg-violet-500"],["Leave","bg-amber-500"]].map(([l,c]) => (
                <div key={l} className="flex items-center gap-1">
                  <span className={cn("h-2 w-2 rounded-sm", c)} />
                  <span className="text-[10px] text-app-muted">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="wl-card overflow-hidden lg:col-span-1">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-semibold text-app-primary">Recent Tasks</h3>
            </div>
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              All tasks <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-[var(--border-card)]">
            {recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Zap className="h-8 w-8 text-app-muted mb-2" />
                <p className="text-sm text-app-muted">No tasks yet</p>
                <button
                  onClick={() => navigate("/tasks")}
                  className="mt-2 text-xs text-brand-500 hover:text-brand-600"
                >
                  Add your first task
                </button>
              </div>
            ) : (
              recentTasks.map((task) => {
                const style = getStatusStyle(task.status);
                return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", style.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-app-primary truncate">{task.title}</p>
                    <p className="text-[11px] text-app-muted">{task.date}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0",
                    style.badge
                  )}>
                    {style.label}
                  </span>
                </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="wl-card overflow-hidden lg:col-span-1">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-card)]">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-semibold text-app-primary">Recent Notes</h3>
            </div>
            <button
              onClick={() => navigate("/notes")}
              className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              All notes <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="p-3 space-y-2">
            {recentNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <StickyNote className="h-8 w-8 text-app-muted mb-2" />
                <p className="text-sm text-app-muted">No notes yet</p>
                <button
                  onClick={() => navigate("/notes")}
                  className="mt-2 text-xs text-brand-500 hover:text-brand-600"
                >
                  Create a note
                </button>
              </div>
            ) : (
              recentNotes.map((note) => {
                const CHIP: Record<string, string> = {
                  yellow: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700",
                  blue:   "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700",
                  green:  "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700",
                  pink:   "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-700",
                  purple: "bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-700",
                };
                return (
                  <div
                    key={note.id}
                    onClick={() => navigate("/notes")}
                    className={cn(
                      "rounded-lg border p-2.5 cursor-pointer hover:shadow-sm transition-shadow",
                      CHIP[note.color] ?? CHIP.yellow
                    )}
                  >
                    <p className="text-xs font-semibold text-app-primary truncate">
                      {note.title || "Untitled"}
                    </p>
                    <p className="text-[11px] text-app-secondary mt-0.5 line-clamp-2">
                      {note.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Analytics summary strip ───────────────────────────────────── */}
      {stats && (
        <div className="wl-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-semibold text-app-primary">Year {selectedYear} Summary</h3>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              Full analytics <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: "Office", value: stats.totalWfo, pct: stats.officeWorkPct, color: "bg-blue-500" },
              { label: "Remote", value: stats.totalWfh, pct: stats.remoteWorkPct, color: "bg-emerald-500" },
              { label: "Client", value: stats.totalWfc, pct: 0, color: "bg-violet-500" },
              { label: "Leave",  value: stats.totalLeave, pct: 0, color: "bg-amber-500" },
              { label: "Holiday",value: stats.totalHoliday, pct: 0, color: "bg-red-500" },
              { label: "Unlogged",value: stats.unloggedWorkingDays, pct: 0, color: "bg-slate-400" },
            ].map(({ label, value, pct, color }) => (
              <div key={label} className="text-center">
                <div className={cn("h-1.5 rounded-full mb-2", color)} />
                <p className="text-base font-bold text-app-primary">{value}</p>
                <p className="text-[11px] text-app-muted">{label}</p>
                {pct > 0 && <p className="text-[10px] text-app-muted">{pct.toFixed(0)}%</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
