"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      {/* Mobile top bar with hamburger */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-sidebar border-b border-slate-800 flex items-center px-4">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-white hover:bg-slate-800 rounded-lg"
          aria-label="Otvori izbornik"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>
      <main className="pl-0 lg:pl-[260px] pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
