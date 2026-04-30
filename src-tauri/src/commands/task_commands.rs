use rusqlite::OptionalExtension;
use tauri::State;

use crate::database::DbState;
use crate::error::WorklyticsError;
use crate::models::{Task, CreateTask, UpdateTask};

fn row_to_task(row: &rusqlite::Row<'_>) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get(0)?,
        date: row.get(1)?,
        title: row.get(2)?,
        details: row.get::<_, Option<String>>(3)?.unwrap_or_default(),
        notes: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
        status: row.get(5)?,
        tags: row.get::<_, Option<String>>(6)?.unwrap_or_default(),
        time_spent: row.get::<_, Option<f64>>(7)?.unwrap_or(0.0),
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

/// Fetch all tasks for a given date.
#[tauri::command]
pub fn cmd_get_tasks_by_date(
    date: String,
    db: State<DbState>,
) -> Result<Vec<Task>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id, date, title, details, notes, status, tags, time_spent, created_at, updated_at
         FROM tasks WHERE date = ?1 ORDER BY id ASC",
    )?;
    let tasks = stmt
        .query_map([&date], row_to_task)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(tasks)
}

/// Fetch all tasks in a date range (inclusive).
#[tauri::command]
pub fn cmd_get_tasks_by_range(
    from: String,
    to: String,
    db: State<DbState>,
) -> Result<Vec<Task>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id, date, title, details, notes, status, tags, time_spent, created_at, updated_at
         FROM tasks WHERE date BETWEEN ?1 AND ?2 ORDER BY date ASC, id ASC",
    )?;
    let tasks = stmt
        .query_map(rusqlite::params![from, to], row_to_task)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(tasks)
}

/// Fetch all tasks (no filter).
#[tauri::command]
pub fn cmd_get_all_tasks(db: State<DbState>) -> Result<Vec<Task>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id, date, title, details, notes, status, tags, time_spent, created_at, updated_at
         FROM tasks ORDER BY date DESC, id DESC",
    )?;
    let tasks = stmt
        .query_map([], row_to_task)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(tasks)
}

/// Add a new task.
#[tauri::command]
pub fn cmd_add_task(task: CreateTask, db: State<DbState>) -> Result<Task, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    conn.execute(
        "INSERT INTO tasks (date, title, details, notes, status, tags, time_spent)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![
            task.date,
            task.title,
            task.details.unwrap_or_default(),
            task.notes.unwrap_or_default(),
            task.status.unwrap_or_else(|| "TODO".to_string()),
            task.tags.unwrap_or_default(),
            task.time_spent.unwrap_or(0.0),
        ],
    )?;
    let id = conn.last_insert_rowid();
    let t = conn
        .query_row(
            "SELECT id, date, title, details, notes, status, tags, time_spent, created_at, updated_at
             FROM tasks WHERE id = ?1",
            [id],
            row_to_task,
        )
        .optional()?
        .ok_or_else(|| WorklyticsError::Database("Insert failed".into()))?;
    Ok(t)
}

/// Update an existing task (partial update — only non-None fields are applied).
#[tauri::command]
pub fn cmd_update_task(task: UpdateTask, db: State<DbState>) -> Result<Task, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;

    // Fetch current values
    let current = conn
        .query_row(
            "SELECT id, date, title, details, notes, status, tags, time_spent, created_at, updated_at
             FROM tasks WHERE id = ?1",
            [task.id],
            row_to_task,
        )
        .optional()?
        .ok_or_else(|| WorklyticsError::Validation(format!("Task {} not found", task.id)))?;

    let new_date = task.date.unwrap_or(current.date);
    let new_title = task.title.unwrap_or(current.title);
    let new_details = task.details.unwrap_or(current.details);
    let new_notes = task.notes.unwrap_or(current.notes);
    let new_status = task.status.unwrap_or(current.status);
    let new_tags = task.tags.unwrap_or(current.tags);
    let new_time = task.time_spent.unwrap_or(current.time_spent);

    conn.execute(
        "UPDATE tasks SET date=?1, title=?2, details=?3, notes=?4,
         status=?5, tags=?6, time_spent=?7, updated_at=datetime('now')
         WHERE id=?8",
        rusqlite::params![
            new_date, new_title, new_details, new_notes,
            new_status, new_tags, new_time, task.id,
        ],
    )?;

    let t = conn
        .query_row(
            "SELECT id, date, title, details, notes, status, tags, time_spent, created_at, updated_at
             FROM tasks WHERE id = ?1",
            [task.id],
            row_to_task,
        )
        .optional()?
        .ok_or_else(|| WorklyticsError::Database("Update failed".into()))?;
    Ok(t)
}

/// Delete a task by id.
#[tauri::command]
pub fn cmd_delete_task(id: i64, db: State<DbState>) -> Result<bool, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let affected = conn.execute("DELETE FROM tasks WHERE id = ?1", [id])?;
    Ok(affected > 0)
}

/// Get count of tasks per date for a date range (for calendar indicators).
#[tauri::command]
pub fn cmd_get_task_counts_for_month(
    year: i32,
    month: u32,
    db: State<DbState>,
) -> Result<Vec<(String, i64)>, WorklyticsError> {
    let from = format!("{:04}-{:02}-01", year, month);
    let to = if month == 12 {
        format!("{:04}-01-01", year + 1)
    } else {
        format!("{:04}-{:02}-01", year, month + 1)
    };

    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT date, COUNT(*) as cnt FROM tasks
         WHERE date >= ?1 AND date < ?2
         GROUP BY date",
    )?;
    let rows = stmt
        .query_map(rusqlite::params![from, to], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(rows)
}
