import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Database } from 'lucide-react';

export const Layout: React.FC = () => {
  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Desktop collapsible state (persisted in localStorage for convenience)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('fleetos_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Save preference on change
  const handleToggleCollapse = () => {
    setIsCollapsed((prev: boolean) => {
      const next = !prev;
      try {
        localStorage.setItem('fleetos_sidebar_collapsed', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut: Ctrl+B or Cmd+B toggles desktop sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (window.innerWidth >= 1024) {
          handleToggleCollapse();
        } else {
          setMobileOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar Navigation (handles both desktop collapsible and mobile drawer) */}
      <Sidebar
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area — Automatically stretches/adjusts with smooth transitions */}
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto transition-all duration-300 ease-in-out">
        {/* Top Operational Notice */}
        <div className="bg-gradient-to-r from-navy-900 via-blue-900 to-navy-900 px-4 py-1.5 text-xs text-blue-200 flex items-center justify-between border-b border-blue-950/60 transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-white">FleetOS Enterprise Cloud</span>
            <span className="hidden sm:inline text-blue-300">•</span>
            <span className="hidden sm:inline">Production Active</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded bg-blue-800/80 px-2 py-0.5 text-[11px] font-mono font-medium text-blue-200 border border-blue-700/50">
              <Database className="h-3 w-3 text-emerald-400" />
              Live Public Edition
            </span>
          </div>
        </div>

        {/* Global Header with Menu Toggle Button */}
        <Header
          onToggleSidebarMobile={() => setMobileOpen(true)}
          onToggleSidebarCollapse={handleToggleCollapse}
          isSidebarCollapsed={isCollapsed}
        />

        {/* Dynamic Page Content Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
