import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';

interface HeaderProps {
  onToggleSidebarMobile: () => void;
  onToggleSidebarCollapse: () => void;
  isSidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebarMobile,
  onToggleSidebarCollapse,
  isSidebarCollapsed,
}) => {
  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      onToggleSidebarCollapse();
    } else {
      onToggleSidebarMobile();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
      {/* Left: Hamburger menu toggle */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={handleMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search: "Search lorry, trip, driver..." */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search lorry, trip, driver..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Notifications & Logged-in User Initials Avatar */}
      <div className="flex items-center gap-4">
        {/* Notification Icon */}
        <button
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User Initials Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-sm">
            SA
          </div>
        </div>
      </div>
    </header>
  );
};
