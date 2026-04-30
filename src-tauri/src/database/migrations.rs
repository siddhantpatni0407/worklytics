use rusqlite::Connection;

use crate::error::WorklyticsError;

/// Applies the initial database schema (idempotent — safe to call on every start).
pub fn run_migrations(conn: &Connection) -> Result<(), WorklyticsError> {
    conn.execute_batch(
        "
        -- Manual work entries (WFO / WFH / WFC only — effective status computed at query time)
        CREATE TABLE IF NOT EXISTS work_entries (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            date        TEXT    NOT NULL UNIQUE,   -- ISO-8601: YYYY-MM-DD
            status      TEXT    NOT NULL CHECK(status IN ('WFO','WFH','WFC')),
            notes       TEXT    NOT NULL DEFAULT '',
            created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- National / regional / custom holidays
        CREATE TABLE IF NOT EXISTS holidays (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            name         TEXT    NOT NULL,
            date         TEXT    NOT NULL UNIQUE,  -- YYYY-MM-DD
            description  TEXT    NOT NULL DEFAULT '',
            is_recurring INTEGER NOT NULL DEFAULT 0, -- 1 = repeat every year on same MM-DD
            created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- Leave records (date ranges)
        CREATE TABLE IF NOT EXISTS leaves (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            start_date  TEXT    NOT NULL,  -- YYYY-MM-DD
            end_date    TEXT    NOT NULL,  -- YYYY-MM-DD
            leave_type  TEXT    NOT NULL CHECK(leave_type IN
                            ('CASUAL','SICK','EARNED','MATERNITY','PATERNITY','UNPAID','COMP_OFF','OTHER')),
            reason      TEXT    NOT NULL DEFAULT '',
            status      TEXT    NOT NULL DEFAULT 'APPROVED'
                            CHECK(status IN ('PENDING','APPROVED','REJECTED')),
            created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- Daily tasks
        CREATE TABLE IF NOT EXISTS tasks (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            date        TEXT    NOT NULL,           -- YYYY-MM-DD
            title       TEXT    NOT NULL,
            details     TEXT    NOT NULL DEFAULT '',
            notes       TEXT    NOT NULL DEFAULT '',
            status      TEXT    NOT NULL DEFAULT 'TODO',
            tags        TEXT    NOT NULL DEFAULT '', -- comma-separated
            time_spent  REAL    NOT NULL DEFAULT 0, -- hours
            created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- Application settings (key-value store)
        CREATE TABLE IF NOT EXISTS app_settings (
            key    TEXT PRIMARY KEY,
            value  TEXT NOT NULL
        );

        -- Sticky notes
        CREATE TABLE IF NOT EXISTS sticky_notes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT    NOT NULL DEFAULT '',
            content     TEXT    NOT NULL DEFAULT '',
            color       TEXT    NOT NULL DEFAULT 'yellow'
                            CHECK(color IN ('yellow','blue','green','pink','purple')),
            pinned      INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- Indexes for fast date-range queries
        CREATE INDEX IF NOT EXISTS idx_work_entries_date    ON work_entries(date);
        CREATE INDEX IF NOT EXISTS idx_holidays_date        ON holidays(date);
        CREATE INDEX IF NOT EXISTS idx_leaves_range         ON leaves(start_date, end_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_date           ON tasks(date);
        CREATE INDEX IF NOT EXISTS idx_sticky_notes_color   ON sticky_notes(color);
        CREATE INDEX IF NOT EXISTS idx_sticky_notes_pinned  ON sticky_notes(pinned);
        ",
    )?;

    // Migration v1 → v2: drop the CHECK constraint on tasks.status
    // (SQLite can't DROP CONSTRAINT, so we recreate the table)
    let user_version: i32 = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    if user_version < 2 {
        conn.execute_batch(
            "PRAGMA foreign_keys = OFF;

             BEGIN;

             -- Rename old table
             ALTER TABLE tasks RENAME TO tasks_old;

             -- Create new table without CHECK constraint
             CREATE TABLE tasks (
                 id          INTEGER PRIMARY KEY AUTOINCREMENT,
                 date        TEXT    NOT NULL,
                 title       TEXT    NOT NULL,
                 details     TEXT    NOT NULL DEFAULT '',
                 notes       TEXT    NOT NULL DEFAULT '',
                 status      TEXT    NOT NULL DEFAULT 'TODO',
                 tags        TEXT    NOT NULL DEFAULT '',
                 time_spent  REAL    NOT NULL DEFAULT 0,
                 created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                 updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
             );

             -- Copy existing rows
             INSERT INTO tasks SELECT * FROM tasks_old;

             DROP TABLE tasks_old;

             COMMIT;

             PRAGMA foreign_keys = ON;
             PRAGMA user_version = 2;",
        )?;
    }

    Ok(())
}
