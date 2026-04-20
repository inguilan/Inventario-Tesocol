"use client";
import CloudSync from "@/components/CloudSync";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useState } from "react";

interface DashboardShellProps {
  user?: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <CloudSync />

      {/* Overlay para móvil */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "sidebar-open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Topbar user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-padding" style={{ flex: 1, padding: "28px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
