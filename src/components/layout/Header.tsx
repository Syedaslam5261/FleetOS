import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Shield,
  Layers,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface HeaderProps {
  onToggleSidebar: () => void;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  pageTitle,
  pageSubtitle,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  // Dynamic route context
  let resolvedTitle = pageTitle;
  let resolvedSubtitle = pageSubtitle;
  let moduleBadge = 'Module';

  if (!resolvedTitle) {
    if (location.pathname.startsWith('/fleet')) {
      resolvedTitle = 'Lorry Management';
      resolvedSubtitle = 'Manage and monitor all registered vehicles in your fleet';
      moduleBadge = 'Vehicles';
    } else if (location.pathname.startsWith('/diesel')) {
      resolvedTitle = 'Diesel & Fuel Management';
      resolvedSubtitle = 'Monitor fleet fuel expenses, full-tank verification, mileage and cost per km';
      moduleBadge = 'Fuel Control';
    } else {
      resolvedTitle = 'FleetOS Operations';
      resolvedSubtitle = 'Logistics & Fleet Management Platform';
      moduleBadge = 'Operations';
    }
  }

  // Realistic formatted Indian date
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 lg:px-8">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3 lg:gap-4 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900 truncate">
              {resolvedTitle}
            </h1>
            <Badge variant="info" size="sm" className="hidden sm:inline-flex">
              {moduleBadge}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 truncate hidden md:block">
            {resolvedSubtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Date Display */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-700">{todayFormatted}</span>
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden sm:block w-48 md:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search truck, trip, owner..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Fleet alerts & notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white p-3 shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-900">Fleet Alerts (2)</span>
                <span className="text-[10px] text-blue-600 font-medium cursor-pointer" onClick={() => setShowNotifications(false)}>Mark read</span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="rounded-lg bg-amber-50/80 p-2 text-xs border border-amber-200/50">
                  <p className="font-semibold text-amber-900">Scheduled Service: KA 04 D 7712</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">Under maintenance at Peenya workshop for hub service.</p>
                </div>
                <div className="rounded-lg bg-blue-50/80 p-2 text-xs border border-blue-200/50">
                  <p className="font-semibold text-blue-900">Document Renewal Reminder</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">Insurance policy for NL 01 AA 6512 valid until April 2027.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User / Operator Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1.5 pl-2 pr-2.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white font-semibold text-xs">
              FL
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">Syed Aslam</p>
              <p className="text-[10px] text-slate-500 leading-tight">Fleet Owner • Apex</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white p-2 shadow-xl border border-slate-200 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">Syed Aslam</p>
                <p className="text-[11px] text-slate-500">fleet.owner@apexlogistics.in</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Tenant Isolated: APEX-IN-402
                </div>
              </div>
              <div className="py-1 text-xs text-slate-700">
                <button 
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2"
                >
                  <Shield className="h-3.5 w-3.5 text-slate-500" /> Role: Fleet Owner (Admin)
                </button>
                <button 
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2"
                >
                  <Layers className="h-3.5 w-3.5 text-slate-500" /> Switch Operating Unit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
