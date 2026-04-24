use tauri::Manager;

use crate::error::WorklyticsError;

/// Writes raw bytes to a file in the user's Documents/Worklytics directory.
/// Returns the full path to the created file.
#[tauri::command]
pub fn cmd_write_excel_file(
    filename: String,
    bytes: Vec<u8>,
    app: tauri::AppHandle,
) -> Result<String, WorklyticsError> {
    // Sanitise filename — strip any directory separators to prevent path traversal
    let safe_name = std::path::Path::new(&filename)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("export.xlsx")
        .to_string();

    let export_dir = get_export_dir(&app)?;
    std::fs::create_dir_all(&export_dir)?;
    let path = export_dir.join(&safe_name);
    std::fs::write(&path, bytes)?;
    Ok(path.to_string_lossy().to_string())
}

fn get_export_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, WorklyticsError> {
    let base = app
        .path()
        .document_dir()
        .or_else(|_| app.path().app_data_dir())
        .map_err(WorklyticsError::from)?;
    Ok(base.join("Worklytics").join("Exports"))
}
