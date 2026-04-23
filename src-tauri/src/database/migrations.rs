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

        -- Indexes for fast date-range queries
        CREATE INDEX IF NOT EXISTS idx_work_entries_date ON work_entries(date);
        CREATE INDEX IF NOT EXISTS idx_holidays_date     ON holidays(date);
        CREATE INDEX IF NOT EXISTS idx_leaves_range      ON leaves(start_date, end_date);
        ",
    )?;

    Ok(())
}
