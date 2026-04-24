use std::path::PathBuf;

use tauri::{AppHandle, Manager, State};

use crate::database::{initialize_database, DbState};
use crate::db_config::{self, DbConfig};
use crate::error::WorklyticsError;

/// Returns the current database file path (custom or default).
#[tauri::command]
pub fn cmd_get_db_path(app: AppHandle) -> Result<String, WorklyticsError> {
    let config_dir = app.path().app_config_dir()?;
    let data_dir = app.path().app_data_dir()?;
    let path = db_config::resolve_db_path(&config_dir, &data_dir);
    Ok(path.to_string_lossy().to_string())
}

/// Returns the default database file path (regardless of custom setting).
#[tauri::command]
pub fn cmd_get_default_db_path(app: AppHandle) -> Result<String, WorklyticsError> {
    let data_dir = app.path().app_data_dir()?;
    let path = db_config::default_db_path(&data_dir);
    Ok(path.to_string_lossy().to_string())
}

/// Returns whether a custom DB path is currently configured.
#[tauri::command]
pub fn cmd_is_custom_db_path(app: AppHandle) -> Result<bool, WorklyticsError> {
    let config_dir = app.path().app_config_dir()?;
    let config = db_config::load_config(&config_dir);
    Ok(config.custom_path.is_some())
}

/// Open a native folder-picker dialog and return the chosen directory path.
/// Returns None if the user cancelled.
#[tauri::command]
pub fn cmd_select_db_directory(app: AppHandle) -> Result<Option<String>, WorklyticsError> {
    use tauri_plugin_dialog::DialogExt;
    let folder = app
        .dialog()
        .file()
        .set_title("Select Database Storage Directory")
        .blocking_pick_folder();

    Ok(folder.map(|fp| fp.to_string()))
}

/// Copy the current database to `new_path`, validate it, then reconnect.
/// `new_path` must be the full path including filename (e.g. `/home/user/my.db`).
#[tauri::command]
pub fn cmd_migrate_db(
    new_path: String,
    db: State<DbState>,
    app: AppHandle,
) -> Result<String, WorklyticsError> {
    let new = PathBuf::from(&new_path);

    // Parent directory must exist.
    let parent = new.parent().ok_or_else(|| {
        WorklyticsError::Validation("Invalid path: no parent directory".into())
    })?;
    if !parent.exists() {
        return Err(WorklyticsError::Validation(format!(
            "Directory does not exist: {}",
            parent.display()
        )));
    }

    let config_dir = app.path().app_config_dir()?;
    let data_dir = app.path().app_data_dir()?;
    let current_path = db_config::resolve_db_path(&config_dir, &data_dir);

    {
        let conn = db
            .0
            .lock()
            .map_err(|e| WorklyticsError::Database(e.to_string()))?;

        if current_path == new {
            return Ok(new_path);
        }

        // Checkpoint WAL so the single .db file contains everything.
        conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;

        // Copy the database file.
        if current_path.exists() {
            std::fs::copy(&current_path, &new).map_err(|e| {
                WorklyticsError::Io(format!("Failed to copy database: {e}"))
            })?;
        }
    }

    // Validate the new DB opens and has our schema.
    initialize_database(&new).map_err(|_| {
        // Roll back the file if validation fails.
        let _ = std::fs::remove_file(&new);
        WorklyticsError::Validation("New database file failed integrity check".into())
    })?;

    // Reconnect managed state to new path.
    {
        let mut conn = db
            .0
            .lock()
            .map_err(|e| WorklyticsError::Database(e.to_string()))?;
        let new_conn = initialize_database(&new)?;
        *conn = new_conn;
    }

    // Persist config.
    let default = db_config::default_db_path(&data_dir);
    let config = DbConfig {
        custom_path: if new == default {
            None
        } else {
            Some(new_path.clone())
        },
    };
    db_config::save_config(&config_dir, &config)?;

    Ok(new_path)
}

/// Reset the database location to the default path.
/// The existing data at the custom location is NOT moved; a fresh connection
/// is opened at the default path (which may already exist from a prior session).
#[tauri::command]
pub fn cmd_reset_db_path(
    db: State<DbState>,
    app: AppHandle,
) -> Result<String, WorklyticsError> {
    let config_dir = app.path().app_config_dir()?;
    let data_dir = app.path().app_data_dir()?;

    // Remove custom setting.
    let config = DbConfig { custom_path: None };
    db_config::save_config(&config_dir, &config)?;

    let default = db_config::default_db_path(&data_dir);

    // Ensure default directory exists.
    if let Some(parent) = default.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // Reconnect to default DB.
    {
        let mut conn = db
            .0
            .lock()
            .map_err(|e| WorklyticsError::Database(e.to_string()))?;
        let new_conn = initialize_database(&default)?;
        *conn = new_conn;
    }

    Ok(default.to_string_lossy().to_string())
}
