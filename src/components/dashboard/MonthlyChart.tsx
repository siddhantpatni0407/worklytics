import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import type { MonthlyAnalytics } from "@/types";

interface MonthlyChartProps {
  data: MonthlyAnalytics[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map((m) => ({
    name: m.monthName.slice(0, 3),
    WFO:     m.wfoCount,
    WFH:     m.wfhCount,
    WFC:     m.wfcCount,
    Leave:   m.leaveCount,
    Holiday: m.holidayCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)" }}
          cursor={{ fill: "#f8fafc" }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="WFO"     stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
        <Bar dataKey="WFH"     stackId="a" fill="#10b981" radius={[0,0,0,0]} />
        <Bar dataKey="WFC"     stackId="a" fill="#8b5cf6" radius={[0,0,0,0]} />
        <Bar dataKey="Leave"   stackId="a" fill="#f59e0b" radius={[0,0,0,0]} />
        <Bar dataKey="Holiday" stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
