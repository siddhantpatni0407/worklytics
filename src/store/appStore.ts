import { create } from "zustand";
import { persist } from "zustand/middleware";
import { currentYear, currentMonth } from "@/utils/dateUtils";
import type { AppSettings, TaskViewMode, ThemeAccentColor, UserProfile } from "@/types";
import { DEFAULT_SETTINGS, DEFAULT_PROFILE } from "@/types";

export const ACCENT_COLORS: Record<ThemeAccentColor, Record<string, string>> = {
  indigo:  { "50":"#eef2ff","100":"#e0e7ff","200":"#c7d2fe","300":"#a5b4fc","400":"#818cf8","500":"#6366f1","600":"#4f46e5","700":"#4338ca","800":"#3730a3","900":"#312e81" },
  blue:    { "50":"#eff6ff","100":"#dbeafe","200":"#bfdbfe","300":"#93c5fd","400":"#60a5fa","500":"#3b82f6","600":"#2563eb","700":"#1d4ed8","800":"#1e40af","900":"#1e3a8a" },
  violet:  { "50":"#f5f3ff","100":"#ede9fe","200":"#ddd6fe","300":"#c4b5fd","400":"#a78bfa","500":"#8b5cf6","600":"#7c3aed","700":"#6d28d9","800":"#5b21b6","900":"#4c1d95" },
  emerald: { "50":"#ecfdf5","100":"#d1fae5","200":"#a7f3d0","300":"#6ee7b7","400":"#34d399","500":"#10b981","600":"#059669","700":"#047857","800":"#065f46","900":"#064e3b" },
  rose:    { "50":"#fff1f2","100":"#ffe4e6","200":"#fecdd3","300":"#fda4af","400":"#fb7185","500":"#f43f5e","600":"#e11d48","700":"#be123c","800":"#9f1239","900":"#881337" },
  amber:   { "50":"#fffbeb","100":"#fef3c7","200":"#fde68a","300":"#fcd34d","400":"#fbbf24","500":"#f59e0b","600":"#d97706","700":"#b45309","800":"#92400e","900":"#78350f" },
};

export function applyAccentColor(color: ThemeAccentColor) {
  const palette = ACCENT_COLORS[color] ?? ACCENT_COLORS.indigo;
  const root = document.documentElement;
  Object.entries(palette).forEach(([shade, value]) => {
    root.style.setProperty(`--accent-${shade}`, value);
  });
}

interface AppState {
  selectedYear: number;
  selectedMonth: number;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  navigatePrevMonth: () => void;
  navigateNextMonth: () => void;
  calendarRefreshKey: number;
  triggerCalendarRefresh: () => void;
  analyticsRefreshKey: number;
  triggerAnalyticsRefresh: () => void;
  tasksRefreshKey: number;
  triggerTasksRefresh: () => void;
  taskViewMode: TaskViewMode;
  setTaskViewMode: (mode: TaskViewMode) => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  profile: UserProfile;
  updateProfile: (partial: Partial<UserProfile>) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedYear: currentYear(),
      selectedMonth: currentMonth(),
      setSelectedYear: (year) => set({ selectedYear: year }),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      navigatePrevMonth: () => {
        const { selectedYear, selectedMonth } = get();
        if (selectedMonth === 1) set({ selectedYear: selectedYear - 1, selectedMonth: 12 });
        else set({ selectedMonth: selectedMonth - 1 });
      },
      navigateNextMonth: () => {
        const { selectedYear, selectedMonth } = get();
        if (selectedMonth === 12) set({ selectedYear: selectedYear + 1, selectedMonth: 1 });
        else set({ selectedMonth: selectedMonth + 1 });
      },
      calendarRefreshKey: 0,
      triggerCalendarRefresh: () => set((s) => ({ calendarRefreshKey: s.calendarRefreshKey + 1 })),
      analyticsRefreshKey: 0,
      triggerAnalyticsRefresh: () => set((s) => ({ analyticsRefreshKey: s.analyticsRefreshKey + 1 })),
      tasksRefreshKey: 0,
      triggerTasksRefresh: () => set((s) => ({ tasksRefreshKey: s.tasksRefreshKey + 1 })),
      taskViewMode: "list",
      setTaskViewMode: (mode) => set({ taskViewMode: mode }),
      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
      profile: DEFAULT_PROFILE,
      updateProfile: (partial) => set((s) => ({
        profile: {
          ...s.profile,
          ...partial,
          avatarInitials: computeInitials((partial.name ?? s.profile.name)),
        },
      })),
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "worklytics-store",
      partialize: (state) => ({
        selectedYear: state.selectedYear,
        selectedMonth: state.selectedMonth,
        settings: state.settings,
        profile: state.profile,
        sidebarCollapsed: state.sidebarCollapsed,
        taskViewMode: state.taskViewMode,
      }),
    }
  )
);
