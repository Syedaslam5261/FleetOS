import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Truck,
  Fuel,
  Navigation,
  Wrench,
  Receipt,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { LorryService } from '../../services/lorryService';

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
  const [lorryCount, setLorryCount] = useState(() => LorryService.getAllLorries().length);

  useEffect(() => {
    const unsub = LorryService.subscribe(() => {
      setLorryCount(LorryService.getAllLorries().length);
    });
    return unsub;
  }, []);

  const navItems = [
    {
      name: 'Lorry Management',
      to: '/fleet',
      icon: Truck,
      badge: `${lorryCount} Total`,
      badgeVariant: 'active' as const,
      description: 'Fleet Registry & Roster',
    },
    {
      name: 'Diesel & Fuel',
      to: '/diesel',
      icon: Fuel,
      badge: 'Priority',
      badgeVariant: undefined,
      description: 'Consumption & Mileage Control',
    },
    {
      name: 'Trips & Deliveries',
      to: '/trips',
      icon: Navigation,
      badge: '4 In-transit',
      badgeVariant: undefined,
      description: 'Consignments & e-Way Bills',
    },
    {
      name: 'Maintenance',
      to: '/maintenance',
      icon: Wrench,
      badge: '1 Due',
      badgeVariant: 'warning' as const,
      description: 'Service Logs & Job Cards',
    },
    {
      name: 'Expenses & Tolls',
      to: '/expenses',
      icon: Receipt,
      badge: undefined,
      badgeVariant: undefined,
      description: 'FASTag Tolls & Allowances',
    },
    {
      name: 'Analytics & Reports',
      to: '/reports',
      icon: BarChart3,
      badge: undefined,
      badgeVariant: undefined,
      description: 'P&L and Fleet Performance',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0b1329] text-slate-300 transition-all duration-300 ease-in-out lg:static',
          // Mobile drawer slide-in / slide-out
          isMobileOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full lg:translate-x-0',
          // Desktop width states
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

            {/* Title & Tag (hidden in collapsed desktop state) */}
            <div
              className={clsx(
                'transition-opacity duration-200 whitespace-nowrap',
                isCollapsed ? 'lg:hidden' : 'block'
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white font-mono">FleetOS</span>
                <span className="rounded bg-blue-500/20 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-blue-400">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Logistics & Fleet Cloud</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
            title="Close mobile drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fleet Operator Snippet (Expanded only) */}
        {!isCollapsed && (
          <div className="mx-3 mt-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 transition-opacity duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Operator</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Apex Freightways India</p>
                <p className="text-[11px] text-slate-400">{lorryCount} Lorries • Mumbai HQ</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed Status Dot (Collapsed desktop only) */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center mt-3 relative group">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white shadow-xl border border-slate-700 whitespace-nowrap z-50 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
              <p className="font-semibold text-emerald-400">Apex Freightways (Online)</p>
              <p className="text-[10px] text-slate-400">{lorryCount} Vehicles Registered</p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="mt-4 flex-1 space-y-1 px-2.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Operations
            </div>
          )}

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
                    // Sizing based on collapsed/expanded state
                    isCollapsed
                      ? 'lg:h-11 lg:w-11 lg:mx-auto lg:justify-center p-2.5'
                      : 'justify-between px-3 py-2.5',
                    // Active highlighting
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon
                        className={clsx(
                          'h-5 w-5 flex-shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                      {/* Nav item label */}
                      <span
                        className={clsx(
                          'truncate transition-opacity duration-200',
                          isCollapsed ? 'lg:hidden' : 'block'
                        )}
                      >
                        {item.name}
                      </span>
                    </div>

                    {/* Nav Badge in Expanded state */}
                    {item.badge && (
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0',
                          isCollapsed ? 'lg:hidden' : 'block',
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeVariant === 'warning'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-900/60 text-blue-300'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed dot badge if badge exists */}
                    {isCollapsed && item.badge && !isActive && (
                      <span
                        className={clsx(
                          'hidden lg:block absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full',
                          item.badgeVariant === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                        )}
                      />
                    )}
                  </>
                )}
              </NavLink>

              {/* Floating Tooltip when Collapsed (Desktop only) */}
              {isCollapsed && (
                <div
                  className="hidden lg:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-2xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 transform scale-95 group-hover:scale-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">{item.name}</span>
                    {item.badge && (
                      <span
                        className={clsx(
                          'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                          item.badgeVariant === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.description}</p>
                  )}
                  {/* Tooltip Arrow */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Collapse / Expand Toggle Button at Bottom of Sidebar */}
        <div className="hidden lg:block px-2.5 py-2 border-t border-slate-800/80">
          <button
            onClick={onToggleCollapse}
            className={clsx(
              'w-full flex items-center rounded-xl p-2.5 text-xs text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="flex items-center gap-2.5">
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              {!isCollapsed && <span className="font-medium">Collapse Sidebar</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                ⌘B
              </span>
            )}
          </button>
        </div>

        {/* Bottom Utility Bar */}
        <div className="border-t border-slate-800/80 p-3 space-y-1">
          <div
            className={clsx(
              'flex items-center rounded-lg p-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer relative group',
              isCollapsed ? 'justify-center' : 'gap-2'
            )}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div className={clsx('flex-1 min-w-0', isCollapsed ? 'lg:hidden' : 'block')}>
              <p className="text-[11px] font-medium text-slate-300 truncate">Enterprise Security Active</p>
              <p className="text-[10px] text-slate-400">Tenant Isolation Enforced</p>
            </div>

            {/* Collapsed Tooltip for Security */}
            {isCollapsed && (
              <div className="hidden lg:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-2xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                <p className="font-semibold text-emerald-400">Enterprise Security Active</p>
                <p className="text-[10px] text-slate-400">Tenant Isolation Enforced</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center justify-between pt-1 text-slate-400 px-1 text-[11px]">
              <span>FleetOS v1.0.0</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">FastAPI Ready</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
