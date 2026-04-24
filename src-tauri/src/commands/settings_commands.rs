use tauri::State;

use crate::database::DbState;
use crate::error::WorklyticsError;

/// Retrieve a single setting value by key. Returns None if not set.
#[tauri::command]
pub fn cmd_get_setting(
    key: String,
    db: State<DbState>,
) -> Result<Option<String>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    use rusqlite::OptionalExtension;
    let val: Option<String> = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = ?1",
            [&key],
            |row| row.get(0),
        )
        .optional()?;
    Ok(val)
}

/// Retrieve all settings as key-value pairs.
#[tauri::command]
pub fn cmd_get_all_settings(
    db: State<DbState>,
) -> Result<Vec<(String, String)>, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut stmt = conn.prepare("SELECT key, value FROM app_settings ORDER BY key")?;
    let rows = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(rows)
}

/// Upsert (insert or replace) a setting.
#[tauri::command]
pub fn cmd_set_setting(
    key: String,
    value: String,
    db: State<DbState>,
) -> Result<(), WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    conn.execute(
        "INSERT INTO app_settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        rusqlite::params![key, value],
    )?;
    Ok(())
}

/// Set multiple settings at once (batch upsert).
#[tauri::command]
pub fn cmd_set_settings_batch(
    settings: Vec<(String, String)>,
    db: State<DbState>,
) -> Result<(), WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    for (key, value) in settings {
        conn.execute(
            "INSERT INTO app_settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            rusqlite::params![key, value],
        )?;
    }
    Ok(())
}
