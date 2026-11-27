import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Calculator,
  ChevronRight,
  Droplets,
  FileSpreadsheet,
  FileText,
  Fuel,
  Map,
  Receipt,
  ScanLine,
  SearchX,
  Truck,
  UserRound,
  Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/common/Button';
import { LorryService } from '../../services/lorryService';
import { FUEL_LEDGER } from '../../services/mockFuelLedger';
import { filterEntries } from '../../utils/fuelAnalytics';
import { LorryStatus } from '../../types/lorry';
import { MapsGpsTab } from '../../components/fleet/profile/MapsGpsTab';
import { InvoiceTab } from '../../components/fleet/profile/InvoiceTab';
import { DriverTab } from '../../components/fleet/profile/DriverTab';
import { LorryExpenseDashboard } from '../../components/expenses/LorryExpenseDashboard';
import { LorryExpenseReports } from '../../components/expenses/LorryExpenseReports';
import { TripFinancialStatementView } from '../../components/expenses/TripFinancialStatementView';
import { TripService } from '../../services/tripService';
import { buildTripFinancialStatement } from '../../utils/tripProfitLoss';
import { FuelOverviewSection } from '../../components/diesel/FuelOverviewSection';
import { FuelCalculatorSection } from '../../components/diesel/FuelCalculatorSection';
import { FuelReceiptsSection } from '../../components/diesel/FuelReceiptsSection';
import { FuelReceiptScannerSection } from '../../components/diesel/FuelReceiptScannerSection';
import { PurchasedDieselReportsSection } from '../../components/diesel/PurchasedDieselReportsSection';
import {
  MaintenanceDashboardSection,
  MaintenanceSubKey,
} from '../../components/maintenance/MaintenanceDashboardSection';
import { ProblemsRepairsSection } from '../../components/maintenance/ProblemsRepairsSection';
import { ServicePartsSection } from '../../components/maintenance/ServicePartsSection';
import { DriverPaymentsSection } from '../../components/maintenance/DriverPaymentsSection';
import { LoadHandlingSection } from '../../components/maintenance/LoadHandlingSection';
import { OtherExpensesSection } from '../../components/maintenance/OtherExpensesSection';
import { MaintenanceCostReportsSection } from '../../components/maintenance/MaintenanceCostReportsSection';

const STATUS_STYLES: Record<LorryStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Trip': 'bg-blue-50 text-blue-700 border-blue-200',
  Maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
  Available: 'bg-teal-50 text-teal-700 border-teal-200',
  Inactive: 'bg-slate-100 text-slate-700 border-slate-200',
};

const PROFILE_SECTIONS = [
  { key: 'maps', label: 'Maps & GPS Tracking', icon: Map },
  { key: 'invoices', label: 'Invoice Management', icon: FileText },
  { key: 'diesel', label: 'Diesel Management', icon: Droplets },
  { key: 'maintenance', label: 'Maintenance Management', icon: Wrench },
  { key: 'expenses', label: 'Expenses Management', icon: Receipt },
  { key: 'driver', label: 'Driver Management', icon: UserRound },
] as const;

const DIESEL_SUBSECTIONS = [
  { key: 'overview', label: 'Fuel Overview', icon: Fuel },
  { key: 'calculator', label: 'Fuel Calculator', icon: Calculator },
  { key: 'receipts', label: 'Fuel Receipts', icon: FileSpreadsheet },
  { key: 'reports', label: 'Fuel Reports & Analytics', icon: BarChart3 },
] as const;

const MAINTENANCE_SUBSECTIONS: { key: MaintenanceSubKey; label: string }[] = [
  { key: 'problems', label: 'Problems & Repairs' },
  { key: 'service', label: 'Service & Parts' },
  { key: 'driver-payments', label: 'Driver Payments' },
  { key: 'load-handling', label: 'Load & Handling Expenses' },
  { key: 'other-expenses', label: 'Other Lorry Expenses' },
  { key: 'cost-reports', label: 'Cost Reports' },
];

type SectionKey = (typeof PROFILE_SECTIONS)[number]['key'];
type DieselSubKey = (typeof DIESEL_SUBSECTIONS)[number]['key'] | 'scanner';

