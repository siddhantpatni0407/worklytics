interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color: string;   // Tailwind text color class
  bgColor: string; // Tailwind bg color class
  icon: React.ReactNode;
  trend?: { value: number; label: string };
}

export default function StatsCard({ title, value, subtitle, color, bgColor, icon, trend }: StatsCardProps) {
  return (
    <div className="wl-card px-5 py-4 flex items-start gap-4">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${bgColor}`}>
        <span className={color}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
        <p className={`text-2xl font-bold ${color} leading-none mt-0.5`}>{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trend.value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
