use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: i64,
    pub date: String,       // "YYYY-MM-DD"
    pub title: String,
    pub details: String,
    pub notes: String,
    pub status: String,     // "IN_PROGRESS" | "COMPLETED" | "BLOCKED"
    pub tags: String,       // comma-separated
    pub time_spent: f64,    // hours
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTask {
    pub date: String,
    pub title: String,
    pub details: Option<String>,
    pub notes: Option<String>,
    pub status: Option<String>,
    pub tags: Option<String>,
    pub time_spent: Option<f64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTask {
    pub id: i64,
    pub date: Option<String>,
    pub title: Option<String>,
    pub details: Option<String>,
    pub notes: Option<String>,
    pub status: Option<String>,
    pub tags: Option<String>,
    pub time_spent: Option<f64>,
}
