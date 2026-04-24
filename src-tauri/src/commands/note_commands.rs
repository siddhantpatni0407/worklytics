use tauri::State;

use crate::database::DbState;
use crate::error::WorklyticsError;
use crate::models::{CreateNote, StickyNote, UpdateNote};

const VALID_COLORS: &[&str] = &["yellow", "blue", "green", "pink", "purple"];

fn validate_color(color: &str) -> Result<(), WorklyticsError> {
    if VALID_COLORS.contains(&color) {
        Ok(())
    } else {
        Err(WorklyticsError::Validation(format!(
            "Invalid color '{color}'. Must be one of: yellow, blue, green, pink, purple"
        )))
    }
}

fn row_to_note(row: &rusqlite::Row<'_>) -> rusqlite::Result<StickyNote> {
    Ok(StickyNote {
        id: row.get(0)?,
        title: row.get::<_, Option<String>>(1)?.unwrap_or_default(),
        content: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
        color: row
            .get::<_, Option<String>>(3)?
            .unwrap_or_else(|| "yellow".into()),
        pinned: row.get::<_, i64>(4)? != 0,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
    })
}

const SELECT_COLS: &str =
    "id, title, content, color, pinned, created_at, updated_at FROM sticky_notes";

/// Return all notes — pinned first, then most-recently-updated.
#[tauri::command]
pub fn cmd_get_all_notes(db: State<DbState>) -> Result<Vec<StickyNote>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut stmt = conn.prepare(&format!(
        "SELECT {SELECT_COLS} ORDER BY pinned DESC, updated_at DESC"
    ))?;
    let notes = stmt
        .query_map([], row_to_note)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(notes)
}

/// Full-text search across title and content.
#[tauri::command]
pub fn cmd_search_notes(
    query: String,
    db: State<DbState>,
) -> Result<Vec<StickyNote>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let pattern = format!("%{query}%");
    let mut stmt = conn.prepare(&format!(
        "SELECT {SELECT_COLS}
         WHERE title LIKE ?1 OR content LIKE ?1
         ORDER BY pinned DESC, updated_at DESC"
    ))?;
    let notes = stmt
        .query_map([&pattern], row_to_note)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(notes)
}

/// Return notes filtered by a single color.
#[tauri::command]
pub fn cmd_get_notes_by_color(
    color: String,
    db: State<DbState>,
) -> Result<Vec<StickyNote>, WorklyticsError> {
    validate_color(&color)?;
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut stmt = conn.prepare(&format!(
        "SELECT {SELECT_COLS} WHERE color = ?1 ORDER BY pinned DESC, updated_at DESC"
    ))?;
    let notes = stmt
        .query_map([&color], row_to_note)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(notes)
}

/// Create a new sticky note.
#[tauri::command]
pub fn cmd_add_note(
    note: CreateNote,
    db: State<DbState>,
) -> Result<StickyNote, WorklyticsError> {
    let title = note.title.unwrap_or_default();
    let color = note.color.unwrap_or_else(|| "yellow".into());
    validate_color(&color)?;

    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    conn.execute(
        "INSERT INTO sticky_notes (title, content, color) VALUES (?1, ?2, ?3)",
        rusqlite::params![title, note.content, color],
    )?;
    let id = conn.last_insert_rowid();
    let saved = conn.query_row(
        &format!("SELECT {SELECT_COLS} WHERE id = ?1"),
        [id],
        row_to_note,
    )?;
    Ok(saved)
}

/// Update an existing sticky note (all fields optional — only supplied fields change).
#[tauri::command]
pub fn cmd_update_note(
    note: UpdateNote,
    db: State<DbState>,
) -> Result<StickyNote, WorklyticsError> {
    if let Some(ref c) = note.color {
        validate_color(c)?;
    }

    let pinned_val: Option<i64> = note.pinned.map(|p| if p { 1 } else { 0 });

    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let rows = conn.execute(
        "UPDATE sticky_notes
         SET title      = COALESCE(?2, title),
             content    = COALESCE(?3, content),
             color      = COALESCE(?4, color),
             pinned     = COALESCE(?5, pinned),
             updated_at = datetime('now')
         WHERE id = ?1",
        rusqlite::params![note.id, note.title, note.content, note.color, pinned_val],
    )?;

    if rows == 0 {
        return Err(WorklyticsError::NotFound(format!(
            "Note {} not found",
            note.id
        )));
    }

    let updated = conn.query_row(
        &format!("SELECT {SELECT_COLS} WHERE id = ?1"),
        [note.id],
        row_to_note,
    )?;
    Ok(updated)
}

/// Delete a sticky note. Returns true if a row was deleted.
#[tauri::command]
pub fn cmd_delete_note(id: i64, db: State<DbState>) -> Result<bool, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let n = conn.execute("DELETE FROM sticky_notes WHERE id = ?1", [id])?;
    Ok(n > 0)
}

/// Toggle the pinned flag for a note.
#[tauri::command]
pub fn cmd_pin_note(
    id: i64,
    pinned: bool,
    db: State<DbState>,
) -> Result<StickyNote, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let rows = conn.execute(
        "UPDATE sticky_notes SET pinned = ?2, updated_at = datetime('now') WHERE id = ?1",
        rusqlite::params![id, if pinned { 1i64 } else { 0i64 }],
    )?;
    if rows == 0 {
        return Err(WorklyticsError::NotFound(format!("Note {id} not found")));
    }
    let note = conn.query_row(
        &format!("SELECT {SELECT_COLS} WHERE id = ?1"),
        [id],
        row_to_note,
    )?;
    Ok(note)
}
