mod commands;
mod database;
mod db_config;
mod error;
mod models;

use database::DbState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Use Tauri-managed paths so the app works on all platforms.
            let config_dir = app
                .path()
                .app_config_dir()
                .expect("Failed to resolve app config dir");
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data dir");

            // Ensure the data directory exists (first run).
            std::fs::create_dir_all(&data_dir)
                .expect("Failed to create app data directory");

            // Resolve DB path (custom from config, or default).
            let db_path = db_config::resolve_db_path(&config_dir, &data_dir);

            // Ensure the DB's parent directory exists.
            if let Some(parent) = db_path.parent() {
                std::fs::create_dir_all(parent)
                    .expect("Failed to create database directory");
            }

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
            // Task commands
            commands::task_commands::cmd_get_tasks_by_date,
            commands::task_commands::cmd_get_tasks_by_range,
            commands::task_commands::cmd_get_all_tasks,
            commands::task_commands::cmd_add_task,
            commands::task_commands::cmd_update_task,
            commands::task_commands::cmd_delete_task,
            commands::task_commands::cmd_get_task_counts_for_month,
            // Settings commands
            commands::settings_commands::cmd_get_setting,
            commands::settings_commands::cmd_get_all_settings,
            commands::settings_commands::cmd_set_setting,
            commands::settings_commands::cmd_set_settings_batch,
            // Excel export
            commands::excel_commands::cmd_write_excel_file,
            // Database configuration commands
            commands::db_commands::cmd_get_db_path,
            commands::db_commands::cmd_get_default_db_path,
            commands::db_commands::cmd_is_custom_db_path,
            commands::db_commands::cmd_select_db_directory,
            commands::db_commands::cmd_migrate_db,
            commands::db_commands::cmd_reset_db_path,
            // Sticky note commands
            commands::note_commands::cmd_get_all_notes,
            commands::note_commands::cmd_search_notes,
            commands::note_commands::cmd_get_notes_by_color,
            commands::note_commands::cmd_add_note,
            commands::note_commands::cmd_update_note,
            commands::note_commands::cmd_delete_note,
            commands::note_commands::cmd_pin_note,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Worklytics application");
}
