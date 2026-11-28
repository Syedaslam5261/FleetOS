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
import { FleetOSLogo, MainSectionKey, SECTION_ICON_SYSTEM } from '../common/FleetOSBrand';
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

/* Consistent section card styling using the shared SECTION_ICON_SYSTEM */
const SERVICE_CARD_THEMES: Record<
  MainSectionKey,
  { subtitle: string; gradient: string; border: string; iconTile: string }
> = {
  maps: {
    subtitle: 'Route, live tracking & trip history',
    gradient: 'linear-gradient(150deg, #1b65cc 0%, #103268 48%, #0b1629 100%)',
    border: 'border-blue-400/25',
    iconTile: 'bg-blue-400/20 text-blue-200 border border-blue-300/25',
  },
  diesel: {
    subtitle: 'Fuel, receipts & reports',
    gradient: 'linear-gradient(150deg, #a67a16 0%, #4d370c 48%, #1d1508 100%)',
    border: 'border-amber-400/25',
    iconTile: 'bg-amber-400/20 text-amber-200 border border-amber-300/25',
  },
  maintenance: {
    subtitle: 'Service, repairs & insurance',
    gradient: 'linear-gradient(150deg, #6d3ec4 0%, #331e5e 48%, #160f26 100%)',
    border: 'border-purple-400/25',
    iconTile: 'bg-purple-400/20 text-purple-200 border border-purple-300/25',
  },
  invoices: {
    subtitle: 'Create invoices, payments & P&L',
    gradient: 'linear-gradient(150deg, #168c59 0%, #0e4630 48%, #091d16 100%)',
    border: 'border-emerald-400/25',
    iconTile: 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/25',
  },
};

const MAIN_SECTION_ORDER: MainSectionKey[] = ['maps', 'diesel', 'maintenance', 'invoices'];

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

            <FleetOSLogo variant="dark" subtitle="Lorry Services" />
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
              {MAIN_SECTION_ORDER.map((sectionKey) => {
                const sys = SECTION_ICON_SYSTEM[sectionKey];
                const theme = SERVICE_CARD_THEMES[sectionKey];
                const SectionIcon = sys.icon;
                return (
                  <button
                    key={sectionKey}
                    type="button"
                    onClick={() => setOpenSheet(sectionKey)}
                    className={clsx(
                      'group relative flex min-h-[152px] flex-col justify-between overflow-hidden rounded-[22px] border p-3.5 sm:p-4 text-left transition-transform active:scale-[0.98]',
                      theme.border
                    )}
                    style={{ background: theme.gradient }}
                  >
                    <div className="flex w-full justify-end">
                      <div
                        className={clsx(
                          'flex h-12 w-12 items-center justify-center rounded-2xl',
                          theme.iconTile
                        )}
                      >
                        <SectionIcon className="h-6 w-6" strokeWidth={1.9} />
                      </div>
                    </div>
                    <div className="mt-1 flex items-end justify-between gap-1.5">
                      <div className="min-w-0">
                        <h3 className="text-[14px] sm:text-[15px] font-bold leading-tight text-white">
                          {sys.label}
                        </h3>
                        <p className="mt-1 text-[11px] leading-snug text-white/75">
                          {theme.subtitle}
                        </p>
                      </div>
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-white group-hover:bg-white/25">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                );
              })}
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
