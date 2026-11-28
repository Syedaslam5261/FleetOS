import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Droplets,
  FileText,
  MapPin,
  MoreVertical,
  Navigation,
  Receipt,
  Truck,
  UserRound,
  Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry, LorryStatus } from '../../types/lorry';
import { TripService } from '../../services/tripService';
import { FuelEstimateService } from '../../services/fuelEstimateService';
import { SavedRouteService } from '../../services/savedRouteService';
import { LorryRecordsService } from '../../services/lorryRecordsService';
import { MaintenanceService } from '../../services/maintenanceService';
import { formatDuration } from '../../services/routingService';
import { formatDate } from '../../utils/formatters';

interface LorryServicesScreenProps {
  lorry: Lorry;
  onBack: () => void;
  onNavigateSection: (section: 'maps' | 'diesel' | 'maintenance' | 'invoices' | 'expenses' | 'driver') => void;
}

const STATUS_PILL: Record<LorryStatus, { bg: string; dot: string; text: string }> = {
  Available: {
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  Active: {
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  'On Trip': {
    bg: 'bg-blue-500/15 border-blue-500/30',
    dot: 'bg-blue-400',
    text: 'text-blue-300',
  },
  Maintenance: {
    bg: 'bg-amber-500/15 border-amber-500/30',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
  },
  Inactive: {
    bg: 'bg-slate-500/15 border-slate-500/30',
    dot: 'bg-slate-400',
    text: 'text-slate-300',
  },
};

const SERVICE_CARDS = [
  {
    key: 'maps' as const,
    title: 'Maps & GPS',
    subtitle: 'Route, live tracking & trip history.',
    icon: MapPin,
    cardBg: 'bg-[#10192d] hover:bg-[#14203a] border-blue-500/20',
    iconBg: 'bg-blue-500/15 text-blue-400',
    arrowColor: 'text-blue-400/80',
  },
  {
    key: 'diesel' as const,
    title: 'Diesel Management',
    subtitle: 'Fuel, receipts & reports.',
    icon: Droplets,
    cardBg: 'bg-[#1a1811] hover:bg-[#221f15] border-amber-500/20',
    iconBg: 'bg-amber-400/15 text-amber-300',
    arrowColor: 'text-amber-300/80',
  },
  {
    key: 'maintenance' as const,
    title: 'Maintenance',
    subtitle: 'Service, repairs & insurance.',
    icon: Wrench,
    cardBg: 'bg-[#171324] hover:bg-[#1f1930] border-purple-500/20',
    iconBg: 'bg-purple-500/15 text-purple-300',
    arrowColor: 'text-purple-300/80',
  },
  {
    key: 'invoices' as const,
    title: 'Invoices',
    subtitle: 'Create invoices, payments & P&L.',
    icon: FileText,
    cardBg: 'bg-[#0f1c19] hover:bg-[#132420] border-emerald-500/20',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
    arrowColor: 'text-emerald-400/80',
  },
] as const;

export const LorryServicesScreen: React.FC<LorryServicesScreenProps> = ({
  lorry,
  onBack,
  onNavigateSection,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u1 = FuelEstimateService.subscribe(() => setTick((t) => t + 1));
    const u2 = SavedRouteService.subscribe(() => setTick((t) => t + 1));
    const u3 = MaintenanceService.subscribe(() => setTick((t) => t + 1));
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Strictly lorry-scoped existing data (never inventing or hardcoding trip data)
  const activeTrip = useMemo(
    () => TripService.getByLorryId(lorry.id).find((t) => t.status === 'In Transit') ?? null,
    [lorry.id]
  );

  const savedRoute = useMemo(
    () => SavedRouteService.getByLorryId(lorry.id)[0] ?? null,
    [lorry.id, tick]
  );

  const locationReport = useMemo(
    () => LorryRecordsService.getLocationReport(lorry.id) ?? null,
    [lorry.id]
  );

  const latestEstimate = useMemo(
    () => FuelEstimateService.getByLorryId(lorry.id)[0] ?? null,
    [lorry.id, tick]
  );

  const openProblems = useMemo(
    () => MaintenanceService.getProblems(lorry.id).filter((p) => p.status !== 'Completed'),
    [lorry.id, tick]
  );

  const statusStyle = STATUS_PILL[lorry.status];

  const validDistanceKm = savedRoute?.distanceKm ?? latestEstimate?.totalDistanceKm ?? null;
  const validEtaText = savedRoute
    ? `Est. ${formatDuration(savedRoute.durationSeconds)}`
    : activeTrip && locationReport?.route?.eta
      ? formatDate(locationReport.route.eta)
      : null;

  return (
    <div className="min-h-screen w-full bg-[#060911] text-white font-sans">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] md:max-w-[560px] flex-col px-4 pb-10">
        {/* Top Mobile Header */}
        <header
          ref={menuRef}
          className="sticky top-0 z-30 flex items-center justify-between gap-2 bg-[#060911]/95 py-4 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to My Lorries"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#111827] text-slate-200 transition-colors hover:bg-[#1a2438]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Truck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-bold leading-tight text-white">
                  FleetOS
                </p>
                <p className="truncate text-[11px] font-medium text-slate-400">
                  Lorry Services
                </p>
              </div>
            </div>
          </div>

          {/* Right: Notification Icon & More Options Menu */}
          <div className="relative flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                setMenuOpen(false);
              }}
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#111827] text-slate-300 transition-colors hover:bg-[#1a2438] hover:text-white"
            >
              <Bell className="h-4 w-4" />
              {openProblems.length > 0 && (
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen((v) => !v);
                setNotifOpen(false);
              }}
              aria-label="More options"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#111827] text-slate-300 transition-colors hover:bg-[#1a2438] hover:text-white"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Notifications Popover */}
            {notifOpen && (
              <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-white/10 bg-[#111827] p-3.5 shadow-xl">
                <p className="text-xs font-bold text-white">
                  Alerts · {lorry.registrationNumber}
                </p>
                {openProblems.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">
                    No open maintenance alerts for this lorry.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {openProblems.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          onNavigateSection('maintenance');
                        }}
                        className="w-full rounded-xl bg-white/5 p-2.5 text-left text-xs hover:bg-white/10"
                      >
                        <p className="font-semibold text-amber-300">{p.problemType}</p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                          {p.location} · {p.status}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* More Options Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#111827] py-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigateSection('expenses');
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-white/5"
                >
                  <Receipt className="h-4 w-4 text-emerald-400" />
                  Expenses &amp; Trip P&amp;L
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigateSection('driver');
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-white/5"
                >
                  <UserRound className="h-4 w-4 text-blue-400" />
                  Driver Details
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onBack();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to My Lorries
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-5 pt-1">
          {/* Selected Lorry Information Card */}
          <section className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 shadow-sm">
            <div className="flex items-start gap-3.5">
              {/* Crisp Lorry Illustration */}
              <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#172138] p-2">
                <svg
                  viewBox="0 0 80 48"
                  className="h-full w-full"
                  fill="none"
                  aria-label={`${lorry.manufacturer} ${lorry.model}`}
                >
                  <rect x="4" y="10" width="44" height="24" rx="3" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1.5" />
                  <path d="M48 16H62L70 24V34H48V16Z" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M52 19H60.5L65.5 24H52V19Z" fill="#0f172a" />
                  <rect x="2" y="34" width="72" height="3" rx="1.5" fill="#475569" />
                  <circle cx="18" cy="39" r="5.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                  <circle cx="34" cy="39" r="5.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                  <circle cx="60" cy="39" r="5.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                </svg>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="truncate font-mono text-base font-bold tracking-wide text-white">
                    {lorry.registrationNumber}
                  </h1>
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                      statusStyle.bg,
                      statusStyle.text
                    )}
                  >
                    <span className={clsx('h-1.5 w-1.5 rounded-full', statusStyle.dot)} />
                    {lorry.status}
                  </span>
                </div>

                <p className="truncate text-xs font-medium text-slate-300">
                  {lorry.manufacturer} {lorry.model}
                </p>
                <p className="text-[11px] text-slate-400">
                  {lorry.vehicleType} · {lorry.loadCapacityTonnes} Tonnes · {lorry.numberOfTyres} Tyres
                </p>
              </div>
            </div>

            {/* Conditional Active Trip & Genuine Estimate Details (Only shown when real/linked records exist) */}
            {(activeTrip || validDistanceKm !== null || latestEstimate !== null) && (
              <div className="mt-4 space-y-2.5 border-t border-white/10 pt-3.5">
                {activeTrip && (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Navigation className="h-3.5 w-3.5 flex-shrink-0 text-blue-400" />
                      <span className="truncate font-semibold text-white">
                        {activeTrip.startLocation} → {activeTrip.destination}
                      </span>
                    </div>
                    <span className="flex-shrink-0 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-300">
                      {activeTrip.id} · DEMO
                    </span>
                  </div>
                )}

                {(validDistanceKm !== null || validEtaText || latestEstimate) && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {validDistanceKm !== null && (
                      <div className="rounded-xl bg-white/5 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase text-slate-400">Distance</p>
                        <p className="mt-0.5 font-mono text-xs font-bold text-white">
                          {validDistanceKm.toLocaleString('en-IN')} km
                        </p>
                      </div>
                    )}
                    {validEtaText && (
                      <div className="rounded-xl bg-white/5 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase text-slate-400">ETA</p>
                        <p className="mt-0.5 truncate font-mono text-xs font-bold text-white">
                          {validEtaText}
                        </p>
                      </div>
                    )}
                    {latestEstimate && (
                      <div className="rounded-xl bg-white/5 px-3 py-2">
                        <p className="text-[10px] font-medium uppercase text-slate-400">Est. Diesel</p>
                        <p className="mt-0.5 font-mono text-xs font-bold text-amber-300">
                          {latestEstimate.totalDieselLitres} L
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Four Main Service Cards — Strictly 2x2 Grid */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Services
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {SERVICE_CARDS.map(({ key, title, subtitle, icon: Icon, cardBg, iconBg, arrowColor }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onNavigateSection(key)}
                  className={clsx(
                    'group flex min-h-[148px] w-full flex-col justify-between rounded-2xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                    cardBg
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div
                      className={clsx(
                        'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
                        iconBg
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <ChevronRight
                      className={clsx(
                        'mt-1 h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5',
                        arrowColor
                      )}
                    />
                  </div>

                  <div className="mt-4 space-y-1">
                    <h3 className="text-sm font-bold leading-snug text-white">{title}</h3>
                    <p className="text-[11px] leading-relaxed text-slate-400">{subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
