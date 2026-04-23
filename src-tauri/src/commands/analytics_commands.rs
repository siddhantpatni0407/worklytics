use chrono::{Datelike, NaiveDate};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::commands::work_commands::resolve_day_status;
use crate::database::DbState;
use crate::error::WorklyticsError;

// ---------------------------------------------------------------------------
// DTO types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyAnalytics {
    pub year: i32,
    pub month: u32,
    pub month_name: String,
    pub total_days: u32,
    pub working_days: u32, // weekdays (Mon–Fri)
    pub wfo_count: u32,
    pub wfh_count: u32,
    pub wfc_count: u32,
    pub leave_count: u32,
    pub holiday_count: u32,
    pub weekend_count: u32,
    pub unset_count: u32,
    pub wfo_pct: f64,
    pub wfh_pct: f64,
    pub wfc_pct: f64,
    pub leave_pct: f64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YearlyAnalytics {
    pub year: i32,
    pub months: Vec<MonthlyAnalytics>,
    pub total_wfo: u32,
    pub total_wfh: u32,
    pub total_wfc: u32,
    pub total_leave: u32,
    pub total_holiday: u32,
    pub total_weekend: u32,
    pub total_working_days: u32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SummaryStats {
    pub year: i32,
    pub total_wfo: u32,
    pub total_wfh: u32,
    pub total_wfc: u32,
    pub total_leave: u32,
    pub total_holiday: u32,
    pub total_working_days: u32,
    pub days_logged: u32,
    pub unlogged_working_days: u32,
    pub remote_work_pct: f64,  // (WFH + WFC) / (WFO + WFH + WFC) * 100
    pub office_work_pct: f64,
}

static MONTH_NAMES: [&str; 12] = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
];

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

fn compute_month(
    year: i32,
    month: u32,
    conn: &rusqlite::Connection,
) -> Result<MonthlyAnalytics, WorklyticsError> {
    let first = NaiveDate::from_ymd_opt(year, month, 1)
        .ok_or_else(|| WorklyticsError::Validation(format!("Invalid {year}-{month}")))?;
    let last = if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1)
    }
    .and_then(|d| d.pred_opt())
    .ok_or_else(|| WorklyticsError::Validation("Bad month end".into()))?;

    let mut wfo = 0u32;
    let mut wfh = 0u32;
    let mut wfc = 0u32;
    let mut leave = 0u32;
    let mut holiday = 0u32;
    let mut weekend = 0u32;
    let mut unset = 0u32;
    let mut working_days = 0u32;

    let mut cur = first;
    while cur <= last {
        let ds = resolve_day_status(&cur.format("%Y-%m-%d").to_string(), conn)?;
        if !ds.is_weekend {
            working_days += 1;
        }
        match ds.effective_status.as_str() {
            "WFO" => wfo += 1,
            "WFH" => wfh += 1,
            "WFC" => wfc += 1,
            "LEAVE" => leave += 1,
            "HOLIDAY" => holiday += 1,
            "WEEKEND" => weekend += 1,
            _ => unset += 1,
        }
        cur = cur.succ_opt().unwrap();
    }

    let total_days = (last.day() - first.day() + 1) as u32;
    let logged = wfo + wfh + wfc;
    let divisor = if logged == 0 { 1.0 } else { logged as f64 };

    Ok(MonthlyAnalytics {
        year,
        month,
        month_name: MONTH_NAMES[(month - 1) as usize].to_string(),
        total_days,
        working_days,
        wfo_count: wfo,
        wfh_count: wfh,
        wfc_count: wfc,
        leave_count: leave,
        holiday_count: holiday,
        weekend_count: weekend,
        unset_count: unset,
        wfo_pct: wfo as f64 / divisor * 100.0,
        wfh_pct: wfh as f64 / divisor * 100.0,
        wfc_pct: wfc as f64 / divisor * 100.0,
        leave_pct: if working_days == 0 { 0.0 } else { leave as f64 / working_days as f64 * 100.0 },
    })
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn cmd_get_monthly_analytics(
    year: i32,
    month: u32,
    db: State<DbState>,
) -> Result<MonthlyAnalytics, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    compute_month(year, month, &conn)
}

#[tauri::command]
pub fn cmd_get_yearly_analytics(
    year: i32,
    db: State<DbState>,
) -> Result<YearlyAnalytics, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut months = Vec::with_capacity(12);
    for m in 1u32..=12 {
        months.push(compute_month(year, m, &conn)?);
    }

    let total_wfo: u32 = months.iter().map(|m| m.wfo_count).sum();
    let total_wfh: u32 = months.iter().map(|m| m.wfh_count).sum();
    let total_wfc: u32 = months.iter().map(|m| m.wfc_count).sum();
    let total_leave: u32 = months.iter().map(|m| m.leave_count).sum();
    let total_holiday: u32 = months.iter().map(|m| m.holiday_count).sum();
    let total_weekend: u32 = months.iter().map(|m| m.weekend_count).sum();
    let total_working_days: u32 = months.iter().map(|m| m.working_days).sum();

    Ok(YearlyAnalytics {
        year,
        months,
        total_wfo,
        total_wfh,
        total_wfc,
        total_leave,
        total_holiday,
        total_weekend,
        total_working_days,
    })
}

#[tauri::command]
pub fn cmd_get_summary_stats(
    year: i32,
    db: State<DbState>,
) -> Result<SummaryStats, WorklyticsError> {
    let conn = db.0.lock().map_err(|e| WorklyticsError::Database(e.to_string()))?;
    let mut total_wfo = 0u32;
    let mut total_wfh = 0u32;
    let mut total_wfc = 0u32;
    let mut total_leave = 0u32;
    let mut total_holiday = 0u32;
    let mut total_working_days = 0u32;

    for m in 1u32..=12 {
        let ma = compute_month(year, m, &conn)?;
        total_wfo += ma.wfo_count;
        total_wfh += ma.wfh_count;
        total_wfc += ma.wfc_count;
        total_leave += ma.leave_count;
        total_holiday += ma.holiday_count;
        total_working_days += ma.working_days;
    }

    let days_logged = total_wfo + total_wfh + total_wfc;
    let unlogged_working_days = total_working_days.saturating_sub(days_logged + total_leave + total_holiday);
    let work_total = (days_logged) as f64;
    let remote_work_pct = if work_total == 0.0 { 0.0 } else { (total_wfh + total_wfc) as f64 / work_total * 100.0 };
    let office_work_pct = if work_total == 0.0 { 0.0 } else { total_wfo as f64 / work_total * 100.0 };

    Ok(SummaryStats {
        year,
        total_wfo,
        total_wfh,
        total_wfc,
        total_leave,
        total_holiday,
        total_working_days,
        days_logged,
        unlogged_working_days,
        remote_work_pct,
        office_work_pct,
    })
}
