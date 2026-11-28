import React, { useEffect } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bookmark,
  Calculator,
  CalendarDays,
  CreditCard,
  Droplets,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  Fuel,
  Gauge,
  History,
  IndianRupee,
  Layers,
  MapPin,
  Navigation,
  Radio,
  Receipt,
  Route,
  ScanLine,
  ShieldCheck,
  TrendingUp,
  Truck,
  UserRound,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

export type SheetSectionKey = 'maps' | 'diesel' | 'maintenance' | 'invoices';

export interface SheetServiceItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Relative path appended to `/fleet/${lorryId}` */
  targetPath: string;
  iconColorClass: string;
}

interface SectionConfig {
  key: SheetSectionKey;
  title: string;
  headerIcon: React.ComponentType<{ className?: string }>;
  headerIconBg: string;
  items: SheetServiceItem[];
}

export const SECTION_SHEET_CONFIG: Record<SheetSectionKey, SectionConfig> = {
  maps: {
    key: 'maps',
    title: 'Maps & GPS',
    headerIcon: MapPin,
    headerIconBg: 'bg-blue-500/20 text-blue-400',
    items: [
      {
        id: 'route-calculator',
        label: 'Route Calculator',
        icon: Route,
        targetPath: '/maps/route-planner',
        iconColorClass: 'text-sky-400',
      },
      {
        id: 'live-location',
        label: 'Live Location',
        icon: Radio,
        targetPath: '/maps/live',
        iconColorClass: 'text-blue-400',
      },
      {
        id: 'trip-history',
        label: 'Trip History',
        icon: CalendarDays,
        targetPath: '/expenses',
        iconColorClass: 'text-sky-300',
      },
      {
        id: 'saved-routes',
        label: 'Saved Routes',
        icon: Bookmark,
        targetPath: '/maps/route-planner',
        iconColorClass: 'text-blue-300',
      },
      {
        id: 'geofence-alerts',
        label: 'Geofence & Alerts',
        icon: Navigation,
        targetPath: '/maps/live',
        iconColorClass: 'text-amber-300',
      },
      {
        id: 'journey-tracking',
        label: 'Journey Tracking',
        icon: Truck,
        targetPath: '/maps/live',
        iconColorClass: 'text-sky-400',
      },
    ],
  },
  diesel: {
    key: 'diesel',
    title: 'Diesel Management',
    headerIcon: Fuel,
    headerIconBg: 'bg-amber-500/20 text-amber-400',
    items: [
      {
        id: 'diesel-calculator',
        label: 'Diesel Calculator',
        icon: Calculator,
        targetPath: '/diesel/calculator',
        iconColorClass: 'text-amber-400',
      },
      {
        id: 'scan-diesel-receipt',
        label: 'Scan Diesel Receipt',
        icon: ScanLine,
        targetPath: '/diesel/scanner',
        iconColorClass: 'text-yellow-400',
      },
      {
        id: 'fuel-purchases',
        label: 'Fuel Purchases',
        icon: Droplets,
        targetPath: '/diesel/receipts',
        iconColorClass: 'text-amber-400',
      },
      {
        id: 'fuel-reports',
        label: 'Fuel Reports',
        icon: BarChart3,
        targetPath: '/diesel/reports',
        iconColorClass: 'text-amber-300',
      },
      {
        id: 'fuel-expenses',
        label: 'Fuel Expenses',
        icon: Receipt,
        targetPath: '/expenses/reports',
        iconColorClass: 'text-yellow-300',
      },
      {
        id: 'mileage-analysis',
        label: 'Mileage Analysis',
        icon: Gauge,
        targetPath: '/diesel/overview',
        iconColorClass: 'text-amber-400',
      },
    ],
  },
  maintenance: {
    key: 'maintenance',
    title: 'Maintenance',
    headerIcon: Wrench,
    headerIconBg: 'bg-purple-500/20 text-purple-300',
    items: [
      {
        id: 'report-problem',
        label: 'Report a Problem',
        icon: AlertTriangle,
        targetPath: '/maintenance/problems',
        iconColorClass: 'text-amber-400',
      },
      {
        id: 'service-repairs',
        label: 'Service & Repairs',
        icon: Wrench,
        targetPath: '/maintenance/service',
        iconColorClass: 'text-purple-400',
      },
      {
        id: 'driver-payments',
        label: 'Driver Payments',
        icon: UserRound,
        targetPath: '/maintenance/driver-payments',
        iconColorClass: 'text-violet-300',
      },
      {
        id: 'other-expenses',
        label: 'Other Expenses',
        icon: Layers,
        targetPath: '/maintenance/other-expenses',
        iconColorClass: 'text-purple-300',
      },
      {
        id: 'maintenance-history',
        label: 'Maintenance History',
        icon: History,
        targetPath: '/maintenance/cost-reports',
        iconColorClass: 'text-violet-300',
      },
      {
        id: 'insurance-rc',
        label: 'Insurance & RC',
        icon: ShieldCheck,
        targetPath: '/maintenance/documents',
        iconColorClass: 'text-purple-400',
      },
    ],
  },
  invoices: {
    key: 'invoices',
    title: 'Invoices',
    headerIcon: FileText,
    headerIconBg: 'bg-emerald-500/20 text-emerald-400',
    items: [
      {
        id: 'create-invoice',
        label: 'Create Invoice',
        icon: FilePlus2,
        targetPath: '/invoices',
        iconColorClass: 'text-emerald-400',
      },
      {
        id: 'invoice-history',
        label: 'Invoice History',
        icon: FileSpreadsheet,
        targetPath: '/invoices',
        iconColorClass: 'text-teal-300',
      },
      {
        id: 'payments-collections',
        label: 'Payments & Collections',
        icon: IndianRupee,
        targetPath: '/expenses',
        iconColorClass: 'text-emerald-400',
      },
      {
        id: 'profit-loss',
        label: 'Profit & Loss',
        icon: TrendingUp,
        targetPath: '/expenses',
        iconColorClass: 'text-emerald-300',
      },
      {
        id: 'outstanding-bills',
        label: 'Outstanding Bills',
        icon: Wallet,
        targetPath: '/invoices',
        iconColorClass: 'text-teal-400',
      },
      {
        id: 'revenue-reports',
        label: 'Revenue Reports',
        icon: CreditCard,
        targetPath: '/expenses/reports',
        iconColorClass: 'text-emerald-400',
      },
    ],
  },
};

