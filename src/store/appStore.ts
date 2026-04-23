import { create } from "zustand";
import { currentYear, currentMonth } from "@/utils/dateUtils";

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
}

export const useAppStore = create<AppState>((set, get) => ({
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
}));
