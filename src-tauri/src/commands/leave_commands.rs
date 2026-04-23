use rusqlite::OptionalExtension;
use tauri::State;

use crate::database::DbState;
use crate::error::WorklyticsError;
use crate::models::{CreateLeave, Leave, UpdateLeave};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn row_to_leave(row: &rusqlite::Row<'_>) -> rusqlite::Result<Leave> {
    Ok(Leave {
        id: row.get(0)?,
        start_date: row.get(1)?,
        end_date: row.get(2)?,
        leave_type: row.get(3)?,
        reason: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
        status: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}

const SELECT_FIELDS: &str =
    "id, start_date, end_date, leave_type, reason, status, created_at, updated_at FROM leaves";

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

/// Returns all leave records ordered by start date descending.
#[tauri::command]
pub fn cmd_get_leaves(db: State<DbState>) -> Result<Vec<Leave>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut stmt =
        conn.prepare(&format!("SELECT {SELECT_FIELDS} ORDER BY start_date DESC"))?;
    let leaves = stmt
        .query_map([], row_to_leave)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(WorklyticsError::from)?;
    Ok(leaves)
}

/// Returns leaves that overlap with the given year.
#[tauri::command]
pub fn cmd_get_leaves_by_year(
    year: i32,
    db: State<DbState>,
) -> Result<Vec<Leave>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let year_start = format!("{year}-01-01");
    let year_end = format!("{year}-12-31");
    let mut stmt = conn.prepare(&format!(
        "SELECT {SELECT_FIELDS}
         WHERE start_date <= ?2 AND end_date >= ?1
         ORDER BY start_date ASC"
    ))?;
    let leaves = stmt
        .query_map(rusqlite::params![&year_start, &year_end], row_to_leave)?
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(WorklyticsError::from)?;
    Ok(leaves)
}

/// Inserts a new leave record and returns it.
#[tauri::command]
pub fn cmd_add_leave(
    leave: CreateLeave,
    db: State<DbState>,
) -> Result<Leave, WorklyticsError> {
    // Validate dates
    if leave.start_date > leave.end_date {
        return Err(WorklyticsError::Validation(
            "start_date must be on or before end_date".into(),
        ));
    }
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    conn.execute(
        "INSERT INTO leaves (start_date, end_date, leave_type, reason, status)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![
            &leave.start_date,
            &leave.end_date,
            &leave.leave_type,
            leave.reason.as_deref().unwrap_or(""),
            leave.status.as_deref().unwrap_or("APPROVED"),
        ],
    )?;
    let id = conn.last_insert_rowid();
    let result = conn.query_row(
        &format!("SELECT {SELECT_FIELDS} WHERE id = ?1"),
        [id],
        row_to_leave,
    )?;
    Ok(result)
}

/// Updates an existing leave record and returns it.
#[tauri::command]
pub fn cmd_update_leave(
    leave: UpdateLeave,
    db: State<DbState>,
) -> Result<Leave, WorklyticsError> {
    if leave.start_date > leave.end_date {
        return Err(WorklyticsError::Validation(
            "start_date must be on or before end_date".into(),
        ));
    }
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let rows = conn.execute(
        "UPDATE leaves
         SET start_date = ?1, end_date = ?2, leave_type = ?3, reason = ?4,
             status = ?5, updated_at = datetime('now')
         WHERE id = ?6",
        rusqlite::params![
            &leave.start_date,
            &leave.end_date,
            &leave.leave_type,
            leave.reason.as_deref().unwrap_or(""),
            leave.status.as_deref().unwrap_or("APPROVED"),
            leave.id,
        ],
    )?;
    if rows == 0 {
        return Err(WorklyticsError::NotFound(format!(
            "Leave id={} not found",
            leave.id
        )));
    }
    let result = conn.query_row(
        &format!("SELECT {SELECT_FIELDS} WHERE id = ?1"),
        [leave.id],
        row_to_leave,
    )?;
    Ok(result)
}

/// Deletes a leave by ID.
#[tauri::command]
pub fn cmd_delete_leave(id: i64, db: State<DbState>) -> Result<bool, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let exists: Option<i64> = conn
        .query_row("SELECT id FROM leaves WHERE id = ?1", [id], |r| r.get(0))
        .optional()?;
    if exists.is_none() {
        return Err(WorklyticsError::NotFound(format!("Leave id={id} not found")));
    }
    conn.execute("DELETE FROM leaves WHERE id = ?1", [id])?;
    Ok(true)
}