interface ServiceSectionSheetProps {
  section: SheetSectionKey | null;
  lorryRegistration: string;
  onClose: () => void;
  onSelectService: (targetPath: string) => void;
}

export const ServiceSectionSheet: React.FC<ServiceSectionSheetProps> = ({
  section,
  lorryRegistration,
  onClose,
  onSelectService,
}) => {
  useEffect(() => {
    if (!section) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [section, onClose]);

  if (!section) return null;

  const config = SECTION_SHEET_CONFIG[section];
  const HeaderIcon = config.headerIcon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${config.title} services`}
    >
      {/* Darkened + Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
      />

      {/* Bottom Sheet Panel */}
      <div className="relative z-10 flex max-h-[82vh] w-full max-w-[430px] flex-col rounded-t-[28px] sm:rounded-[28px] border border-white/10 bg-[#131720] text-white shadow-2xl">
        {/* Top Handle Indicator (Mobile) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-white/15" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={clsx(
                'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
                config.headerIconBg
              )}
            >
              <HeaderIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold leading-tight text-white">
                {config.title}
              </h2>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                All Services · <span className="font-mono text-slate-300">{lorryRegistration}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${config.title}`}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable 2-Column Icon Grid */}
        <div className="overflow-y-auto px-5 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {config.items.map(({ id, label, icon: Icon, targetPath, iconColorClass }) => (
              <button
                key={id}
                type="button"
                onClick={() => onSelectService(targetPath)}
                className="group flex min-h-[116px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#1b202b] px-3 py-4 text-center transition-colors hover:border-white/20 hover:bg-[#232938] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <Icon className={clsx('h-8 w-8 flex-shrink-0', iconColorClass)} />
                <span className="text-xs font-semibold leading-snug text-slate-100">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
