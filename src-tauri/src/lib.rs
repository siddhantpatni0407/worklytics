mod commands;
mod database;
mod error;
mod models;

use database::DbState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let db_dir = std::path::PathBuf::from(r"C:\database\worklytics");

            if !db_dir.exists() {
                std::fs::create_dir_all(&db_dir)
                    .expect("Failed to create database directory");
            }

            let db_path = db_dir.join("worklytics.db");
            let conn = database::initialize_database(&db_path)
                .expect("Failed to initialize SQLite database");

            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Holiday commands
            commands::holiday_commands::cmd_get_holidays,
            commands::holiday_commands::cmd_get_holidays_by_year,
            commands::holiday_commands::cmd_add_holiday,
            commands::holiday_commands::cmd_update_holiday,
            commands::holiday_commands::cmd_delete_holiday,
            // Leave commands
            commands::leave_commands::cmd_get_leaves,
            commands::leave_commands::cmd_get_leaves_by_year,
            commands::leave_commands::cmd_add_leave,
            commands::leave_commands::cmd_update_leave,
            commands::leave_commands::cmd_delete_leave,
            // Work entry commands
            commands::work_commands::cmd_get_work_entry,
            commands::work_commands::cmd_set_work_entry,
            commands::work_commands::cmd_delete_work_entry,
            commands::work_commands::cmd_get_month_statuses,
            commands::work_commands::cmd_get_effective_status,
            // Analytics commands
            commands::analytics_commands::cmd_get_monthly_analytics,
            commands::analytics_commands::cmd_get_yearly_analytics,
            commands::analytics_commands::cmd_get_summary_stats,
            // Export commands
            commands::export_commands::cmd_export_monthly_csv,
            commands::export_commands::cmd_export_yearly_csv,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Worklytics application");
}
