import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { SummaryStats } from "@/types";

interface StatusDistributionChartProps {
  stats: SummaryStats;
}

const SLICES = [
  { key: "totalWfo",     label: "WFO",     color: "#3b82f6" },
  { key: "totalWfh",     label: "WFH",     color: "#10b981" },
  { key: "totalWfc",     label: "WFC",     color: "#8b5cf6" },
  { key: "totalLeave",   label: "Leave",   color: "#f59e0b" },
  { key: "totalHoliday", label: "Holiday", color: "#ef4444" },
] as const;

export default function StatusDistributionChart({ stats }: StatusDistributionChartProps) {
  const data = SLICES.map((s) => ({ name: s.label, value: stats[s.key], color: s.color })).filter(
    (d) => d.value > 0
  );

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          formatter={(val: number) => [`${val} days`, ""]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
