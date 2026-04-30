// ─────────────────────────────────────────────────────────────────────────────
// Worklytics – Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type WorkStatus = "WFO" | "WFH" | "WFC";
export type EffectiveStatus = "WFO" | "WFH" | "WFC" | "LEAVE" | "HOLIDAY" | "WEEKEND" | "UNSET";
export type LeaveType = "CASUAL" | "SICK" | "EARNED" | "MATERNITY" | "PATERNITY" | "UNPAID" | "COMP_OFF" | "OTHER";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

// ---------------------------------------------------------------------------
// Domain models (mirror Rust structs)
// ---------------------------------------------------------------------------

export interface WorkEntry {
  id: number;
  date: string;          // "YYYY-MM-DD"
  status: WorkStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayStatus {
  date: string;
  effectiveStatus: EffectiveStatus;
  workEntry: WorkEntry | null;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  isLeave: boolean;
  leaveType: string | null;
  leaveStatus: string | null;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;          // "YYYY-MM-DD"
  description: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Leave {
  id: number;
  startDate: string;     // "YYYY-MM-DD"
  endDate: string;       // "YYYY-MM-DD"
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Analytics DTOs
// ---------------------------------------------------------------------------

export interface MonthlyAnalytics {
  year: number;
  month: number;
  monthName: string;
  totalDays: number;
  workingDays: number;
  wfoCount: number;
  wfhCount: number;
  wfcCount: number;
  leaveCount: number;
  holidayCount: number;
  weekendCount: number;
  unsetCount: number;
  wfoPct: number;
  wfhPct: number;
  wfcPct: number;
  leavePct: number;
}

export interface YearlyAnalytics {
  year: number;
  months: MonthlyAnalytics[];
  totalWfo: number;
  totalWfh: number;
  totalWfc: number;
  totalLeave: number;
  totalHoliday: number;
  totalWeekend: number;
  totalWorkingDays: number;
}

export interface SummaryStats {
  year: number;
  totalWfo: number;
  totalWfh: number;
  totalWfc: number;
  totalLeave: number;
  totalHoliday: number;
  totalWorkingDays: number;
  daysLogged: number;
  unloggedWorkingDays: number;
  remoteWorkPct: number;
  officeWorkPct: number;
}

// ---------------------------------------------------------------------------
// Form payloads
// ---------------------------------------------------------------------------

export interface CreateHolidayPayload {
  name: string;
  date: string;
  description?: string;
  isRecurring?: boolean;
}

export interface UpdateHolidayPayload extends CreateHolidayPayload {
  id: number;
}

export interface CreateLeavePayload {
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason?: string;
  status?: LeaveStatus;
}

export interface UpdateLeavePayload extends CreateLeavePayload {
  id: number;
}

export interface SetWorkEntryPayload {
  date: string;
  status: WorkStatus;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export interface Task {
  id: number;
  date: string;          // "YYYY-MM-DD"
  title: string;
  details: string;
  notes: string;
  status: string;
  tags: string;          // comma-separated
  timeSpent: number;     // hours
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  date: string;
  title: string;
  details?: string;
  notes?: string;
  status?: string;
  tags?: string;
  timeSpent?: number;
}

export interface UpdateTaskPayload {
  id: number;
  date?: string;
  title?: string;
  details?: string;
  notes?: string;
  status?: string;
  tags?: string;
  timeSpent?: number;
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarInitials: string; // derived, not stored
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  role: "",
  avatarInitials: "",
};

// ---------------------------------------------------------------------------
// App Settings
// ---------------------------------------------------------------------------

export type ThemeMode = "light" | "dark" | "system";
export type ThemeAccentColor = "indigo" | "blue" | "violet" | "emerald" | "rose" | "amber";
export type TaskViewMode = "list" | "kanban";

export interface AppSettings {
  theme: ThemeMode;
  accentColor: ThemeAccentColor;
  timezone: string;
  yearStart: number;
  yearEnd: number;
  workSaturday: boolean;
  workSunday: boolean;
  // Task metadata configuration
  sprints: string[];
  projects: string[];
  teams: string[];
  customStatuses: string[];
  // Developer / About info (stored in DB, configurable)
  developerName: string;
  developerEmail: string;
  developerGithub: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  accentColor: "indigo",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
  yearStart: 2020,
  yearEnd: 2050,
  workSaturday: false,
  workSunday: false,
  sprints: [],
  projects: [],
  teams: [],
  customStatuses: [],
  developerName: "Siddhant Patni",
  developerEmail: "",
  developerGithub: "",
};

// ---------------------------------------------------------------------------
// Task metadata helpers (stored as prefixed tags)
// ---------------------------------------------------------------------------

export function parseTaskMeta(tags: string): {
  sprint: string; project: string; team: string; regularTags: string[];
} {
  const parts = tags ? tags.split(",").map((s) => s.trim()).filter(Boolean) : [];
  let sprint = ""; let project = ""; let team = "";
  const regularTags: string[] = [];
  parts.forEach((p) => {
    if (p.startsWith("sprint:"))  sprint  = p.slice(7).trim();
    else if (p.startsWith("project:")) project = p.slice(8).trim();
    else if (p.startsWith("team:"))   team    = p.slice(5).trim();
    else regularTags.push(p);
  });
  return { sprint, project, team, regularTags };
}

export function buildTaskTags(
  sprint: string, project: string, team: string, regularTags: string
): string {
  const parts: string[] = [];
  if (sprint.trim())  parts.push(`sprint:${sprint.trim()}`);
  if (project.trim()) parts.push(`project:${project.trim()}`);
  if (team.trim())    parts.push(`team:${team.trim()}`);
  if (regularTags.trim()) {
    regularTags.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => parts.push(t));
  }
  return parts.join(",");
}

// ---------------------------------------------------------------------------
// Sticky Notes
// ---------------------------------------------------------------------------

export type NoteColor = "yellow" | "blue" | "green" | "pink" | "purple";

export interface StickyNote {
  id: number;
  title: string;
  content: string;
  color: NoteColor;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  title?: string;
  content: string;
  color?: NoteColor;
}

export interface UpdateNotePayload {
  id: number;
  title?: string;
  content?: string;
  color?: NoteColor;
  pinned?: boolean;
}

// ---------------------------------------------------------------------------
// Database Configuration
// ---------------------------------------------------------------------------

export interface DbPathInfo {
  currentPath: string;
  defaultPath: string;
  isCustom: boolean;
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

export const STATUS_META: Record<EffectiveStatus, { label: string; color: string; bg: string; border: string; text: string }> = {
  WFO:     { label: "Work From Office", color: "#3b82f6", bg: "bg-blue-100",   border: "border-blue-400",   text: "text-blue-700"  },
  WFH:     { label: "Work From Home",   color: "#10b981", bg: "bg-emerald-100",border: "border-emerald-400",text: "text-emerald-700"},
  WFC:     { label: "Work From Client", color: "#8b5cf6", bg: "bg-violet-100", border: "border-violet-400", text: "text-violet-700" },
  LEAVE:   { label: "Leave",            color: "#f59e0b", bg: "bg-amber-100",  border: "border-amber-400",  text: "text-amber-700" },
  HOLIDAY: { label: "Holiday",          color: "#ef4444", bg: "bg-red-100",    border: "border-red-400",    text: "text-red-700"   },
  WEEKEND: { label: "Weekend",          color: "#94a3b8", bg: "bg-slate-100",  border: "border-slate-300",  text: "text-slate-500" },
  UNSET:   { label: "Not Marked",       color: "#e2e8f0", bg: "bg-gray-50",    border: "border-gray-200",   text: "text-gray-400"  },
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  CASUAL:    "Casual Leave",
  SICK:      "Sick Leave",
  EARNED:    "Earned Leave",
  MATERNITY: "Maternity Leave",
  PATERNITY: "Paternity Leave",
  UNPAID:    "Unpaid Leave",
  COMP_OFF:  "Compensatory Off",
  OTHER:     "Other",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING:  "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
