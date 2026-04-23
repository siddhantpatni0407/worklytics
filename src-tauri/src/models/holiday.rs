use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Holiday {
    pub id: i64,
    pub name: String,
    pub date: String,
    pub description: String,
    pub is_recurring: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateHoliday {
    pub name: String,
    pub date: String,
    pub description: Option<String>,
    pub is_recurring: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateHoliday {
    pub id: i64,
    pub name: String,
    pub date: String,
    pub description: Option<String>,
    pub is_recurring: Option<bool>,
}
