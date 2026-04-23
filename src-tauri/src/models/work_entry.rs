use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkEntry {
    pub id: i64,
    pub date: String,
    pub status: String, // "WFO" | "WFH" | "WFC"
    pub notes: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetWorkEntry {
    pub date: String,
    pub status: String, // "WFO" | "WFH" | "WFC"
    pub notes: Option<String>,
}

/// Computed status for a single calendar day, combining all data sources.
/// Priority: LEAVE > HOLIDAY > WFO/WFH/WFC > WEEKEND > UNSET
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayStatus {
    pub date: String,
    /// Final resolved status string: "WFO"|"WFH"|"WFC"|"LEAVE"|"HOLIDAY"|"WEEKEND"|"UNSET"
    pub effective_status: String,
    /// Raw work entry (if any)
    pub work_entry: Option<WorkEntry>,
    pub is_weekend: bool,
    pub is_holiday: bool,
    pub holiday_name: Option<String>,
    pub is_leave: bool,
    pub leave_type: Option<String>,
    pub leave_status: Option<String>,
}
