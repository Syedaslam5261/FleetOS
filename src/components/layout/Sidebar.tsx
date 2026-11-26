import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Fuel,
  Navigation,
  Wrench,
  Receipt,
  BarChart3,
  ShieldCheck,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { LorryService } from '../../services/lorryService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
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
      badgeVariant: 'active',
    },
    {
      name: 'Diesel & Fuel',
      to: '/diesel',
      icon: Fuel,
      badge: 'Priority',
      badgeVariant: undefined,
    },
    {
      name: 'Trips & Deliveries',
      to: '/trips',
      icon: Navigation,
      badge: '4 In-transit',
    },
    {
      name: 'Maintenance',
      to: '/maintenance',
      icon: Wrench,
      badge: '1 Due',
      badgeVariant: 'warning',
    },
    {
      name: 'Expenses & Tolls',
      to: '/expenses',
      icon: Receipt,
      badge: undefined,
    },
    {
      name: 'Analytics & Reports',
      to: '/reports',
      icon: BarChart3,
      badge: undefined,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-[#0b1329] text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white font-mono">FleetOS</span>
                <span className="rounded bg-blue-500/20 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-blue-400">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Logistics & Fleet Cloud</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Fleet Profile Snippet */}
        <div className="mx-3 mt-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
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

        {/* Navigation Links */}
        <div className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Operations
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={clsx(
                        'h-4 w-4 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
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
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom Utility Bar */}
        <div className="border-t border-slate-800/80 p-3 space-y-1">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-300 truncate">Enterprise Security Active</p>
              <p className="text-[10px] text-slate-400">Tenant Isolation Enforced</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-slate-400 px-1">
            <span className="text-[11px]">FleetOS v1.0.0</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">FastAPI Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
};
