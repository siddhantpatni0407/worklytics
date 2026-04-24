import { useState, useEffect } from "react";
import {
  Info, Monitor, Activity, Code2, Sun, Moon, Globe, Calendar,
  ToggleLeft, ToggleRight, Save, RefreshCw, Database, FolderOpen,
  RotateCcw, CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/appStore";
import {
  setSettingsBatch, getDbPath, getDefaultDbPath, isCustomDbPath,
  selectDbDirectory, migrateDb, resetDbPath,
} from "@/utils/tauriCommands";
import type { ThemeMode, DbPathInfo } from "@/types";
import { cn } from "@/utils/cn";

const INFO_ROWS = [
  { label: "Application",   value: "Worklytics v2.0.0"             },
  { label: "Frontend",      value: "React 18 + TypeScript + Vite"  },
  { label: "Backend",       value: "Rust + Tauri 2"                },
  { label: "Database",      value: "SQLite (bundled via rusqlite)"  },
  { label: "Storage",       value: "Local — 100% offline"          },
];

const STATUS_RULES = [
  { priority: 1, status: "Leave",      color: "bg-amber-500",  desc: "Overrides everything. Approved leave on any day." },
  { priority: 2, status: "Holiday",    color: "bg-red-500",    desc: "Overrides work status but not Leave."             },
  { priority: 3, status: "WFO/WFH/WFC", color: "bg-blue-500", desc: "Manual work status. Overrides Weekend/Unset."    },
  { priority: 4, status: "Weekend",    color: "bg-slate-400",  desc: "Auto-detected Saturday & Sunday (if not overridden)." },
  { priority: 5, status: "Unset",      color: "bg-gray-300",   desc: "Weekday with no status set."                    },
];

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

  // Database path state
  const [dbInfo, setDbInfo] = useState<DbPathInfo | null>(null);
  const [pendingDbPath, setPendingDbPath] = useState<string | null>(null);
  const [dbMigrating, setDbMigrating] = useState(false);

  const loadDbInfo = async () => {
    try {
      const [currentPath, defaultPath, isCustom] = await Promise.all([
        getDbPath(),
        getDefaultDbPath(),
        isCustomDbPath(),
      ]);
      setDbInfo({ currentPath, defaultPath, isCustom });
    } catch {
      // Non-critical; silently ignore
    }
  };

  useEffect(() => { loadDbInfo(); }, []);

  // Sync local copy when settings change externally
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
        ["theme",          localSettings.theme],
        ["timezone",       localSettings.timezone],
        ["year_start",     String(localSettings.yearStart)],
        ["year_end",       String(localSettings.yearEnd)],
        ["work_saturday",  String(localSettings.workSaturday)],
        ["work_sunday",    String(localSettings.workSunday)],
      ]);
      // Apply to store (triggers re-renders)
      updateSettings(localSettings);
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
          <h2 className="page-title">Settings & About</h2>
          <p className="page-subtitle">Configure application behaviour and view system info</p>
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
        <div className="px-5 py-4">
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

      {/* Priority rules */}
      <SectionCard icon={<Activity className="h-4 w-4" />} title="Status Priority Rules">
        <div className="divide-y divide-[var(--border-card)]">
          {STATUS_RULES.map((r) => (
            <div key={r.priority} className="flex items-center gap-4 px-5 py-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-app-muted">
                {r.priority}
              </span>
              <div className="flex items-center gap-2 min-w-[120px]">
                <span className={`h-3 w-3 rounded-sm ${r.color}`} />
                <span className="text-sm font-medium text-app-primary">{r.status}</span>
              </div>
              <span className="text-sm text-app-secondary">{r.desc}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* About */}
      <SectionCard icon={<Info className="h-4 w-4" />} title="About Worklytics">
        <div className="divide-y divide-[var(--border-card)]">
          {INFO_ROWS.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-app-muted">{label}</span>
              <span className="text-sm font-medium text-app-primary">{value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Tech stack */}
      <SectionCard icon={<Code2 className="h-4 w-4" />} title="Technology Stack">
        <div className="px-5 py-4 grid grid-cols-2 gap-3">
          {[
            { name: "React 18",     desc: "Frontend UI"            },
            { name: "TypeScript",   desc: "Type-safe JavaScript"   },
            { name: "Tauri 2",      desc: "Desktop runtime"        },
            { name: "Rust",         desc: "Backend & commands"     },
            { name: "SQLite",       desc: "Local database"         },
            { name: "Tailwind CSS", desc: "Utility-first styling"  },
            { name: "Recharts",     desc: "Analytics charts"       },
            { name: "Zustand",      desc: "State management"       },
          ].map(({ name, desc }) => (
            <div key={name} className="flex items-center gap-3 rounded-lg border border-[var(--border-card)] px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-brand-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-app-primary">{name}</p>
                <p className="text-[11px] text-app-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

