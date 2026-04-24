use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::error::WorklyticsError;

const CONFIG_FILENAME: &str = "db_config.json";
const DEFAULT_DB_FILENAME: &str = "worklytics.db";

/// Persisted configuration for the database location.
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct DbConfig {
    /// Absolute path to the database file. None → use default.
    pub custom_path: Option<String>,
}

/// Path to the JSON config file.
pub fn config_file_path(app_config_dir: &Path) -> PathBuf {
    app_config_dir.join(CONFIG_FILENAME)
}

/// Load config from disk (returns Default if not found or malformed).
pub fn load_config(app_config_dir: &Path) -> DbConfig {
    let path = config_file_path(app_config_dir);
    if let Ok(content) = std::fs::read_to_string(&path) {
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        DbConfig::default()
    }
}

/// Persist config to disk.
pub fn save_config(app_config_dir: &Path, config: &DbConfig) -> Result<(), WorklyticsError> {
    std::fs::create_dir_all(app_config_dir)?;
    let path = config_file_path(app_config_dir);
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| WorklyticsError::Serialization(e.to_string()))?;
    std::fs::write(&path, content)?;
    Ok(())
}

/// Default database path: {app_data_dir}/worklytics.db
pub fn default_db_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(DEFAULT_DB_FILENAME)
}

/// Resolve the actual DB path: custom if set, otherwise default.
pub fn resolve_db_path(app_config_dir: &Path, app_data_dir: &Path) -> PathBuf {
    let config = load_config(app_config_dir);
    if let Some(ref custom) = config.custom_path {
        PathBuf::from(custom)
    } else {
        default_db_path(app_data_dir)
    }
}
