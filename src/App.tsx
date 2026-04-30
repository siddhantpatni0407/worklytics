import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import CalendarPage from "@/pages/CalendarPage";
import DashboardPage from "@/pages/DashboardPage";
import HolidaysPage from "@/pages/HolidaysPage";
import LeavesPage from "@/pages/LeavesPage";
import NotesPage from "@/pages/NotesPage";
import SettingsPage from "@/pages/SettingsPage";
import TasksPage from "@/pages/TasksPage";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ProfilePage from "@/pages/ProfilePage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/home"       element={<HomePage />} />
        <Route path="/"           element={<CalendarPage />} />
        <Route path="/dashboard"  element={<DashboardPage />} />
        <Route path="/holidays"   element={<HolidaysPage />} />
        <Route path="/leaves"     element={<LeavesPage />} />
        <Route path="/tasks"      element={<TasksPage />} />
        <Route path="/notes"      element={<NotesPage />} />
        <Route path="/settings"   element={<SettingsPage />} />
        <Route path="/about"      element={<AboutPage />} />
        <Route path="/profile"    element={<ProfilePage />} />
        <Route path="*"           element={<Navigate to="/home" replace />} />
      </Routes>
    </Layout>
  );
}
