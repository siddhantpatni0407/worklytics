import { useState } from "react";
import {
  Activity, Code2, Database, Globe, Info, Layers, Monitor,
  Package, Shield, Zap, CheckCircle2,
  GitBranch, Cpu, FileCode2, User, Mail, Github,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAppStore } from "@/store/appStore";

// ─── Data ────────────────────────────────────────────────────────────────────

const APP_INFO = [
  { label: "Application",  value: "Worklytics",              icon: <Activity className="h-4 w-4 text-brand-500" /> },
  { label: "Version",      value: "v2.0.0",                  icon: <Package className="h-4 w-4 text-emerald-500" /> },
  { label: "Architecture", value: "Offline-first desktop",   icon: <Cpu className="h-4 w-4 text-blue-500" /> },
  { label: "Storage",      value: "Local SQLite — no cloud", icon: <Database className="h-4 w-4 text-violet-500" /> },
  { label: "Platform",     value: "Windows / macOS / Linux", icon: <Monitor className="h-4 w-4 text-amber-500" /> },
  { label: "License",      value: "Private use",             icon: <Shield className="h-4 w-4 text-rose-500" /> },
];

const TECH_STACK = [
  {
    category: "Frontend",
    color: "bg-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40",
    icon: <FileCode2 className="h-4 w-4" />,
    items: [
      { name: "React 18",       desc: "Component-based UI library" },
      { name: "TypeScript",     desc: "Typed JavaScript superset" },
      { name: "Vite",           desc: "Fast build tool & dev server" },
      { name: "React Router v6", desc: "Client-side routing" },
      { name: "Zustand",        desc: "Lightweight state management" },
      { name: "Tailwind CSS",   desc: "Utility-first styling framework" },
      { name: "Recharts",       desc: "Declarative charting library" },
      { name: "date-fns",       desc: "Date utility functions" },
      { name: "lucide-react",   desc: "Consistent icon library" },
      { name: "react-hot-toast", desc: "Non-blocking notifications" },
    ],
  },
  {
    category: "Backend / Runtime",
    color: "bg-orange-500",
    textColor: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/40",
    icon: <Cpu className="h-4 w-4" />,
    items: [
      { name: "Tauri 2",        desc: "Cross-platform desktop runtime" },
      { name: "Rust",           desc: "Systems language — backend logic" },
      { name: "rusqlite",       desc: "SQLite bindings for Rust" },
      { name: "serde / serde_json", desc: "Serialization framework" },
    ],
  },
  {
    category: "Database",
    color: "bg-emerald-500",
    textColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40",
    icon: <Database className="h-4 w-4" />,
    items: [
      { name: "SQLite",         desc: "Embedded relational database" },
      { name: "Key-value store", desc: "app_settings table for config" },
      { name: "Migrations",     desc: "Idempotent schema initializer" },
    ],
  },
];

const STATUS_RULES = [
  {
    priority: 1,
    status: "Leave",
    color: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    desc: "Highest priority — overrides all other statuses on that day. Even if it falls on a holiday or weekend.",
  },
  {
    priority: 2,
    status: "Holiday",
    color: "bg-red-500",
    textColor: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    desc: "Overrides WFO/WFH/WFC and Weekend, but is overridden by Leave.",
  },
  {
    priority: 3,
    status: "WFO / WFH / WFC",
    color: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    desc: "Manually set work status. Overrides Weekend and Unset. WFO = office, WFH = home, WFC = client site.",
  },
  {
    priority: 4,
    status: "Weekend",
    color: "bg-slate-400",
    textColor: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700",
    desc: "Auto-detected Saturday & Sunday. Can be overridden if configured as working days in Settings.",
  },
  {
    priority: 5,
    status: "Unset",
    color: "bg-gray-300",
    textColor: "text-slate-500 dark:text-slate-500",
    bgColor: "bg-slate-50/60 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800",
    desc: "Weekday with no work status set. Counts as an unlogged working day in analytics.",
  },
];

