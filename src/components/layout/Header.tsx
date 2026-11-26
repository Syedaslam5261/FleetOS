import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';

const PAGE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: '/fleet', title: 'Lorry Management' },
  { prefix: '/diesel', title: 'Diesel Management' },
  { prefix: '/trips', title: 'Trips' },
  { prefix: '/maintenance', title: 'Maintenance' },
  { prefix: '/expenses', title: 'Expenses' },
  { prefix: '/reports', title: 'Reports' },
  { prefix: '/settings', title: 'Settings' },
];

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const match = PAGE_TITLES.find((p) => location.pathname.startsWith(p.prefix));
  const pageTitle = match ? match.title : 'Lorry Management';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: FleetOS Logo + Relevant Page Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/fleet')}
            className="flex items-center gap-2.5 flex-shrink-0 focus:outline-none"
            title="FleetOS — Lorry Management"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-sm">
              <Truck className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-base font-bold tracking-tight text-[#0b1329]">FleetOS</span>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                Pro
              </span>
            </div>
          </button>

          <span className="h-6 w-px bg-slate-200 flex-shrink-0" aria-hidden="true" />
          <h1 className="truncate text-sm font-semibold text-slate-800 sm:text-base">{pageTitle}</h1>
        </div>

        {/* Right: Logged-in Fleet Owner Avatar */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-800 leading-tight">Syed Aslam</p>
            <p className="text-[11px] text-slate-500 leading-tight">Fleet Owner</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
            SA
          </div>
        </div>
      </div>
    </header>
  );
};
