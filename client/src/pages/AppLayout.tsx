import DashboardPage from "@/pages/DashboardPage";
import SpendingPage from "@/pages/SpendingPage";
import IncomePage from "@/pages/IncomePage";
import ProfilePage from "@/pages/ProfilePage";
import { Page } from "@/types/page";
import { useState } from "react";
import Sidebar from "@/ui-components/Sidebar";

// ─── Post-login layout ───────────────────────────────────────────────────────

export default function AppLayout({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [activePage, setActivePage] = useState<Page>("dashboard");

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto">
        {activePage === "dashboard" && <DashboardPage username={username} />}
        {activePage === "spending" && <SpendingPage />}
        {activePage === "income" && <IncomePage />}
        {activePage === "profile" && <ProfilePage />}
      </main>
    </div>
  );
}