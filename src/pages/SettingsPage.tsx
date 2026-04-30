import { useState, useEffect } from "react";
import {
  Monitor, Sun, Moon, Globe, Calendar,
  ToggleLeft, Save, RefreshCw, Database, FolderOpen,
  RotateCcw, CheckCircle, Palette, Layers, Briefcase, Users,
  Plus, X, ListTodo, Info, User, Mail, Github,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/appStore";
import {
  setSettingsBatch, getDbPath, getDefaultDbPath, isCustomDbPath,
  selectDbDirectory, migrateDb, resetDbPath,
} from "@/utils/tauriCommands";
import type { ThemeMode, DbPathInfo, ThemeAccentColor } from "@/types";
import { cn } from "@/utils/cn";
import { ACCENT_COLORS, applyAccentColor } from "@/store/appStore";

const TIMEZONES = [
  "Asia/Kolkata", "UTC", "America/New_York", "America/Chicago",
  "America/Denver", "America/Los_Angeles", "Europe/London",
  "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai",
  "Asia/Singapore", "Australia/Sydney", "Pacific/Auckland",
];

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="wl-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border-card)] bg-slate-50 dark:bg-slate-800/50">
        <span className="text-brand-500">{icon}</span>
        <h3 className="text-sm font-semibold text-app-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-5 border-b border-[var(--border-card)] last:border-0">
      <div>
        <p className="text-sm font-medium text-app-primary">{label}</p>
        {description && <p className="text-xs text-app-muted mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "wl-toggle",
          checked ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600"
        )}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn(
            "wl-toggle-thumb",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, triggerCalendarRefresh, triggerAnalyticsRefresh } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...settings });

  // Metadata list states (sprints, projects, teams)
  const [newSprint, setNewSprint]   = useState("");
  const [newProject, setNewProject] = useState("");
  const [newTeam, setNewTeam]       = useState("");
  const [newStatus, setNewStatus]   = useState("");

  // Developer / About info
  const [devName,   setDevName]   = useState(localSettings.developerName   ?? "Siddhant Patni");
  const [devEmail,  setDevEmail]  = useState(localSettings.developerEmail  ?? "");
  const [devGithub, setDevGithub] = useState(localSettings.developerGithub ?? "");

  // Database path state
  const [dbInfo, setDbInfo] = useState<DbPathInfo | null>(null);
  const [pendingDbPath, setPendingDbPath] = useState<string | null>(null);
  const [dbMigrating, setDbMigrating] = useState(false);

  const loadDbInfo = async () => {
    try {
      const [currentPath, defaultPath, isCustom] = await Promise.all([
        getDbPath(), getDefaultDbPath(), isCustomDbPath(),
      ]);
      setDbInfo({ currentPath, defaultPath, isCustom });
    } catch { /* Non-critical */ }
  };

  useEffect(() => { loadDbInfo(); }, []);
  useEffect(() => { setLocalSettings({ ...settings }); }, [settings]);

  const handleBrowseDb = async () => {
    try {
      const dir = await selectDbDirectory();
      if (dir) {
        // Append the DB filename to the chosen directory
        const sep = dir.includes("/") ? "/" : "\\";
        setPendingDbPath(`${dir}${sep}worklytics.db`);
      }
    } catch {
      toast.error("Could not open folder picker");
    }
  };

  const handleApplyDbPath = async () => {
    if (!pendingDbPath) return;
    setDbMigrating(true);
    try {
      const newPath = await migrateDb(pendingDbPath);
      toast.success("Database migrated successfully");
      setPendingDbPath(null);
      setDbInfo((prev) => prev ? { ...prev, currentPath: newPath, isCustom: true } : null);
      await loadDbInfo();
    } catch (e) {
      toast.error(`Migration failed: ${e}`);
    } finally {
      setDbMigrating(false);
    }
  };

  const handleResetDb = async () => {
    setDbMigrating(true);
    try {
      const defaultPath = await resetDbPath();
      toast.success("Database reset to default location");
      setPendingDbPath(null);
      setDbInfo((prev) => prev ? { ...prev, currentPath: defaultPath, isCustom: false } : null);
    } catch (e) {
      toast.error(`Reset failed: ${e}`);
    } finally {
      setDbMigrating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist to SQLite
      await setSettingsBatch([
        ["theme",            localSettings.theme],
        ["timezone",         localSettings.timezone],
        ["year_start",       String(localSettings.yearStart)],
        ["year_end",         String(localSettings.yearEnd)],
        ["work_saturday",    String(localSettings.workSaturday)],
        ["work_sunday",      String(localSettings.workSunday)],
        ["accent_color",     localSettings.accentColor ?? "indigo"],
        ["sprints",          JSON.stringify(localSettings.sprints ?? [])],
        ["projects",         JSON.stringify(localSettings.projects ?? [])],
        ["teams",            JSON.stringify(localSettings.teams ?? [])],
        ["custom_statuses",  JSON.stringify(localSettings.customStatuses ?? [])],
        ["developer_name",   devName.trim()],
        ["developer_email",  devEmail.trim()],
        ["developer_github", devGithub.trim()],
      ]);
      // Apply to store (triggers re-renders)
      updateSettings({ ...localSettings, developerName: devName.trim(), developerEmail: devEmail.trim(), developerGithub: devGithub.trim() });
      triggerCalendarRefresh();
      triggerAnalyticsRefresh();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: "light",  label: "Light",  icon: <Sun  className="h-4 w-4" /> },
    { value: "dark",   label: "Dark",   icon: <Moon className="h-4 w-4" /> },
    { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Configure application behaviour</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-white",
            "bg-brand-600 hover:bg-brand-700 transition-colors",
            saving && "opacity-60 cursor-not-allowed"
          )}
        >
          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {/* Theme */}
      <SectionCard icon={<Sun className="h-4 w-4" />} title="Appearance">
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="wl-label">Theme</label>
            <div className="flex gap-2 mt-1">
              {THEME_OPTIONS.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setLocalSettings((s) => ({ ...s, theme: value }))}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                    localSettings.theme === value
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400"
                      : "border-[var(--border-card)] text-app-secondary hover:border-brand-400"
                  )}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label className="wl-label flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" /> Accent Color
            </label>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {(Object.keys(ACCENT_COLORS) as ThemeAccentColor[]).map((c) => {
                const hex = ACCENT_COLORS[c]["500"];
                const isSelected = (localSettings.accentColor ?? "indigo") === c;
                return (
                  <button
                    key={c}
                    onClick={() => {
                    setLocalSettings((s) => ({ ...s, accentColor: c }));
                    applyAccentColor(c); // live preview
                  }}
                    title={c}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all",
                      isSelected
                        ? "border-current text-white shadow-md scale-105"
                        : "border-[var(--border-card)] text-app-secondary hover:scale-105"
                    )}
                    style={isSelected ? { backgroundColor: hex, borderColor: hex } : {}}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: hex }} />
                    {c}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-app-muted mt-2">Changes sidebar highlights, buttons, and interactive elements.</p>
          </div>
        </div>
      </SectionCard>

      {/* Timezone */}
      <SectionCard icon={<Globe className="h-4 w-4" />} title="Timezone & Clock">
        <div className="px-5 py-4">
          <label className="wl-label">Display Timezone</label>
          <select
            value={localSettings.timezone}
            onChange={(e) => setLocalSettings((s) => ({ ...s, timezone: e.target.value }))}
            className="wl-select mt-1"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <p className="text-xs text-app-muted mt-1.5">
            Controls the timezone shown in the header clock and used for date calculations.
          </p>
        </div>
      </SectionCard>

      {/* Year range */}
      <SectionCard icon={<Calendar className="h-4 w-4" />} title="Calendar Year Range">
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <label className="wl-label">Start Year</label>
            <input
              type="number"
              value={localSettings.yearStart}
              min={1990}
              max={localSettings.yearEnd - 1}
              onChange={(e) => setLocalSettings((s) => ({ ...s, yearStart: Number(e.target.value) }))}
              className="wl-input"
            />
          </div>
          <div>
            <label className="wl-label">End Year</label>
            <input
              type="number"
              value={localSettings.yearEnd}
              min={localSettings.yearStart + 1}
              max={2100}
              onChange={(e) => setLocalSettings((s) => ({ ...s, yearEnd: Number(e.target.value) }))}
              className="wl-input"
            />
          </div>
        </div>
        <p className="px-5 pb-4 text-xs text-app-muted">
          The year dropdowns in Calendar and Analytics will show years in this range. Default: 2020–2050.
        </p>
      </SectionCard>

      {/* Task Statuses */}
      <SectionCard icon={<ListTodo className="h-4 w-4" />} title="Task Statuses">
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="wl-label mb-2">Built-in (always available)</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "To Do",       cls: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600" },
                { label: "In Progress", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
                { label: "Completed",   cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
                { label: "Blocked",     cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800" },
              ].map(({ label, cls }) => (
                <span key={label} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>{label}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="wl-label mb-2">Custom Statuses</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(localSettings.customStatuses ?? []).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  {s}
                  <button onClick={() => setLocalSettings((st) => ({ ...st, customStatuses: (st.customStatuses ?? []).filter((x) => x !== s) }))} className="hover:text-red-500">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {(localSettings.customStatuses ?? []).length === 0 && <span className="text-xs text-app-muted">No custom statuses</span>}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="e.g. REVIEW or TESTING"
                className="wl-input flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newStatus.trim()) {
                    setLocalSettings((s) => ({ ...s, customStatuses: [...(s.customStatuses ?? []), newStatus.trim().toUpperCase().replace(/\s+/g, "_")] }));
                    setNewStatus("");
                    e.preventDefault();
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newStatus.trim()) {
                    setLocalSettings((s) => ({ ...s, customStatuses: [...(s.customStatuses ?? []), newStatus.trim().toUpperCase().replace(/\s+/g, "_")] }));
                    setNewStatus("");
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-card)] text-sm hover:border-brand-400 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            <p className="text-xs text-app-muted mt-2">Status names are auto-uppercased and spaces replaced with underscores (e.g. "In Review" → IN_REVIEW). Save settings to apply.</p>
          </div>
        </div>
      </SectionCard>

      {/* Task Metadata */}
      <SectionCard icon={<Layers className="h-4 w-4" />} title="Task Metadata">
        <div className="px-5 py-4 space-y-5">
          {/* Sprints */}
          <div>
            <label className="wl-label flex items-center gap-1.5">
              <Layers className="h-3 w-3 text-indigo-500" /> Sprints
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
              {(localSettings.sprints ?? []).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {s}
                  <button onClick={() => setLocalSettings((st) => ({ ...st, sprints: st.sprints.filter((x) => x !== s) }))} className="hover:text-red-500">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {(localSettings.sprints ?? []).length === 0 && <span className="text-xs text-app-muted">No sprints configured</span>}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSprint} onChange={(e) => setNewSprint(e.target.value)} placeholder="e.g. Sprint 5" className="wl-input flex-1" onKeyDown={(e) => { if (e.key === "Enter" && newSprint.trim()) { setLocalSettings((s) => ({ ...s, sprints: [...(s.sprints ?? []), newSprint.trim()] })); setNewSprint(""); e.preventDefault(); } }} />
              <button onClick={() => { if (newSprint.trim()) { setLocalSettings((s) => ({ ...s, sprints: [...(s.sprints ?? []), newSprint.trim()] })); setNewSprint(""); } }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-card)] text-sm hover:border-brand-400 transition-colors"><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
          </div>

          {/* Projects */}
          <div>
            <label className="wl-label flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 text-teal-500" /> Projects
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
              {(localSettings.projects ?? []).map((p) => (
                <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {p}
                  <button onClick={() => setLocalSettings((st) => ({ ...st, projects: st.projects.filter((x) => x !== p) }))} className="hover:text-red-500">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {(localSettings.projects ?? []).length === 0 && <span className="text-xs text-app-muted">No projects configured</span>}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="e.g. Phoenix" className="wl-input flex-1" onKeyDown={(e) => { if (e.key === "Enter" && newProject.trim()) { setLocalSettings((s) => ({ ...s, projects: [...(s.projects ?? []), newProject.trim()] })); setNewProject(""); e.preventDefault(); } }} />
              <button onClick={() => { if (newProject.trim()) { setLocalSettings((s) => ({ ...s, projects: [...(s.projects ?? []), newProject.trim()] })); setNewProject(""); } }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-card)] text-sm hover:border-brand-400 transition-colors"><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
          </div>

          {/* Teams */}
          <div>
            <label className="wl-label flex items-center gap-1.5">
              <Users className="h-3 w-3 text-orange-500" /> Teams
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
              {(localSettings.teams ?? []).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  {t}
                  <button onClick={() => setLocalSettings((st) => ({ ...st, teams: st.teams.filter((x) => x !== t) }))} className="hover:text-red-500">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {(localSettings.teams ?? []).length === 0 && <span className="text-xs text-app-muted">No teams configured</span>}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} placeholder="e.g. Platform" className="wl-input flex-1" onKeyDown={(e) => { if (e.key === "Enter" && newTeam.trim()) { setLocalSettings((s) => ({ ...s, teams: [...(s.teams ?? []), newTeam.trim()] })); setNewTeam(""); e.preventDefault(); } }} />
              <button onClick={() => { if (newTeam.trim()) { setLocalSettings((s) => ({ ...s, teams: [...(s.teams ?? []), newTeam.trim()] })); setNewTeam(""); } }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-card)] text-sm hover:border-brand-400 transition-colors"><Plus className="h-3.5 w-3.5" /> Add</button>
            </div>
          </div>
          <p className="text-xs text-app-muted">These will appear as dropdowns in the Add/Edit Task form.</p>
        </div>
      </SectionCard>

      {/* Database Configuration */}
      <SectionCard icon={<Database className="h-4 w-4" />} title="Database Configuration">
        <div className="px-5 py-4 space-y-4">
          {/* Current path display */}
          <div>
            <label className="wl-label">Current Database Location</label>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-[var(--border-card)] bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
              <Database className="h-3.5 w-3.5 text-app-muted flex-shrink-0" />
              <span
                className="flex-1 truncate font-mono text-xs text-app-secondary"
                title={dbInfo?.currentPath}
              >
                {dbInfo?.currentPath ?? "Loading…"}
              </span>
              {dbInfo?.isCustom && (
                <span className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                  Custom
                </span>
              )}
            </div>
          </div>

          {/* Pending new path preview */}
          {pendingDbPath && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">
                New location (pending):
              </p>
              <p className="font-mono text-xs text-amber-600 dark:text-amber-300 truncate" title={pendingDbPath}>
                {pendingDbPath}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBrowseDb}
              disabled={dbMigrating}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-card)] px-3 py-1.5 text-sm text-app-secondary hover:border-brand-400 hover:text-brand-600 transition-colors disabled:opacity-50"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Browse…
            </button>

            {pendingDbPath && (
              <button
                onClick={handleApplyDbPath}
                disabled={dbMigrating}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
              >
                {dbMigrating
                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  : <CheckCircle className="h-3.5 w-3.5" />
                }
                {dbMigrating ? "Migrating…" : "Apply & Migrate"}
              </button>
            )}

            {dbInfo?.isCustom && !pendingDbPath && (
              <button
                onClick={handleResetDb}
                disabled={dbMigrating}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Default
              </button>
            )}
          </div>

          <p className="text-xs text-app-muted">
            Click <strong>Browse…</strong> to choose a directory, then <strong>Apply &amp; Migrate</strong> to copy your existing data and reconnect.
            The default location is inside your system's app-data folder.
          </p>
        </div>
      </SectionCard>

      {/* About / Developer Info */}
      <SectionCard icon={<Info className="h-4 w-4" />} title="About Info">
        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-app-muted leading-relaxed">
            These values appear in the <strong>About page</strong> under "Developed By". Stored locally in SQLite.
          </p>
          <div>
            <label className="wl-label flex items-center gap-1.5"><User className="h-3 w-3" /> Developer Name</label>
            <input type="text" value={devName} onChange={(e) => setDevName(e.target.value)} placeholder="e.g. Siddhant Patni" className="wl-input" maxLength={100} />
          </div>
          <div>
            <label className="wl-label flex items-center gap-1.5"><Mail className="h-3 w-3" /> Developer Email (optional)</label>
            <input type="email" value={devEmail} onChange={(e) => setDevEmail(e.target.value)} placeholder="e.g. user@example.com" className="wl-input" maxLength={120} />
          </div>
          <div>
            <label className="wl-label flex items-center gap-1.5"><Github className="h-3 w-3" /> GitHub Handle (optional)</label>
            <input type="text" value={devGithub} onChange={(e) => setDevGithub(e.target.value)} placeholder="e.g. github.com/username" className="wl-input" maxLength={150} />
          </div>
        </div>
      </SectionCard>

      {/* Weekend work */}
      <SectionCard icon={<ToggleLeft className="h-4 w-4" />} title="Weekend Work">
        <Toggle
          checked={localSettings.workSaturday}
          onChange={(v) => setLocalSettings((s) => ({ ...s, workSaturday: v }))}
          label="Mark Saturdays as working days"
          description="Saturday will be treated as a regular weekday instead of weekend"
        />
        <Toggle
          checked={localSettings.workSunday}
          onChange={(v) => setLocalSettings((s) => ({ ...s, workSunday: v }))}
          label="Mark Sundays as working days"
          description="Sunday will be treated as a regular weekday instead of weekend"
        />
      </SectionCard>


    </div>
  );
}