const FEATURES = [
  { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Work Calendar", desc: "Daily WFO/WFH/WFC status tracking per calendar day" },
  { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Analytics", desc: "Monthly & yearly breakdowns with charts and CSV/Excel export" },
  { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Tasks", desc: "Daily task tracking with Kanban board, sprint & project metadata" },
  { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Sticky Notes", desc: "Color-coded pinnable notes with bullet & numbered list support" },
  { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Holidays", desc: "Custom & recurring holiday management" },
  { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Leaves", desc: "Leave records with type, status, and date-range support" },
  { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Theme Engine", desc: "Dark/light/system theme with 6 accent color presets" },
  { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Offline-first", desc: "All data stored locally in SQLite — no internet required" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  icon, title, accent = "brand", children,
}: {
  icon: React.ReactNode;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="wl-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border-card)] bg-slate-50 dark:bg-slate-800/40">
        <span className="text-brand-500">{icon}</span>
        <h3 className="text-sm font-semibold text-app-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const [expandedTech, setExpandedTech] = useState<string | null>("Frontend");
  const { settings } = useAppStore();

  const developerName   = settings.developerName   || "Siddhant Patni";
  const developerEmail  = settings.developerEmail  || "";
  const developerGithub = settings.developerGithub || "";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Hero banner ───────────────────────────────────────────────── */}
      <div className="wl-card overflow-hidden">
        <div className="px-6 py-8 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-transparent border-b border-[var(--border-card)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-app-primary tracking-tight">Worklytics</h2>
              <p className="text-sm text-app-muted">Offline-first work productivity tracker — v2.0.0</p>
            </div>
          </div>
          <p className="text-sm text-app-secondary leading-relaxed max-w-xl">
            A lightweight, privacy-first desktop application built to track your daily work locations,
            manage tasks and sticky notes, monitor leaves and holidays, and generate rich analytics —
            all stored locally with no cloud dependency.
          </p>
        </div>

        {/* App info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-[var(--border-card)]">
          {APP_INFO.map(({ label, value, icon }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <span className="flex-shrink-0">{icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-app-muted">{label}</p>
                <p className="text-xs font-semibold text-app-primary truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <Section icon={<Zap className="h-4 w-4" />} title="Features">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-[var(--border-card)]">
          {FEATURES.map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 px-5 py-3 [&:nth-child(odd)]:border-r border-[var(--border-card)]">
              <span className="mt-0.5 flex-shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-app-primary">{label}</p>
                <p className="text-xs text-app-muted mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Status Priority Rules ──────────────────────────────────────── */}
      <Section icon={<Layers className="h-4 w-4" />} title="Status Priority Rules">
        <div className="px-5 py-4">
          <p className="text-xs text-app-muted mb-4 leading-relaxed">
            When multiple statuses apply to a day, the one with the <strong>lowest priority number</strong> wins.
            For example, if you have an approved leave on a holiday, Leave takes precedence.
          </p>
          <div className="space-y-2">
            {STATUS_RULES.map((r) => (
              <div
                key={r.priority}
                className={cn(
                  "flex items-start gap-4 rounded-xl border p-3.5 transition-shadow hover:shadow-sm",
                  r.bgColor
                )}
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-[var(--border-card)] shadow-sm">
                  <span className="text-xs font-extrabold text-app-muted">{r.priority}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", r.color)} />
                    <span className={cn("text-sm font-bold", r.textColor)}>{r.status}</span>
                  </div>
                  <p className="text-xs text-app-secondary leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Developed By ──────────────────────────────────────────────── */}
      <Section icon={<User className="h-4 w-4" />} title="Developed By">
        <div className="px-5 py-5 flex items-center gap-5">
          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/25 flex-shrink-0">
            <span className="text-xl font-extrabold text-white tracking-tight select-none">
              {developerName.trim().split(/\s+/).map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-app-primary">{developerName}</p>
            <p className="text-xs text-brand-500 font-medium mt-0.5">Software Developer</p>
            <div className="flex flex-wrap gap-3 mt-2">
              {developerEmail && (
                <span className="inline-flex items-center gap-1.5 text-xs text-app-muted">
                  <Mail className="h-3 w-3" />{developerEmail}
                </span>
              )}
              {developerGithub && (
                <span className="inline-flex items-center gap-1.5 text-xs text-app-muted">
                  <Github className="h-3 w-3" />{developerGithub}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="px-5 pb-4">
          <p className="text-xs text-app-muted leading-relaxed">
            The developer name, email, and GitHub handle shown above are configurable in{" "}
            <span className="text-brand-500 font-medium">Settings › About Info</span>. All data
            is stored locally in your SQLite database.
          </p>
        </div>
      </Section>

      {/* ── Technology Stack ──────────────────────────────────────────── */}
      <Section icon={<Code2 className="h-4 w-4" />} title="Technology Stack">
        <div className="px-5 py-4 space-y-3">
          {TECH_STACK.map(({ category, color, textColor, bgColor, icon, items }) => {
            const isOpen = expandedTech === category;
            return (
              <div key={category} className={cn("rounded-xl border overflow-hidden", bgColor)}>
                <button
                  onClick={() => setExpandedTech(isOpen ? null : category)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn("flex items-center justify-center h-6 w-6 rounded-lg text-white", color)}>
                      {icon}
                    </span>
                    <span className={cn("text-sm font-semibold", textColor)}>{category}</span>
                    <span className="text-xs text-app-muted">({items.length} packages)</span>
                  </div>
                  <span className={cn("text-xs font-medium transition-transform", textColor, isOpen ? "rotate-90" : "")}>
                    ▶
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-[var(--border-card)]  pt-3">
                    {items.map(({ name, desc }) => (
                      <div key={name} className="flex items-start gap-2.5 p-2 rounded-lg bg-white/60 dark:bg-black/20">
                        <div className={cn("mt-1 h-2 w-2 rounded-full flex-shrink-0", color)} />
                        <div>
                          <p className="text-xs font-semibold text-app-primary">{name}</p>
                          <p className="text-[11px] text-app-muted">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Architecture note ──────────────────────────────────────────── */}
      <Section icon={<GitBranch className="h-4 w-4" />} title="Architecture">
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                layer: "UI Layer",
                color: "border-t-blue-500",
                badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                desc: "React components communicate with the backend via Tauri's type-safe IPC commands (invoke). State managed in Zustand with localStorage persistence.",
              },
              {
                layer: "IPC Bridge",
                color: "border-t-violet-500",
                badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
                desc: "Tauri 2 exposes Rust functions as async JS commands. All data flows through strongly-typed command handlers with structured error responses.",
              },
              {
                layer: "Data Layer",
                color: "border-t-emerald-500",
                badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                desc: "SQLite via rusqlite. Idempotent schema migrations run on startup. Key-value settings table stores user preferences. Zero external network calls.",
              },
            ].map(({ layer, color, badge, desc }) => (
              <div key={layer} className={cn("wl-card border-t-4 p-4", color)}>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", badge)}>
                  {layer}
                </span>
                <p className="text-xs text-app-secondary mt-2.5 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-app-muted">
          Worklytics v2.0.0 · Developed by {developerName} · Built with Tauri 2 + React + Rust · Offline-first · No telemetry
        </p>
      </div>
    </div>
  );
}
