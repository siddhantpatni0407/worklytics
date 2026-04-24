import { invoke } from "@tauri-apps/api/core";
import type {
  CreateHolidayPayload,
  CreateLeavePayload,
  CreateNotePayload,
  CreateTaskPayload,
  DayStatus,
  Holiday,
  Leave,
  MonthlyAnalytics,
  SetWorkEntryPayload,
  StickyNote,
  SummaryStats,
  Task,
  UpdateHolidayPayload,
  UpdateLeavePayload,
  UpdateNotePayload,
  UpdateTaskPayload,
  WorkEntry,
  YearlyAnalytics,
} from "@/types";

// ─── Holidays ────────────────────────────────────────────────────────────────
export const getHolidays = () => invoke<Holiday[]>("cmd_get_holidays");
export const getHolidaysByYear = (year: number) =>
  invoke<Holiday[]>("cmd_get_holidays_by_year", { year });
export const addHoliday = (holiday: CreateHolidayPayload) =>
  invoke<Holiday>("cmd_add_holiday", { holiday });
export const updateHoliday = (holiday: UpdateHolidayPayload) =>
  invoke<Holiday>("cmd_update_holiday", { holiday });
export const deleteHoliday = (id: number) =>
  invoke<boolean>("cmd_delete_holiday", { id });

// ─── Leaves ──────────────────────────────────────────────────────────────────
export const getLeaves = () => invoke<Leave[]>("cmd_get_leaves");
export const getLeavesByYear = (year: number) =>
  invoke<Leave[]>("cmd_get_leaves_by_year", { year });
export const addLeave = (leave: CreateLeavePayload) =>
  invoke<Leave>("cmd_add_leave", { leave });
export const updateLeave = (leave: UpdateLeavePayload) =>
  invoke<Leave>("cmd_update_leave", { leave });
export const deleteLeave = (id: number) =>
  invoke<boolean>("cmd_delete_leave", { id });

// ─── Work Entries ─────────────────────────────────────────────────────────────
export const getWorkEntry = (date: string) =>
  invoke<WorkEntry | null>("cmd_get_work_entry", { date });
export const setWorkEntry = (entry: SetWorkEntryPayload) =>
  invoke<DayStatus>("cmd_set_work_entry", { entry });
export const deleteWorkEntry = (date: string) =>
  invoke<DayStatus>("cmd_delete_work_entry", { date });
export const getEffectiveStatus = (date: string) =>
  invoke<DayStatus>("cmd_get_effective_status", { date });
export const getMonthStatuses = (year: number, month: number) =>
  invoke<DayStatus[]>("cmd_get_month_statuses", { year, month });

// ─── Analytics ───────────────────────────────────────────────────────────────
export const getMonthlyAnalytics = (year: number, month: number) =>
  invoke<MonthlyAnalytics>("cmd_get_monthly_analytics", { year, month });
export const getYearlyAnalytics = (year: number) =>
  invoke<YearlyAnalytics>("cmd_get_yearly_analytics", { year });
export const getSummaryStats = (year: number) =>
  invoke<SummaryStats>("cmd_get_summary_stats", { year });

// ─── Exports ──────────────────────────────────────────────────────────────────
export const exportMonthlyCsv = (year: number, month: number) =>
  invoke<string>("cmd_export_monthly_csv", { year, month });
export const exportYearlyCsv = (year: number) =>
  invoke<string>("cmd_export_yearly_csv", { year });

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const getTasksByDate = (date: string) =>
  invoke<Task[]>("cmd_get_tasks_by_date", { date });
export const getTasksByRange = (from: string, to: string) =>
  invoke<Task[]>("cmd_get_tasks_by_range", { from, to });
export const getAllTasks = () =>
  invoke<Task[]>("cmd_get_all_tasks");
export const addTask = (task: CreateTaskPayload) =>
  invoke<Task>("cmd_add_task", { task });
export const updateTask = (task: UpdateTaskPayload) =>
  invoke<Task>("cmd_update_task", { task });
export const deleteTask = (id: number) =>
  invoke<boolean>("cmd_delete_task", { id });
export const getTaskCountsForMonth = (year: number, month: number) =>
  invoke<[string, number][]>("cmd_get_task_counts_for_month", { year, month });

// ─── Excel (raw bytes writer) ─────────────────────────────────────────────────
export const writeExcelFile = (filename: string, bytes: number[]) =>
  invoke<string>("cmd_write_excel_file", { filename, bytes });

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSetting = (key: string) =>
  invoke<string | null>("cmd_get_setting", { key });
export const getAllSettings = () =>
  invoke<[string, string][]>("cmd_get_all_settings");
export const setSetting = (key: string, value: string) =>
  invoke<void>("cmd_set_setting", { key, value });
export const setSettingsBatch = (settings: [string, string][]) =>
  invoke<void>("cmd_set_settings_batch", { settings });

// ─── Database Configuration ───────────────────────────────────────────────────
export const getDbPath = () => invoke<string>("cmd_get_db_path");
export const getDefaultDbPath = () => invoke<string>("cmd_get_default_db_path");
export const isCustomDbPath = () => invoke<boolean>("cmd_is_custom_db_path");
export const selectDbDirectory = () =>
  invoke<string | null>("cmd_select_db_directory");
export const migrateDb = (newPath: string) =>
  invoke<string>("cmd_migrate_db", { newPath });
export const resetDbPath = () => invoke<string>("cmd_reset_db_path");

// ─── Sticky Notes ─────────────────────────────────────────────────────────────
export const getAllNotes = () => invoke<StickyNote[]>("cmd_get_all_notes");
export const searchNotes = (query: string) =>
  invoke<StickyNote[]>("cmd_search_notes", { query });
export const getNotesByColor = (color: string) =>
  invoke<StickyNote[]>("cmd_get_notes_by_color", { color });
export const addNote = (note: CreateNotePayload) =>
  invoke<StickyNote>("cmd_add_note", { note });
export const updateNote = (note: UpdateNotePayload) =>
  invoke<StickyNote>("cmd_update_note", { note });
export const deleteNote = (id: number) =>
  invoke<boolean>("cmd_delete_note", { id });
export const pinNote = (id: number, pinned: boolean) =>
  invoke<StickyNote>("cmd_pin_note", { id, pinned });

