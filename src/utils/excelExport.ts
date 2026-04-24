/**
 * Excel export utilities using SheetJS (xlsx).
 * All processing runs client-side; the file is saved via Tauri shell.
 */
import * as XLSX from "xlsx";
import { invoke } from "@tauri-apps/api/core";
import type { DayStatus, Task } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDayName(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });
}

function applyHeaderStyle(ws: XLSX.WorkSheet, range: string) {
  // SheetJS community edition doesn't support rich styling, but we set column widths.
  // Proper styling (bold, fill) requires xlsx-style or xlsx-js-style packages.
  // Here we set col widths only.
  if (!ws["!cols"]) return;
}

// ─── Work-status export ───────────────────────────────────────────────────────

export interface WorkExportRow {
  Date: string;
  Day: string;
  "Effective Status": string;
  "Work Notes": string;
  "Is Leave": string;
  "Leave Type": string;
  "Is Holiday": string;
  "Holiday Name": string;
}

export function buildWorkSheet(statuses: DayStatus[]): XLSX.WorkSheet {
  const rows: WorkExportRow[] = statuses.map((ds) => ({
    Date:              ds.date,
    Day:               formatDayName(ds.date),
    "Effective Status": ds.effectiveStatus,
    "Work Notes":      ds.workEntry?.notes ?? "",
    "Is Leave":        ds.isLeave ? "Yes" : "No",
    "Leave Type":      ds.leaveType ?? "",
    "Is Holiday":      ds.isHoliday ? "Yes" : "No",
    "Holiday Name":    ds.holidayName ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws["!cols"] = [
    { wch: 12 }, // Date
    { wch: 12 }, // Day
    { wch: 18 }, // Effective Status
    { wch: 30 }, // Work Notes
    { wch: 10 }, // Is Leave
    { wch: 14 }, // Leave Type
    { wch: 12 }, // Is Holiday
    { wch: 20 }, // Holiday Name
  ];

  return ws;
}

// ─── Task export ──────────────────────────────────────────────────────────────

interface TaskExportRow {
  Date: string;
  Day: string;
  Title: string;
  Status: string;
  Details: string;
  Notes: string;
  Tags: string;
  "Time Spent (h)": number;
}

export function buildTaskSheet(tasks: Task[]): XLSX.WorkSheet {
  const rows: TaskExportRow[] = tasks.map((t) => ({
    Date:             t.date,
    Day:              formatDayName(t.date),
    Title:            t.title,
    Status:           t.status.replace(/_/g, " "),
    Details:          t.details,
    Notes:            t.notes,
    Tags:             t.tags,
    "Time Spent (h)": t.timeSpent,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 12 }, // Date
    { wch: 12 }, // Day
    { wch: 35 }, // Title
    { wch: 14 }, // Status
    { wch: 40 }, // Details
    { wch: 30 }, // Notes
    { wch: 20 }, // Tags
    { wch: 16 }, // Time Spent
  ];
  return ws;
}

// ─── Write to file via Tauri ──────────────────────────────────────────────────

export async function saveWorkbook(wb: XLSX.WorkBook, filename: string): Promise<string> {
  const buf: ArrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const bytes = Array.from(new Uint8Array(buf));
  const path = await invoke<string>("cmd_write_excel_file", { filename, bytes });
  return path;
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export function createMonthlyWorkbook(statuses: DayStatus[], tasks: Task[], year: number, month: number): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildWorkSheet(statuses), "Work Status");
  if (tasks.length > 0) {
    XLSX.utils.book_append_sheet(wb, buildTaskSheet(tasks), "Tasks");
  }
  wb.Props = {
    Title:   `Worklytics ${year}-${String(month).padStart(2, "0")}`,
    Subject: "Monthly Work Report",
    Author:  "Worklytics",
  };
  return wb;
}

export function createYearlyWorkbook(statuses: DayStatus[], tasks: Task[], year: number): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildWorkSheet(statuses), "Work Status");
  if (tasks.length > 0) {
    XLSX.utils.book_append_sheet(wb, buildTaskSheet(tasks), "Tasks");
  }
  wb.Props = {
    Title:   `Worklytics ${year}`,
    Subject: "Yearly Work Report",
    Author:  "Worklytics",
  };
  return wb;
}
