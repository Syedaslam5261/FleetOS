import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Database, Sparkles } from 'lucide-react';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top Operational Notice: Clear Demo Mode & FastAPI API compatibility */}
        <div className="bg-gradient-to-r from-navy-900 via-blue-900 to-navy-900 px-4 py-1.5 text-xs text-blue-200 flex items-center justify-between border-b border-blue-950/60">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-white">FleetOS Core Engine</span>
            <span className="hidden sm:inline text-blue-300">•</span>
            <span className="hidden sm:inline">Module: Diesel Management System</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded bg-blue-800/80 px-2 py-0.5 text-[11px] font-mono font-medium text-blue-200 border border-blue-700/50">
              <Database className="h-3 w-3 text-emerald-400" />
              Demo Data Loaded (Ready for FastAPI v1)
            </span>
          </div>
        </div>

        {/* Global Header */}
        <Header onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
