import { useEffect, useState, useCallback } from "react";
import { Briefcase, Home, Building2, UmbrellaOff, PartyPopper, Download, RefreshCw, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  getYearlyAnalytics, getSummaryStats, exportYearlyCsv,
  getTasksByRange, writeExcelFile, getMonthStatuses,
} from "@/utils/tauriCommands";
import { buildWorkSheet, buildTaskSheet } from "@/utils/excelExport";
import { useAppStore } from "@/store/appStore";
import type { YearlyAnalytics, SummaryStats } from "@/types";
import { yearRangeFromBounds } from "@/utils/dateUtils";
import StatsCard from "@/components/dashboard/StatsCard";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import YearlyTrendChart from "@/components/dashboard/YearlyTrendChart";
import StatusDistributionChart from "@/components/dashboard/StatusDistributionChart";
import Button from "@/components/common/Button";

export default function DashboardPage() {
  const { selectedYear, setSelectedYear, analyticsRefreshKey, settings } = useAppStore();
  const years = yearRangeFromBounds(settings.yearStart, settings.yearEnd);

  const [yearlyData, setYearlyData]   = useState<YearlyAnalytics | null>(null);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading]         = useState(false);
  const [exporting, setExporting]     = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [yearly, summary] = await Promise.all([
        getYearlyAnalytics(selectedYear),
        getSummaryStats(selectedYear),
      ]);
      setYearlyData(yearly);
      setSummaryStats(summary);
    } catch (err) {
      toast.error("Failed to load analytics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData, analyticsRefreshKey]);

  const handleExportYear = async () => {
    setExporting(true);
    try {
      const path = await exportYearlyCsv(selectedYear);
      toast.success(`CSV exported to: ${path}`);
    } catch {
      toast.error("CSV export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // Collect all 12 months of statuses + tasks for the year
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      const [allStatuses, tasks] = await Promise.all([
        Promise.all(months.map((m) => getMonthStatuses(selectedYear, m))).then((arrs) => arrs.flat()),
        getTasksByRange(`${selectedYear}-01-01`, `${selectedYear}-12-31`),
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, buildWorkSheet(allStatuses), "Work Status");
      if (tasks.length > 0) XLSX.utils.book_append_sheet(wb, buildTaskSheet(tasks), "Tasks");
      const buf: ArrayBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const bytes = Array.from(new Uint8Array(buf));
      const path = await writeExcelFile(`worklytics_${selectedYear}.xlsx`, bytes);
      toast.success(`Excel exported to: ${path}`);
    } catch (err) {
      toast.error("Excel export failed");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
        <RefreshCw className="h-5 w-5 animate-spin" /> Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Analytics Dashboard</h2>
          <p className="page-subtitle">Insights for {selectedYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="wl-select w-24 text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="ghost" size="sm" onClick={fetchData} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportYear}
            loading={exporting}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            loading={exporting}
            leftIcon={<FileSpreadsheet className="h-3.5 w-3.5" />}
          >
            Excel
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      {summaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Work From Office"
            value={summaryStats.totalWfo}
            subtitle={`${summaryStats.officeWorkPct.toFixed(1)}% of work days`}
            color="text-blue-600"
            bgColor="bg-blue-100"
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatsCard
            title="Work From Home"
            value={summaryStats.totalWfh}
            subtitle={`${summaryStats.remoteWorkPct.toFixed(1)}% remote`}
            color="text-emerald-600"
            bgColor="bg-emerald-100"
            icon={<Home className="h-5 w-5" />}
          />
          <StatsCard
            title="Work From Client"
            value={summaryStats.totalWfc}
            subtitle="Client-side work"
            color="text-violet-600"
            bgColor="bg-violet-100"
            icon={<Building2 className="h-5 w-5" />}
          />
          <StatsCard
            title="Leave Days"
            value={summaryStats.totalLeave}
            subtitle="Approved leaves"
            color="text-amber-600"
            bgColor="bg-amber-100"
            icon={<UmbrellaOff className="h-5 w-5" />}
          />
          <StatsCard
            title="Holidays"
            value={summaryStats.totalHoliday}
            subtitle="Public & custom"
            color="text-red-600"
            bgColor="bg-red-100"
            icon={<PartyPopper className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Progress bar – logged vs total working days */}
      {summaryStats && (
        <div className="wl-card px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Days Logged</span>
            <span className="text-sm text-slate-500">
              {summaryStats.daysLogged} / {summaryStats.totalWorkingDays} working days
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{
                width: `${summaryStats.totalWorkingDays > 0 ? (summaryStats.daysLogged / summaryStats.totalWorkingDays) * 100 : 0}%`,
              }}
            />
          </div>
          {summaryStats.unloggedWorkingDays > 0 && (
            <p className="text-xs text-slate-400 mt-1.5">
              {summaryStats.unloggedWorkingDays} working day(s) not yet marked
            </p>
          )}
        </div>
      )}

      {/* Charts */}
      {yearlyData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly stacked bar */}
          <div className="wl-card px-5 py-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Breakdown — {selectedYear}</h3>
            <MonthlyChart data={yearlyData.months} />
          </div>

          {/* Distribution pie */}
          <div className="wl-card px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Status Distribution</h3>
            {summaryStats && <StatusDistributionChart stats={summaryStats} />}
          </div>
        </div>
      )}

      {/* Yearly trend area chart */}
      {yearlyData && (
        <div className="wl-card px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Work Mode Trend — {selectedYear}</h3>
          <YearlyTrendChart data={yearlyData.months} />
        </div>
      )}

      {/* Month-by-month table */}
      {yearlyData && (
        <div className="wl-card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Monthly Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Month","Working Days","WFO","WFH","WFC","Leave","Holiday","Unset"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yearlyData.months.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{m.monthName}</td>
                    <td className="px-4 py-2.5 text-slate-600">{m.workingDays}</td>
                    <td className="px-4 py-2.5 text-blue-600 font-semibold">{m.wfoCount}</td>
                    <td className="px-4 py-2.5 text-emerald-600 font-semibold">{m.wfhCount}</td>
                    <td className="px-4 py-2.5 text-violet-600 font-semibold">{m.wfcCount}</td>
                    <td className="px-4 py-2.5 text-amber-600 font-semibold">{m.leaveCount}</td>
                    <td className="px-4 py-2.5 text-red-600 font-semibold">{m.holidayCount}</td>
                    <td className="px-4 py-2.5 text-slate-400">{m.unsetCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
