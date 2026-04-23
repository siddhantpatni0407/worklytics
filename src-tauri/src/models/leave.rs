use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Leave {
    pub id: i64,
    pub start_date: String,
    pub end_date: String,
    pub leave_type: String,
    pub reason: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLeave {
    pub start_date: String,
    pub end_date: String,
    pub leave_type: String,
    pub reason: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateLeave {
    pub id: i64,
    pub start_date: String,
    pub end_date: String,
    pub leave_type: String,
    pub reason: Option<String>,
    pub status: Option<String>,
}
