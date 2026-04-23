import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import CalendarPage from "@/pages/CalendarPage";
import DashboardPage from "@/pages/DashboardPage";
import HolidaysPage from "@/pages/HolidaysPage";
import LeavesPage from "@/pages/LeavesPage";
import SettingsPage from "@/pages/SettingsPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"           element={<CalendarPage />} />
        <Route path="/dashboard"  element={<DashboardPage />} />
        <Route path="/holidays"   element={<HolidaysPage />} />
        <Route path="/leaves"     element={<LeavesPage />} />
        <Route path="/settings"   element={<SettingsPage />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
