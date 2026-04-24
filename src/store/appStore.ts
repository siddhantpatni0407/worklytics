import { create } from "zustand";
import { persist } from "zustand/middleware";
import { currentYear, currentMonth } from "@/utils/dateUtils";
import type { AppSettings, ThemeMode } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

interface AppState {
  // ── Navigation ──────────────────────────────────────────────────────────────
  selectedYear: number;
  selectedMonth: number;  // 1-based
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  navigatePrevMonth: () => void;
  navigateNextMonth: () => void;

  // ── Calendar refresh token (increment to trigger refetch) ─────────────────
  calendarRefreshKey: number;
  triggerCalendarRefresh: () => void;

  // ── Analytics refresh token ────────────────────────────────────────────────
  analyticsRefreshKey: number;
  triggerAnalyticsRefresh: () => void;

  // ── Tasks refresh token ───────────────────────────────────────────────────
  tasksRefreshKey: number;
  triggerTasksRefresh: () => void;

  // ── App Settings ──────────────────────────────────────────────────────────
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // ── Sidebar collapsed state ───────────────────────────────────────────────
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
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
        if (selectedMonth === 1) {
          set({ selectedYear: selectedYear - 1, selectedMonth: 12 });
        } else {
          set({ selectedMonth: selectedMonth - 1 });
        }
      },

      navigateNextMonth: () => {
        const { selectedYear, selectedMonth } = get();
        if (selectedMonth === 12) {
          set({ selectedYear: selectedYear + 1, selectedMonth: 1 });
        } else {
          set({ selectedMonth: selectedMonth + 1 });
        }
      },

      calendarRefreshKey: 0,
      triggerCalendarRefresh: () =>
        set((s) => ({ calendarRefreshKey: s.calendarRefreshKey + 1 })),

      analyticsRefreshKey: 0,
      triggerAnalyticsRefresh: () =>
        set((s) => ({ analyticsRefreshKey: s.analyticsRefreshKey + 1 })),

      tasksRefreshKey: 0,
      triggerTasksRefresh: () =>
        set((s) => ({ tasksRefreshKey: s.tasksRefreshKey + 1 })),

      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),

      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "worklytics-store",
      partialize: (state) => ({
        selectedYear: state.selectedYear,
        selectedMonth: state.selectedMonth,
        settings: state.settings,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
