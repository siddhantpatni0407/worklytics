use chrono::{Datelike, NaiveDate};
use std::fmt::Write as FmtWrite;
use tauri::{Manager, State};

use crate::commands::work_commands::resolve_day_status;
use crate::database::DbState;
use crate::error::WorklyticsError;

// ---------------------------------------------------------------------------
// CSV generation helpers
// ---------------------------------------------------------------------------

fn build_csv_header() -> String {
    "Date,Day,Effective Status,Work Notes,Is Leave,Leave Type,Is Holiday,Holiday Name\n".to_string()
}

fn generate_csv_for_range(
    from: NaiveDate,
    to: NaiveDate,
    conn: &rusqlite::Connection,
) -> Result<String, WorklyticsError> {
    let mut csv = build_csv_header();
    let mut cur = from;
    while cur <= to {
        let date_str = cur.format("%Y-%m-%d").to_string();
        let ds = resolve_day_status(&date_str, conn)?;
        let day_name = cur.format("%A").to_string();
        let notes = ds
            .work_entry
            .as_ref()
            .map(|e| e.notes.replace('"', "\"\""))
            .unwrap_or_default();
        let leave_type = ds.leave_type.as_deref().unwrap_or("");
        let holiday_name = ds
            .holiday_name
            .as_deref()
            .unwrap_or("")
            .replace('"', "\"\"");

        writeln!(
            csv,
            "{},{},{},\"{}\",{},{},{},\"{}\"",
            date_str,
            day_name,
            ds.effective_status,
            notes,
            if ds.is_leave { "Yes" } else { "No" },
            leave_type,
            if ds.is_holiday { "Yes" } else { "No" },
            holiday_name
        )
        .map_err(|e| WorklyticsError::Serialization(e.to_string()))?;

        cur = cur.succ_opt().unwrap();
    }
    Ok(csv)
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/// Exports work status for the given year-month to a CSV file in the user's
/// Documents directory. Returns the full path to the created file.
#[tauri::command]
pub fn cmd_export_monthly_csv(
    year: i32,
    month: u32,
    app: tauri::AppHandle,
    db: State<DbState>,
) -> Result<String, WorklyticsError> {
    let first = NaiveDate::from_ymd_opt(year, month, 1)
        .ok_or_else(|| WorklyticsError::Validation(format!("Invalid {year}-{month}")))?;
    let last = if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1)
    }
    .and_then(|d| d.pred_opt())
    .ok_or_else(|| WorklyticsError::Validation("Bad month end".into()))?;

    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let csv = generate_csv_for_range(first, last, &conn)?;

    let export_dir = get_export_dir(&app)?;
    std::fs::create_dir_all(&export_dir)?;
    let file_name = format!("worklytics_{year}_{month:02}.csv");
    let path = export_dir.join(&file_name);
    std::fs::write(&path, csv)?;

    Ok(path.to_string_lossy().to_string())
}

/// Exports work status for the entire year to a CSV file.
#[tauri::command]
pub fn cmd_export_yearly_csv(
    year: i32,
    app: tauri::AppHandle,
    db: State<DbState>,
) -> Result<String, WorklyticsError> {
    let first =
        NaiveDate::from_ymd_opt(year, 1, 1).ok_or_else(|| WorklyticsError::Validation(format!("Invalid year {year}")))?;
    let last =
        NaiveDate::from_ymd_opt(year, 12, 31).ok_or_else(|| WorklyticsError::Validation(format!("Invalid year {year}")))?;

    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let csv = generate_csv_for_range(first, last, &conn)?;

    let export_dir = get_export_dir(&app)?;
    std::fs::create_dir_all(&export_dir)?;
    let file_name = format!("worklytics_{year}_full_year.csv");
    let path = export_dir.join(&file_name);
    std::fs::write(&path, csv)?;

    Ok(path.to_string_lossy().to_string())
}

// ---------------------------------------------------------------------------
// Path helper
// ---------------------------------------------------------------------------

fn get_export_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, WorklyticsError> {
    // Prefer Documents; fall back to app data dir.
    let base = app
        .path()
        .document_dir()
        .or_else(|_| app.path().app_data_dir())
        .map_err(WorklyticsError::from)?;
    Ok(base.join("Worklytics").join("Exports"))
}
