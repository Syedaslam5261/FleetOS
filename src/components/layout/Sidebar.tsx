import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Navigation,
  Fuel,
  Wrench,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  // Exact 8 navigation items from reference
  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Lorry Management', to: '/fleet', icon: Truck },
    { name: 'Trips', to: '/trips', icon: Navigation },
    { name: 'Diesel', to: '/diesel', icon: Fuel },
    { name: 'Maintenance', to: '/maintenance', icon: Wrench },
    { name: 'Expenses', to: '/expenses', icon: Receipt },
    { name: 'Reports', to: '/reports', icon: BarChart3 },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Dark Navy Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0b1329] text-slate-300 transition-all duration-300 ease-in-out lg:static',
          isMobileOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        )}
      >
        {/* Brand Header */}
        <div
          className={clsx(
            'flex h-16 items-center border-b border-slate-800/80 px-4 transition-all duration-300',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
              <Truck className="h-5 w-5" />
            </div>

            <div
              className={clsx(
                'transition-opacity duration-200 whitespace-nowrap',
                isCollapsed ? 'lg:hidden' : 'block'
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white font-mono">FleetOS</span>
                <span className="rounded bg-blue-500/20 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-blue-400">
                  Pro
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.name} className="relative group">
              <NavLink
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) onCloseMobile();
                }}
                className={({ isActive }) =>
                  clsx(
                    'relative flex items-center rounded-xl text-xs font-medium transition-all duration-150',
                    isCollapsed
                      ? 'lg:h-11 lg:w-11 lg:mx-auto lg:justify-center p-2.5'
                      : 'px-3.5 py-2.5 gap-3',
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={clsx(
                        'h-4 w-4 flex-shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    <span
                      className={clsx(
                        'truncate transition-opacity duration-200',
                        isCollapsed ? 'lg:hidden' : 'block'
                      )}
                    >
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>

              {/* Tooltip on Collapsed Desktop */}
              {isCollapsed && (
                <div className="hidden lg:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-2xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                  <span>{item.name}</span>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:block px-3 py-2 border-t border-slate-800/80">
          <button
            onClick={onToggleCollapse}
            className={clsx(
              'w-full flex items-center rounded-xl p-2 text-xs text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="flex items-center gap-2">
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {!isCollapsed && <span className="font-medium">Collapse</span>}
            </div>
          </button>
        </div>

        {/* User Profile at Bottom — Initials, User Name, Fleet Owner role */}
        <div className="border-t border-slate-800/80 p-3">
          <div
            className={clsx(
              'flex items-center rounded-xl p-1.5 transition-colors',
              isCollapsed ? 'justify-center' : 'gap-3'
            )}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs ring-2 ring-blue-400/30">
              SA
            </div>
            <div className={clsx('min-w-0 flex-1', isCollapsed ? 'lg:hidden' : 'block')}>
              <p className="text-xs font-semibold text-white truncate">Syed Aslam</p>
              <p className="text-[11px] text-slate-400 truncate">Fleet Owner</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
