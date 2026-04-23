use serde::Serialize;
use thiserror::Error;

/// Central error type for Worklytics backend operations.
#[derive(Debug, Error, Serialize)]
pub enum WorklyticsError {
    #[error("Database error: {0}")]
    Database(String),

    #[error("Record not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("Serialization error: {0}")]
    Serialization(String),
}

impl From<rusqlite::Error> for WorklyticsError {
    fn from(err: rusqlite::Error) -> Self {
        WorklyticsError::Database(err.to_string())
    }
}

impl From<std::io::Error> for WorklyticsError {
    fn from(err: std::io::Error) -> Self {
        WorklyticsError::Io(err.to_string())
    }
}

impl From<tauri::Error> for WorklyticsError {
    fn from(err: tauri::Error) -> Self {
        WorklyticsError::Io(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, WorklyticsError>;
