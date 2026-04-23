import { useLocation } from "react-router-dom";
import { format } from "date-fns";

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/":          { title: "Calendar",  subtitle: "Track your daily work status" },
  "/dashboard": { title: "Analytics",subtitle: "Monthly & yearly insights"     },
  "/holidays":  { title: "Holidays",  subtitle: "Manage public & custom holidays" },
  "/leaves":    { title: "Leaves",    subtitle: "Track and manage leave records"  },
  "/settings":  { title: "Settings",  subtitle: "Application preferences"         },
};

export default function Header() {
  const { pathname } = useLocation();
  const meta = ROUTE_TITLES[pathname] ?? ROUTE_TITLES["/"];
  const today = format(new Date(), "EEEE, dd MMMM yyyy");

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 flex-shrink-0">
      <div>
        <h1 className="text-base font-semibold text-slate-900">{meta.title}</h1>
        <p className="text-xs text-slate-500">{meta.subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          {today}
        </span>
      </div>
    </header>
  );
}
