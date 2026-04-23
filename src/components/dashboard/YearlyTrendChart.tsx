import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import type { MonthlyAnalytics } from "@/types";

interface YearlyTrendChartProps {
  data: MonthlyAnalytics[];
}

export default function YearlyTrendChart({ data }: YearlyTrendChartProps) {
  const chartData = data.map((m) => ({
    month: m.monthName.slice(0, 3),
    WFO: m.wfoCount,
    WFH: m.wfhCount,
    WFC: m.wfcCount,
    Leave: m.leaveCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorWFO" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorWFH" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorWFC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="WFO" stroke="#3b82f6" strokeWidth={2} fill="url(#colorWFO)" dot={{ r: 3, fill: "#3b82f6" }} />
        <Area type="monotone" dataKey="WFH" stroke="#10b981" strokeWidth={2} fill="url(#colorWFH)" dot={{ r: 3, fill: "#10b981" }} />
        <Area type="monotone" dataKey="WFC" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorWFC)" dot={{ r: 3, fill: "#8b5cf6" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
