import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility: merge Tailwind class names safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
