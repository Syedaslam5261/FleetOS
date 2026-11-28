import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  Fuel,
  MoreHorizontal,
  Receipt,
  Route,
  Truck,
  UserRound,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry, LorryStatus } from '../../types/lorry';
import { TripService } from '../../services/tripService';
import { FuelEstimateService } from '../../services/fuelEstimateService';
import { SavedRouteService } from '../../services/savedRouteService';
import { LorryRecordsService } from '../../services/lorryRecordsService';
import { MaintenanceService } from '../../services/maintenanceService';
import { formatDuration } from '../../services/routingService';
import { ServiceSectionSheet, SheetSectionKey } from './ServiceSectionSheet';

interface LorryServicesScreenProps {
  lorry: Lorry;
  onBack: () => void;
  /** Navigates to `/fleet/${lorry.id}${relativePath}` */
  onNavigatePath: (relativePath: string) => void;
}

const STATUS_PILL: Record<LorryStatus, { bg: string; dot: string; text: string }> = {
  'On Trip': {
    bg: 'bg-[#125634]/90 border-emerald-400/25',
    dot: 'bg-[#34eb7a]',
    text: 'text-white',
  },
  Active: {
    bg: 'bg-[#125634]/90 border-emerald-400/25',
    dot: 'bg-[#34eb7a]',
    text: 'text-white',
  },
  Available: {
    bg: 'bg-[#125634]/90 border-emerald-400/25',
    dot: 'bg-[#34eb7a]',
    text: 'text-white',
  },
  Maintenance: {
    bg: 'bg-amber-600/35 border-amber-400/30',
    dot: 'bg-amber-400',
    text: 'text-amber-100',
  },
  Inactive: {
    bg: 'bg-slate-700/60 border-slate-500/30',
    dot: 'bg-slate-400',
    text: 'text-slate-200',
  },
};

/* Glossy 3D-style icons matching the approved reference */
const MapsPin3DIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14 drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]" fill="none">
    <defs>
      <linearGradient id="mLeft" x1="6" y1="30" x2="28" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#85c8ff" />
        <stop offset="1" stopColor="#2a79db" />
      </linearGradient>
      <linearGradient id="mMid" x1="22" y1="32" x2="42" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#5aa9f8" />
        <stop offset="1" stopColor="#1e5eb8" />
      </linearGradient>
      <linearGradient id="pBody" x1="22" y1="6" x2="44" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#93d5ff" />
        <stop offset="0.55" stopColor="#2b85f5" />
        <stop offset="1" stopColor="#144eb0" />
      </linearGradient>
    </defs>
    <path d="M8 50L16 33L26 37L22 54L8 50Z" fill="url(#mLeft)" />
    <path d="M26 37L39 33L41 50L22 54L26 37Z" fill="url(#mMid)" />
    <path d="M39 33L52 36L56 52L41 50L39 33Z" fill="url(#mLeft)" />
    <path
      d="M32 6C23.7 6 17 12.6 17 20.8C17 31.3 32 45 32 45C32 45 47 31.3 47 20.8C47 12.6 40.3 6 32 6Z"
      fill="url(#pBody)"
    />
    <circle cx="32" cy="20.5" r="6" fill="#0d254d" />
  </svg>
);

