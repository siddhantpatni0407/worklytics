use rusqlite::OptionalExtension;
use tauri::State;

use crate::database::DbState;
use crate::error::WorklyticsError;
use crate::models::{CreateHoliday, Holiday, UpdateHoliday};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn row_to_holiday(row: &rusqlite::Row<'_>) -> rusqlite::Result<Holiday> {
    Ok(Holiday {
        id: row.get(0)?,
        name: row.get(1)?,
        date: row.get(2)?,
        description: row.get::<_, Option<String>>(3)?.unwrap_or_default(),
        is_recurring: row.get::<_, i32>(4)? != 0,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

const SELECT_FIELDS: &str =
    "id, name, date, description, is_recurring, created_at, updated_at FROM holidays";

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/// Returns every holiday ordered by date.
#[tauri::command]
pub fn cmd_get_holidays(db: State<DbState>) -> Result<Vec<Holiday>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut stmt = conn.prepare(&format!("SELECT {SELECT_FIELDS} ORDER BY date ASC"))?;
    let holidays = stmt
        .query_map([], row_to_holiday)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(WorklyticsError::from)?;
    Ok(holidays)
}

/// Returns holidays visible in a given year (exact-date + recurring ones expanded to that year).
#[tauri::command]
pub fn cmd_get_holidays_by_year(
    year: i32,
    db: State<DbState>,
) -> Result<Vec<Holiday>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let year_prefix = format!("{year}-%");
    let mut stmt = conn.prepare(&format!(
        "SELECT {SELECT_FIELDS} WHERE date LIKE ?1 OR is_recurring = 1 ORDER BY date ASC"
    ))?;
    let all: Vec<Holiday> = stmt
        .query_map([&year_prefix], row_to_holiday)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(WorklyticsError::from)?;

    // Expand recurring holidays: replace stored year with requested year.
    let year_str = year.to_string();
    let holidays: Vec<Holiday> = all
        .into_iter()
        .filter_map(|mut h| {
            if h.date.starts_with(&year_str) {
                Some(h)
            } else if h.is_recurring {
                // "YYYY-MM-DD" → replace year portion
                let mm_dd = h.date.get(5..).unwrap_or("").to_string();
                if mm_dd.len() == 5 {
                    h.date = format!("{year_str}-{mm_dd}");
                    Some(h)
                } else {
                    None
                }
            } else {
                None
            }
        })
        .collect();

    Ok(holidays)
}

/// Inserts a new holiday and returns it.
#[tauri::command]
pub fn cmd_add_holiday(
    holiday: CreateHoliday,
    db: State<DbState>,
) -> Result<Holiday, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    conn.execute(
        "INSERT INTO holidays (name, date, description, is_recurring) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![
            &holiday.name,
            &holiday.date,
            holiday.description.as_deref().unwrap_or(""),
            holiday.is_recurring.unwrap_or(false) as i32,
        ],
    )?;
    let id = conn.last_insert_rowid();
    let result = conn.query_row(
        &format!("SELECT {SELECT_FIELDS} WHERE id = ?1"),
        [id],
        row_to_holiday,
    )?;
    Ok(result)
}

/// Updates an existing holiday and returns the updated record.
#[tauri::command]
pub fn cmd_update_holiday(
    holiday: UpdateHoliday,
    db: State<DbState>,
) -> Result<Holiday, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let rows = conn.execute(
        "UPDATE holidays
         SET name = ?1, date = ?2, description = ?3, is_recurring = ?4, updated_at = datetime('now')
         WHERE id = ?5",
        rusqlite::params![
            &holiday.name,
            &holiday.date,
            holiday.description.as_deref().unwrap_or(""),
            holiday.is_recurring.unwrap_or(false) as i32,
            holiday.id,
        ],
    )?;
    if rows == 0 {
        return Err(WorklyticsError::NotFound(format!(
            "Holiday id={} not found",
            holiday.id
        )));
    }
    let result = conn.query_row(
        &format!("SELECT {SELECT_FIELDS} WHERE id = ?1"),
        [holiday.id],
        row_to_holiday,
    )?;
    Ok(result)
}

/// Deletes a holiday by ID.
#[tauri::command]
pub fn cmd_delete_holiday(id: i64, db: State<DbState>) -> Result<bool, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    // Confirm it exists first
    let exists: Option<i64> = conn
        .query_row("SELECT id FROM holidays WHERE id = ?1", [id], |r| r.get(0))
        .optional()?;
    if exists.is_none() {
        return Err(WorklyticsError::NotFound(format!(
            "Holiday id={id} not found"
        )));
    }
    conn.execute("DELETE FROM holidays WHERE id = ?1", [id])?;
    Ok(true)
}
