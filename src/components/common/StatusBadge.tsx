import { cn } from "@/utils/cn";
import type { EffectiveStatus } from "@/types";
import { STATUS_META } from "@/types";

interface StatusBadgeProps {
  status: EffectiveStatus;
  size?: "xs" | "sm" | "md";
  showDot?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  xs: "text-[10px] px-1.5 py-0.5",
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
};

export default function StatusBadge({
  status,
  size = "sm",
  showDot = true,
  className,
}: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "status-pill font-semibold",
        meta.bg,
        meta.text,
        SIZE_CLASSES[size],
        className
      )}
    >
      {showDot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: meta.color }}
        />
      )}
      {meta.label}
    </span>
  );
}