const DieselNozzle3DIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14 drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]" fill="none">
    <defs>
      <linearGradient id="nGold" x1="20" y1="12" x2="58" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffe15c" />
        <stop offset="0.5" stopColor="#f5b31a" />
        <stop offset="1" stopColor="#b57106" />
      </linearGradient>
      <linearGradient id="dGold" x1="12" y1="26" x2="22" y2="46" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff099" />
        <stop offset="0.6" stopColor="#f7ba1e" />
        <stop offset="1" stopColor="#c47f08" />
      </linearGradient>
    </defs>
    <path
      d="M17 26C17 26 10 35.5 10 40.2C10 44.1 13.1 47 17 47C20.9 47 24 44.1 24 40.2C24 35.5 17 26 17 26Z"
      fill="url(#dGold)"
    />
    <ellipse cx="14.5" cy="39" rx="1.6" ry="3.2" fill="#fff7cc" opacity="0.7" />
    <path d="M18 22L31 15L34 20L21 26L18 22Z" fill="#cbd5e1" />
    <path
      d="M30 14L44 12C47.5 11.6 50.8 14 51.4 17.5L55 38L44 41L41 28L34 29L30 14Z"
      fill="url(#nGold)"
    />
    <path
      d="M36 28L40 43L52 40"
      stroke="#d9930e"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M40 31L45 36" stroke="#1e1b16" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const MaintenanceTools3DIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14 drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]" fill="none">
    <defs>
      <linearGradient id="mSilver" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="0.55" stopColor="#cbd5e1" />
        <stop offset="1" stopColor="#64748b" />
      </linearGradient>
    </defs>
    <path
      d="M17.5 12C14.5 12.8 12.2 15.2 11.6 18.3C10.9 21.8 12.2 25.3 14.8 27.3L43.5 53.5C45.3 55.2 48.1 55.1 49.8 53.4L52.2 51C53.9 49.3 54 46.5 52.3 44.7L26.1 16C24.2 13.7 21.2 12.5 18.2 13.1L22.5 17.4L19.5 22.5L14.4 20.5L17.5 12Z"
      fill="url(#mSilver)"
    />
    <path d="M47 11L53 17L45 25L39 19L47 11Z" fill="#94a3b8" />
    <path d="M41 21L16 46L13 51L18 48L43 23L41 21Z" fill="#e2e8f0" />
    <path d="M46 12L52 18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const InvoicePaper3DIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14 drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]" fill="none">
    <defs>
      <linearGradient id="iPaper" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#e6fff3" />
        <stop offset="0.55" stopColor="#9ce8c4" />
        <stop offset="1" stopColor="#5ec497" />
      </linearGradient>
    </defs>
    <g transform="rotate(-11 32 32)">
      <rect x="13" y="8" width="38" height="48" rx="5" fill="url(#iPaper)" />
      <text
        x="32"
        y="22"
        textAnchor="middle"
        fill="#0b3d28"
        fontSize="7.2"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        INVOICE
      </text>
      <rect x="19" y="28" width="26" height="3" rx="1.5" fill="#176e49" opacity="0.6" />
      <rect x="19" y="34" width="20" height="3" rx="1.5" fill="#176e49" opacity="0.45" />
      <rect x="19" y="40" width="24" height="3" rx="1.5" fill="#176e49" opacity="0.45" />
      <rect x="19" y="46" width="14" height="3" rx="1.5" fill="#176e49" opacity="0.35" />
    </g>
  </svg>
);

