use chrono::{Datelike, NaiveDate, Weekday};
use rusqlite::OptionalExtension;
use tauri::State;

use crate::database::DbState;
use crate::error::WorklyticsError;
use crate::models::{DayStatus, SetWorkEntry, WorkEntry};

// ---------------------------------------------------------------------------
// Internal helper – computes the effective DayStatus for a single date string
// ---------------------------------------------------------------------------

pub(crate) fn resolve_day_status(
    date: &str,
    conn: &rusqlite::Connection,
) -> Result<DayStatus, WorklyticsError> {
    // 1. Parse date
    let naive_date = NaiveDate::parse_from_str(date, "%Y-%m-%d")
        .map_err(|e| WorklyticsError::Validation(format!("Invalid date '{}': {}", date, e)))?;

    // Read weekend-work settings to support configurable working weekends
    let work_saturday: bool = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = 'work_saturday'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .unwrap_or(None)
        .map(|v| v == "true")
        .unwrap_or(false);
    let work_sunday: bool = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = 'work_sunday'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .unwrap_or(None)
        .map(|v| v == "true")
        .unwrap_or(false);

    let is_saturday = matches!(naive_date.weekday(), Weekday::Sat);
    let is_sunday = matches!(naive_date.weekday(), Weekday::Sun);
    // A day is treated as weekend only if it's Saturday/Sunday AND NOT configured as working
    let is_weekend = (is_saturday && !work_saturday) || (is_sunday && !work_sunday);

    // 2. Check for an *approved* leave that covers this date
    let leave_row: Option<(String, String)> = conn
        .query_row(
            "SELECT leave_type, status FROM leaves
             WHERE ?1 BETWEEN start_date AND end_date AND status = 'APPROVED'
             LIMIT 1",
            [date],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()?;
    let is_leave = leave_row.is_some();
    let (leave_type, leave_status) = if let Some((lt, ls)) = leave_row {
        (Some(lt), Some(ls))
    } else {
        (None, None)
    };

    // 3. Check for a holiday (exact date OR recurring with same MM-DD)
    let mm_dd = &date[5..]; // "MM-DD" from "YYYY-MM-DD"
    let holiday_row: Option<String> = conn
        .query_row(
            "SELECT name FROM holidays
             WHERE date = ?1 OR (is_recurring = 1 AND SUBSTR(date, 6) = ?2)
             LIMIT 1",
            rusqlite::params![date, mm_dd],
            |row| row.get(0),
        )
        .optional()?;
    let is_holiday = holiday_row.is_some();
    let holiday_name = holiday_row;

    // 4. Check for a manual work entry
    let work_entry: Option<WorkEntry> = conn
        .query_row(
            "SELECT id, date, status, notes, created_at, updated_at
             FROM work_entries WHERE date = ?1",
            [date],
            |row| {
                Ok(WorkEntry {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    status: row.get(2)?,
                    notes: row.get::<_, Option<String>>(3)?.unwrap_or_default(),
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .optional()?;

    // 5. Apply priority: LEAVE > HOLIDAY > work entry > WEEKEND > UNSET
    let effective_status = if is_leave {
        "LEAVE".to_string()
    } else if is_holiday {
        "HOLIDAY".to_string()
    } else if let Some(ref we) = work_entry {
        we.status.clone()
    } else if is_weekend {
        "WEEKEND".to_string()
    } else {
        "UNSET".to_string()
    };

    Ok(DayStatus {
        date: date.to_string(),
        effective_status,
        work_entry,
        is_weekend,
        is_holiday,
        holiday_name,
        is_leave,
        leave_type,
        leave_status,
    })
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/// Returns the raw work entry for a date, or null if none.
#[tauri::command]
pub fn cmd_get_work_entry(
    date: String,
    db: State<DbState>,
) -> Result<Option<WorkEntry>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let entry: Option<WorkEntry> = conn
        .query_row(
            "SELECT id, date, status, notes, created_at, updated_at
             FROM work_entries WHERE date = ?1",
            [&date],
            |row| {
                Ok(WorkEntry {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    status: row.get(2)?,
                    notes: row.get::<_, Option<String>>(3)?.unwrap_or_default(),
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            },
        )
        .optional()?;
    Ok(entry)
}

/// Upserts a work entry (WFO / WFH / WFC) for a date.
#[tauri::command]
pub fn cmd_set_work_entry(
    entry: SetWorkEntry,
    db: State<DbState>,
) -> Result<DayStatus, WorklyticsError> {
    // Validate status value
    match entry.status.as_str() {
        "WFO" | "WFH" | "WFC" => {}
        other => {
            return Err(WorklyticsError::Validation(format!(
                "Invalid work status '{}'. Must be WFO, WFH, or WFC.",
                other
            )));
        }
    }

    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    conn.execute(
        "INSERT INTO work_entries (date, status, notes)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(date) DO UPDATE
         SET status = excluded.status, notes = excluded.notes, updated_at = datetime('now')",
        rusqlite::params![
            &entry.date,
            &entry.status,
            entry.notes.as_deref().unwrap_or(""),
        ],
    )?;

    resolve_day_status(&entry.date, &conn)
}

/// Removes the manual work entry for a date (day reverts to WEEKEND/UNSET).
#[tauri::command]
pub fn cmd_delete_work_entry(
    date: String,
    db: State<DbState>,
) -> Result<DayStatus, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    conn.execute("DELETE FROM work_entries WHERE date = ?1", [&date])?;
    resolve_day_status(&date, &conn)
}

/// Returns the computed DayStatus for a single date.
#[tauri::command]
pub fn cmd_get_effective_status(
    date: String,
    db: State<DbState>,
) -> Result<DayStatus, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    resolve_day_status(&date, &conn)
}

/// Returns computed DayStatus for every day in the given year-month.
#[tauri::command]
pub fn cmd_get_month_statuses(
    year: i32,
    month: u32,
    db: State<DbState>,
) -> Result<Vec<DayStatus>, WorklyticsError> {
    if !(1..=12).contains(&month) {
        return Err(WorklyticsError::Validation(format!(
            "Month {month} is out of range 1-12"
        )));
    }

    let first = NaiveDate::from_ymd_opt(year, month, 1).ok_or_else(|| {
        WorklyticsError::Validation(format!("Invalid year/month: {year}-{month}"))
    })?;
    // Last day: first day of next month minus one
    let last = if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1)
    }
    .and_then(|d| d.pred_opt())
    .ok_or_else(|| WorklyticsError::Validation("Failed to compute last day of month".into()))?;

    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;

    let mut statuses = Vec::with_capacity((last.day() - first.day() + 1) as usize);
    let mut current = first;
    while current <= last {
        let date_str = current.format("%Y-%m-%d").to_string();
        statuses.push(resolve_day_status(&date_str, &conn)?);
        current = current.succ_opt().unwrap();
    }

    Ok(statuses)
}
