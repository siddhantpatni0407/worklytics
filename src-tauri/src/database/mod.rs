pub mod migrations;

use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

use crate::error::WorklyticsError;

/// Managed Tauri state wrapping the SQLite connection.
pub struct DbState(pub Mutex<Connection>);

/// Opens (or creates) the SQLite database at `path` and runs all migrations.
pub fn initialize_database(path: &Path) -> Result<Connection, WorklyticsError> {
    let conn = Connection::open(path)?;

    // Enable WAL for better concurrent read performance.
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA foreign_keys=ON;")?;

    migrations::run_migrations(&conn)?;

    Ok(conn)
}