export const LorryServicesScreen: React.FC<LorryServicesScreenProps> = ({
  lorry,
  onBack,
  onNavigatePath,
}) => {
  const [openSheet, setOpenSheet] = useState<SheetSectionKey | null>(null);
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

  // Strictly lorry-scoped data from existing source-of-truth services
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
  const truckImgSrc = `${import.meta.env.BASE_URL}images/fleetos-truck-hero.jpg`;

  const routeLabel = activeTrip
    ? `${activeTrip.startLocation} → ${activeTrip.destination}`
    : locationReport?.route
      ? `${locationReport.route.from} → ${locationReport.route.to}`
      : null;

  const distanceText = savedRoute
    ? `${savedRoute.distanceKm.toLocaleString('en-IN')} km`
    : latestEstimate
      ? `${latestEstimate.totalDistanceKm.toLocaleString('en-IN')} km`
      : null;

  const etaText = savedRoute ? formatDuration(savedRoute.durationSeconds) : null;
  const dieselText = latestEstimate ? `≈ ${latestEstimate.totalDieselLitres} L` : null;

  const hasJourneyStats = Boolean(routeLabel || distanceText || etaText || dieselText);

  return (
    <div className="min-h-screen w-full bg-[#05070b] text-white font-sans selection:bg-blue-600/40">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] md:max-w-[520px] flex-col px-4 pb-8">
        {/* ==================== TOP HEADER ==================== */}
        <header
          ref={menuRef}
          className="sticky top-0 z-30 flex items-center justify-between bg-[#05070b]/95 pt-4 pb-3.5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to My Lorries"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-[#2b85f5]">
                <Truck className="h-7 w-7 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[20px] font-extrabold leading-none tracking-tight">
                  <span className="text-white">Fleet</span>
                  <span className="text-[#f5c431]">OS</span>
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                  Lorry Services
                </p>
              </div>
            </div>
          </div>

          {/* Right: Bell + Horizontal 3-dot Menu */}
          <div className="relative flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                setMenuOpen(false);
              }}
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-200 hover:bg-white/10"
            >
              <Bell className="h-5 w-5" />
              {openProblems.length > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#05070b]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen((v) => !v);
                setNotifOpen(false);
              }}
              aria-label="More options"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-200 hover:bg-white/10"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-white/10 bg-[#12161f] p-3.5 shadow-2xl">
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
                          onNavigatePath('/maintenance/problems');
                        }}
                        className="w-full rounded-xl bg-white/5 p-2.5 text-left text-xs hover:bg-white/10"
                      >
                        <p className="font-semibold text-[#f5c431]">{p.problemType}</p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                          {p.location} · {p.status}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {menuOpen && (
              <div className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#12161f] py-1.5 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigatePath('/expenses');
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
                    onNavigatePath('/driver');
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

        {/* ==================== MAIN CONTENT ==================== */}
        <main className="flex-1 space-y-5">
          {/* 1. VEHICLE INFORMATION CARD (Truck Left + Info Right + Conditional 4-Col Journey Row) */}
          <section className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#131720] shadow-lg">
            {/* Subtle top-right golden glow */}
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-36 w-52 rounded-full opacity-35 blur-2xl"
              style={{
                background: 'radial-gradient(circle, #c9921e 0%, transparent 72%)',
              }}
            />

            <div className="relative flex items-center gap-3 px-4 pt-4 pb-3.5">
              {/* Truck Image on Left (matches 5-screen reference) */}
              <img
                src={truckImgSrc}
                alt={`${lorry.manufacturer} ${lorry.model}`}
                className="h-20 w-28 sm:h-22 sm:w-32 flex-shrink-0 object-contain mix-blend-lighten select-none pointer-events-none"
              />

              {/* Registration Number, Status Pill, Model & Capacity */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <h1 className="truncate font-mono text-[18px] sm:text-[20px] font-extrabold tracking-tight text-white">
                  {lorry.registrationNumber}
                </h1>
                <div>
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
                <p className="truncate text-[11px] font-medium text-slate-300">
                  {lorry.manufacturer} {lorry.model.split('(')[0].trim()} &bull;{' '}
                  {lorry.loadCapacityTonnes} Ton
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpenSheet('maps')}
                aria-label="Open Maps & GPS services"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-200 hover:bg-white/20"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Current Journey Row — Rendered ONLY when valid trip / route / estimate data exists */}
            {hasJourneyStats && (
              <div className="relative grid grid-cols-4 divide-x divide-white/10 border-t border-white/10 bg-black/25 px-1 py-2.5 text-center">
                <div className="flex flex-col items-center justify-center gap-1 px-1">
                  <Route className="h-4 w-4 text-sky-300" />
                  <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-slate-100">
                    {routeLabel ?? '—'}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 px-1">
                  <Truck className="h-4 w-4 text-sky-300" />
                  <p className="font-mono text-[11px] font-bold text-white">
                    {distanceText ?? '—'}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 px-1">
                  <Clock className="h-4 w-4 text-sky-300" />
                  <p className="font-mono text-[11px] font-bold text-white">{etaText ?? '—'}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 px-1">
                  <Fuel className="h-4 w-4 text-sky-300" />
                  <p className="font-mono text-[11px] font-bold text-white">
                    {dieselText ?? '—'}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* 2. FOUR MAIN SERVICE CARDS (2x2 Grid — Clicking opens Bottom-Sheet Overlay) */}
          <section className="space-y-3">
            <h2 className="text-[19px] font-bold tracking-tight text-white">Lorry Services</h2>

            <div className="grid grid-cols-2 gap-3">
              {/* 1. Maps & GPS (Blue) */}
              <button
                type="button"
                onClick={() => setOpenSheet('maps')}
                className="group relative flex min-h-[152px] flex-col justify-between overflow-hidden rounded-[22px] border border-blue-400/25 p-3.5 sm:p-4 text-left transition-transform active:scale-[0.98]"
                style={{
                  background:
                    'linear-gradient(150deg, #1b65cc 0%, #103268 48%, #0b1629 100%)',
                }}
              >
                <div className="flex w-full justify-end">
                  <MapsPin3DIcon />
                </div>
                <div className="mt-1 flex items-end justify-between gap-1.5">
                  <div className="min-w-0">
                    <h3 className="text-[14px] sm:text-[15px] font-bold leading-tight text-white">
                      Maps &amp; GPS
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-blue-100/75">
                      Route, live tracking &amp; trip history
                    </p>
                  </div>
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-white group-hover:bg-white/25">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </button>

              {/* 2. Diesel Management (Yellow) */}
              <button
                type="button"
                onClick={() => setOpenSheet('diesel')}
                className="group relative flex min-h-[152px] flex-col justify-between overflow-hidden rounded-[22px] border border-amber-400/25 p-3.5 sm:p-4 text-left transition-transform active:scale-[0.98]"
                style={{
                  background:
                    'linear-gradient(150deg, #a67a16 0%, #4d370c 48%, #1d1508 100%)',
                }}
              >
                <div className="flex w-full justify-end">
                  <DieselNozzle3DIcon />
                </div>
                <div className="mt-1 flex items-end justify-between gap-1.5">
                  <div className="min-w-0">
                    <h3 className="text-[14px] sm:text-[15px] font-bold leading-tight text-white">
                      Diesel Management
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-amber-100/75">
                      Fuel, receipts &amp; reports
                    </p>
                  </div>
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-white group-hover:bg-white/25">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </button>

              {/* 3. Maintenance (Purple) */}
              <button
                type="button"
                onClick={() => setOpenSheet('maintenance')}
                className="group relative flex min-h-[152px] flex-col justify-between overflow-hidden rounded-[22px] border border-purple-400/25 p-3.5 sm:p-4 text-left transition-transform active:scale-[0.98]"
                style={{
                  background:
                    'linear-gradient(150deg, #6d3ec4 0%, #331e5e 48%, #160f26 100%)',
                }}
              >
                <div className="flex w-full justify-end">
                  <MaintenanceTools3DIcon />
                </div>
                <div className="mt-1 flex items-end justify-between gap-1.5">
                  <div className="min-w-0">
                    <h3 className="text-[14px] sm:text-[15px] font-bold leading-tight text-white">
                      Maintenance
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-purple-100/75">
                      Service, repairs &amp; insurance
                    </p>
                  </div>
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-white group-hover:bg-white/25">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </button>

              {/* 4. Invoices (Green) */}
              <button
                type="button"
                onClick={() => setOpenSheet('invoices')}
                className="group relative flex min-h-[152px] flex-col justify-between overflow-hidden rounded-[22px] border border-emerald-400/25 p-3.5 sm:p-4 text-left transition-transform active:scale-[0.98]"
                style={{
                  background:
                    'linear-gradient(150deg, #168c59 0%, #0e4630 48%, #091d16 100%)',
                }}
              >
                <div className="flex w-full justify-end">
                  <InvoicePaper3DIcon />
                </div>
                <div className="mt-1 flex items-end justify-between gap-1.5">
                  <div className="min-w-0">
                    <h3 className="text-[14px] sm:text-[15px] font-bold leading-tight text-white">
                      Invoices
                    </h3>
                    <p className="mt-1 text-[11px] leading-snug text-emerald-100/75">
                      Create invoices, payments &amp; P&amp;L
                    </p>
                  </div>
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-white group-hover:bg-white/25">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* 3. BOTTOM PROMO BANNER */}
          <section
            className="relative overflow-hidden rounded-[22px] border border-white/10 p-4 shadow-lg"
            style={{
              background:
                'linear-gradient(110deg, #272017 0%, #1c1813 45%, #3d2c12 100%)',
            }}
          >
            <div className="relative z-10 max-w-[66%] space-y-3">
              <p className="text-[16px] sm:text-[17px] font-bold italic leading-snug text-white">
                Manage Your Lorry Smarter with{' '}
                <span className="text-[#f5c431]">FleetOS</span>
              </p>
              <button
                type="button"
                onClick={() => onNavigatePath('/expenses')}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#f5c431] px-4 py-1.5 text-xs font-extrabold text-[#111318] transition-colors hover:bg-[#ffd24d]"
              >
                Explore All Features
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <img
              src={truckImgSrc}
              alt="FleetOS Truck"
              className="pointer-events-none absolute -right-3 bottom-1 h-26 w-40 object-contain mix-blend-lighten opacity-95 select-none"
            />
          </section>
        </main>
      </div>

      {/* Blurred Bottom-Sheet Overlay for Selected Section */}
      <ServiceSectionSheet
        section={openSheet}
        lorryRegistration={lorry.registrationNumber}
        onClose={() => setOpenSheet(null)}
        onSelectService={(targetPath) => {
          setOpenSheet(null);
          onNavigatePath(targetPath);
        }}
      />
    </div>
  );
};
