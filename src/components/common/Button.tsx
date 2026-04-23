import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_CLASSES = {
  primary:   "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 border border-brand-600",
  secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 focus-visible:ring-brand-500",
  ghost:     "bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent focus-visible:ring-brand-500",
  danger:    "bg-red-600 text-white hover:bg-red-700 border border-red-600 focus-visible:ring-red-500",
  success:   "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 focus-visible:ring-emerald-500",
};

const SIZE_CLASSES = {
  sm:  "h-8  px-3 text-xs gap-1.5",
  md:  "h-9  px-4 text-sm gap-2",
  lg:  "h-10 px-5 text-sm gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