const MenuCard: React.FC<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}> = ({ label, icon: Icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full min-h-[108px] sm:min-h-[76px] flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 text-left shadow-sm transition-colors hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40"
  >
    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-3 sm:gap-4 min-w-0">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#0b1329] text-white transition-colors group-hover:bg-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <ChevronRight className="h-4 w-4 sm:hidden flex-shrink-0 text-slate-400 group-hover:text-blue-600" />
      <span className="hidden sm:inline truncate text-base font-semibold text-slate-900">{label}</span>
    </div>
    <span className="sm:hidden text-xs font-semibold leading-snug text-slate-900">{label}</span>
    <ChevronRight className="hidden sm:block h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-blue-600" />
  </button>
);

export const LorryProfilePage: React.FC = () => {
  const { lorryId = '', section, subSection } = useParams<{
    lorryId: string;
    section?: string;
    subSection?: string;
  }>();
  const navigate = useNavigate();

  const lorry = useMemo(() => LorryService.getLorryById(lorryId), [lorryId]);
  const lorryFuelEntries = useMemo(
    () => (lorry ? filterEntries(FUEL_LEDGER, lorry.id) : []),
    [lorry]
  );

  const activeSection = PROFILE_SECTIONS.find((s) => s.key === section)?.key as SectionKey | undefined;
  const activeDieselSub: DieselSubKey | undefined =
    activeSection === 'diesel'
      ? subSection === 'scanner'
        ? 'scanner'
        : (DIESEL_SUBSECTIONS.find((d) => d.key === subSection)?.key as DieselSubKey | undefined)
      : undefined;

  const activeMaintenanceSub: MaintenanceSubKey | undefined =
    activeSection === 'maintenance'
      ? (MAINTENANCE_SUBSECTIONS.find((m) => m.key === subSection)?.key as
          | MaintenanceSubKey
          | undefined)
      : undefined;

  const activeExpensesReports =
    activeSection === 'expenses' && subSection === 'reports';
  const activeExpensesTripId =
    activeSection === 'expenses' && subSection && subSection !== 'reports'
      ? subSection
      : undefined;
  const activeExpensesTripStatement = useMemo(() => {
    if (!lorry || !activeExpensesTripId) return null;
    const trip = TripService.getByLorryId(lorry.id).find((t) => t.id === activeExpensesTripId);
    if (!trip) return null;
    return buildTripFinancialStatement(lorry.id, trip);
  }, [lorry, activeExpensesTripId]);

  const activeSectionMeta = PROFILE_SECTIONS.find((s) => s.key === activeSection);
  const activeDieselMeta =
    activeDieselSub === 'scanner'
      ? { key: 'scanner', label: 'Smart Fuel Receipt Scanner', icon: ScanLine }
      : DIESEL_SUBSECTIONS.find((d) => d.key === activeDieselSub);
  const activeMaintenanceMeta = MAINTENANCE_SUBSECTIONS.find((m) => m.key === activeMaintenanceSub);

  const backConfig = !lorry
    ? { label: 'Back to Lorry Management', to: '/fleet' }
    : activeDieselSub
      ? { label: 'Back to Diesel Management', to: `/fleet/${lorry.id}/diesel` }
      : activeMaintenanceSub
        ? { label: 'Back to Maintenance', to: `/fleet/${lorry.id}/maintenance` }
        : activeExpensesReports || activeExpensesTripId
          ? { label: 'Back to Expenses', to: `/fleet/${lorry.id}/expenses` }
          : activeSection
            ? { label: `Back to ${lorry.registrationNumber}`, to: `/fleet/${lorry.id}` }
            : { label: 'Back to Lorry Management', to: '/fleet' };

  const regOf = (id: string) => (lorry && id === lorry.id ? lorry.registrationNumber : id);

  return (
    <div key={lorryId} className="min-h-screen w-full bg-slate-50 font-sans">
      {/* Simple Full-Width Top Header: FleetOS Logo, Selected Lorry Reg Number, Back Button */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white">
        <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Left: FleetOS Logo + Selected Lorry Registration Number */}
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
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="font-mono text-base font-bold tracking-tight text-[#0b1329]">FleetOS</span>
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600">
                  Pro
                </span>
              </div>
            </button>

            {lorry && (
              <>
                <span className="h-6 w-px bg-slate-200 flex-shrink-0" aria-hidden="true" />
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <span className="truncate font-mono text-sm font-bold tracking-wide text-slate-900 sm:text-base">
                    {lorry.registrationNumber}
                  </span>
                  <span
                    className={clsx(
                      'hidden xs:inline-flex flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                      STATUS_STYLES[lorry.status]
                    )}
                  >
                    {lorry.status}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right: Back Button */}
          <button
            type="button"
            onClick={() => navigate(backConfig.to)}
            className="inline-flex min-h-[44px] flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{backConfig.label}</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
      </header>

      {/* Full-Width Main Content */}
      <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
        {!lorry ? (
          <div className="mx-auto max-w-md py-20 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <SearchX className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Lorry not found</h2>
            <p className="mt-1 text-xs text-slate-500">
              This lorry doesn't exist or was deleted. Demo data resets when the page is reloaded.
            </p>
            <Button
              className="mt-5"
              variant="primary"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate('/fleet')}
            >
              Back to Lorry Management
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pb-12">
            {/* Level 1: 6-Card Individual Lorry Profile Menu */}
            {!activeSection && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                      {lorry.registrationNumber}
                    </h1>
                    <p className="text-xs text-slate-500">
                      {lorry.vehicleType} · {lorry.manufacturer} {lorry.model} · {lorry.loadCapacityTonnes} Tonnes
                    </p>
                  </div>
                  <span
                    className={clsx(
                      'rounded-full border px-2.5 py-1 text-xs font-semibold',
                      STATUS_STYLES[lorry.status]
                    )}
                  >
                    {lorry.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {PROFILE_SECTIONS.map(({ key, label, icon }) => (
                    <MenuCard
                      key={key}
                      label={label}
                      icon={icon}
                      onClick={() => navigate(`/fleet/${lorry.id}/${key}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Level 2: Diesel Management 4-Card Submenu + Prominent Scan Fuel Receipt Button */}
            {activeSection === 'diesel' && !activeDieselSub && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <Droplets className="h-5 w-5 text-blue-600" />
                    <h1 className="text-lg font-bold text-slate-900">Diesel Management</h1>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    leftIcon={<ScanLine className="h-4 w-4" />}
                    onClick={() => navigate(`/fleet/${lorry.id}/diesel/scanner`)}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    Scan Fuel Receipt
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {DIESEL_SUBSECTIONS.map(({ key, label, icon }) => (
                    <MenuCard
                      key={key}
                      label={label}
                      icon={icon}
                      onClick={() => navigate(`/fleet/${lorry.id}/diesel/${key}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Level 3: Diesel Sub-Section Detail Views */}
            {activeSection === 'diesel' && activeDieselSub && activeDieselMeta && (
              <div className="space-y-4">
                {activeDieselSub === 'calculator' || activeDieselSub === 'reports' || activeDieselSub === 'scanner' ? (
                  <div className="border-b border-slate-200 pb-4 space-y-1.5">
                    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => navigate('/fleet')}
                        className="hover:text-blue-600 font-medium"
                      >
                        Lorry Management
                      </button>
                      <span>/</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/fleet/${lorry.id}`)}
                        className="font-mono hover:text-blue-600 font-medium"
                      >
                        {lorry.registrationNumber}
                      </button>
                      <span>/</span>
                      <button
                        type="button"
                        onClick={() => navigate(`/fleet/${lorry.id}/diesel`)}
                        className="hover:text-blue-600 font-medium"
                      >
                        Diesel Management
                      </button>
                    </nav>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      {activeDieselSub === 'calculator'
                        ? 'Fuel Calculator'
                        : activeDieselSub === 'reports'
                          ? 'Purchased Diesel Reports'
                          : 'Smart Fuel Receipt Scanner'}
                    </h1>
                    <p className="text-xs text-slate-500">
                      {activeDieselSub === 'calculator'
                        ? "Plan your truck's fuel requirements and trip expenses."
                        : activeDieselSub === 'reports'
                          ? 'Track every diesel purchase, receipt and payment for your lorries.'
                          : 'Capture or upload a diesel receipt, verify OCR-extracted fields, and confirm payment status.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                    <activeDieselMeta.icon className="h-5 w-5 text-blue-600" />
                    <h1 className="text-lg font-bold text-slate-900">{activeDieselMeta.label}</h1>
                  </div>
                )}

                {activeDieselSub === 'overview' && (
                  <FuelOverviewSection
                    entries={lorryFuelEntries}
                    regOf={regOf}
                    scopeLabel={lorry.registrationNumber}
                  />
                )}
                {activeDieselSub === 'calculator' && (
                  <FuelCalculatorSection
                    key={lorry.id}
                    lorry={lorry}
                    lorryFuelEntries={lorryFuelEntries}
                  />
                )}
                {activeDieselSub === 'receipts' && (
                  <FuelReceiptsSection
                    key={lorry.id}
                    lorry={lorry}
                    onOpenScanner={() => navigate(`/fleet/${lorry.id}/diesel/scanner`)}
                  />
                )}
                {activeDieselSub === 'scanner' && (
                  <FuelReceiptScannerSection
                    key={lorry.id}
                    lorry={lorry}
                    onSaved={(targetLorryId) => navigate(`/fleet/${targetLorryId}/diesel/receipts`)}
                  />
                )}
                {activeDieselSub === 'reports' && (
                  <PurchasedDieselReportsSection
                    key={lorry.id}
                    lorry={lorry}
                    onSwitchLorry={(nextId) => navigate(`/fleet/${nextId}/diesel/reports`)}
                  />
                )}
              </div>
            )}

            {/* Level 2: Maintenance & Lorry Cost Management Dashboard */}
            {activeSection === 'maintenance' && !activeMaintenanceSub && (
              <MaintenanceDashboardSection
                key={lorry.id}
                lorry={lorry}
                onOpenSection={(sub) => navigate(`/fleet/${lorry.id}/maintenance/${sub}`)}
              />
            )}

            {/* Level 3: Maintenance Sub-Section Detail Views */}
            {activeSection === 'maintenance' && activeMaintenanceSub && activeMaintenanceMeta && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3 space-y-1">
                  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => navigate('/fleet')}
                      className="hover:text-blue-600 font-medium"
                    >
                      Lorry Management
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/fleet/${lorry.id}`)}
                      className="font-mono hover:text-blue-600 font-medium"
                    >
                      {lorry.registrationNumber}
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/fleet/${lorry.id}/maintenance`)}
                      className="hover:text-blue-600 font-medium"
                    >
                      Maintenance Management
                    </button>
                  </nav>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    {activeMaintenanceMeta.label}
                  </h1>
                </div>

                {activeMaintenanceSub === 'problems' && (
                  <ProblemsRepairsSection key={lorry.id} lorry={lorry} />
                )}
                {activeMaintenanceSub === 'service' && (
                  <ServicePartsSection key={lorry.id} lorry={lorry} />
                )}
                {activeMaintenanceSub === 'driver-payments' && (
                  <DriverPaymentsSection key={lorry.id} lorry={lorry} />
                )}
                {activeMaintenanceSub === 'load-handling' && (
                  <LoadHandlingSection key={lorry.id} lorry={lorry} />
                )}
                {activeMaintenanceSub === 'other-expenses' && (
                  <OtherExpensesSection key={lorry.id} lorry={lorry} />
                )}
                {activeMaintenanceSub === 'cost-reports' && (
                  <MaintenanceCostReportsSection key={lorry.id} lorry={lorry} />
                )}
              </div>
            )}

            {/* Level 2 & 3: Expenses Management + Trip-wise P&L */}
            {activeSection === 'expenses' && !activeExpensesReports && !activeExpensesTripId && (
              <LorryExpenseDashboard
                key={lorry.id}
                lorry={lorry}
                onOpenReports={() => navigate(`/fleet/${lorry.id}/expenses/reports`)}
                onOpenTrip={(tid) => navigate(`/fleet/${lorry.id}/expenses/${tid}`)}
              />
            )}

            {activeSection === 'expenses' && activeExpensesTripId && (
              activeExpensesTripStatement ? (
                <TripFinancialStatementView
                  key={activeExpensesTripId}
                  lorry={lorry}
                  statement={activeExpensesTripStatement}
                />
              ) : (
                <div className="mx-auto max-w-md py-16 text-center">
                  <h2 className="text-lg font-bold text-slate-900">Trip not found</h2>
                  <Button
                    className="mt-4 min-h-[44px]"
                    variant="primary"
                    onClick={() => navigate(`/fleet/${lorry.id}/expenses`)}
                  >
                    Back to Expenses
                  </Button>
                </div>
              )
            )}

            {activeSection === 'expenses' && activeExpensesReports && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3 space-y-1">
                  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() => navigate('/fleet')}
                      className="hover:text-blue-600 font-medium"
                    >
                      Lorry Management
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/fleet/${lorry.id}`)}
                      className="font-mono hover:text-blue-600 font-medium"
                    >
                      {lorry.registrationNumber}
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/fleet/${lorry.id}/expenses`)}
                      className="hover:text-blue-600 font-medium"
                    >
                      Expenses Management
                    </button>
                  </nav>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Financial Reports &amp; P&amp;L
                  </h1>
                </div>
                <LorryExpenseReports
                  key={lorry.id}
                  lorry={lorry}
                  onOpenTrip={(tid) => navigate(`/fleet/${lorry.id}/expenses/${tid}`)}
                />
              </div>
            )}

            {/* Level 2: Other 3 Section Detail Views */}
            {activeSection &&
              activeSection !== 'diesel' &&
              activeSection !== 'maintenance' &&
              activeSection !== 'expenses' &&
              activeSectionMeta && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                    <activeSectionMeta.icon className="h-5 w-5 text-blue-600" />
                    <h1 className="text-lg font-bold text-slate-900">{activeSectionMeta.label}</h1>
                  </div>

                  {activeSection === 'maps' && <MapsGpsTab lorryId={lorry.id} />}
                  {activeSection === 'invoices' && <InvoiceTab lorryId={lorry.id} />}
                  {activeSection === 'driver' && <DriverTab lorry={lorry} />}
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
};
