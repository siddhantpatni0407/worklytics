import { invoke } from "@tauri-apps/api/core";
import type {
  CreateHolidayPayload,
  CreateLeavePayload,
  DayStatus,
  Holiday,
  Leave,
  MonthlyAnalytics,
  SetWorkEntryPayload,
  SummaryStats,
  UpdateHolidayPayload,
  UpdateLeavePayload,
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
