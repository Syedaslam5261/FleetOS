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
  SearchX,
  Truck,
  UserRound,
  Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/common/Button';
import { LorryService } from '../../services/lorryService';
import { FUEL_LEDGER, FUEL_REFERENCE_DAY } from '../../services/mockFuelLedger';
import { filterEntries } from '../../utils/fuelAnalytics';
import { LorryStatus } from '../../types/lorry';
import { MapsGpsTab } from '../../components/fleet/profile/MapsGpsTab';
import { InvoiceTab } from '../../components/fleet/profile/InvoiceTab';
import { MaintenanceTab } from '../../components/fleet/profile/MaintenanceTab';
import { ExpensesTab } from '../../components/fleet/profile/ExpensesTab';
import { DriverTab } from '../../components/fleet/profile/DriverTab';
import { FuelOverviewSection } from '../../components/diesel/FuelOverviewSection';
import { FuelCalculatorSection } from '../../components/diesel/FuelCalculatorSection';
import { FuelReceiptsSection } from '../../components/diesel/FuelReceiptsSection';
import { FuelReportsSection } from '../../components/diesel/FuelReportsSection';

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

type SectionKey = (typeof PROFILE_SECTIONS)[number]['key'];
type DieselSubKey = (typeof DIESEL_SUBSECTIONS)[number]['key'];

const MenuCard: React.FC<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}> = ({ label, icon: Icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-150 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40"
  >
    <div className="flex items-center gap-4 min-w-0">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition-colors group-hover:bg-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <span className="truncate text-sm font-semibold text-slate-900 sm:text-base">{label}</span>
    </div>
    <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-blue-600" />
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

  if (!lorry) {
    return (
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
    );
  }

  const activeSection = PROFILE_SECTIONS.find((s) => s.key === section)?.key as SectionKey | undefined;
  const activeDieselSub =
    activeSection === 'diesel'
      ? (DIESEL_SUBSECTIONS.find((d) => d.key === subSection)?.key as DieselSubKey | undefined)
      : undefined;

  const activeSectionMeta = PROFILE_SECTIONS.find((s) => s.key === activeSection);
  const activeDieselMeta = DIESEL_SUBSECTIONS.find((d) => d.key === activeDieselSub);

  const regOf = (id: string) => (id === lorry.id ? lorry.registrationNumber : id);

  // Back button destination and label depend on current depth
  const backConfig = activeDieselSub
    ? { label: 'Back to Diesel Management', to: `/fleet/${lorry.id}/diesel` }
    : activeSection
      ? { label: `Back to ${lorry.registrationNumber}`, to: `/fleet/${lorry.id}` }
      : { label: 'Back to Lorry Management', to: '/fleet' };

  return (
    // key={lorry.id} guarantees state never leaks when switching between lorries
    <div key={lorry.id} className="space-y-6 pb-12">
      <div>
        <button
          type="button"
          onClick={() => navigate(backConfig.to)}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {backConfig.label}
        </button>

        {/* Lorry Header */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0b1329] text-white sm:h-14 sm:w-14">
              <Truck className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="font-mono text-xl font-bold tracking-wide text-slate-900 sm:text-2xl">
                  {lorry.registrationNumber}
                </h2>
                <span
                  className={clsx(
                    'rounded-full border px-2.5 py-1 text-xs font-semibold',
                    STATUS_STYLES[lorry.status]
                  )}
                >
                  {lorry.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {lorry.vehicleType} · {lorry.manufacturer} {lorry.model} · {lorry.loadCapacityTonnes} Tonnes
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 md:text-right">
            <p>Odometer</p>
            <p className="font-mono text-base font-bold text-slate-900">
              {lorry.odometerReadingKm.toLocaleString('en-IN')} km
            </p>
          </div>
        </div>
      </div>

      {/* Level 1: 6-Card Individual Lorry Profile Menu */}
      {!activeSection && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROFILE_SECTIONS.map(({ key, label, icon }) => (
            <MenuCard
              key={key}
              label={label}
              icon={icon}
              onClick={() => navigate(`/fleet/${lorry.id}/${key}`)}
            />
          ))}
        </div>
      )}

      {/* Level 2: Diesel Management 4-Card Submenu */}
      {activeSection === 'diesel' && !activeDieselSub && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <Droplets className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Diesel Management</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <activeDieselMeta.icon className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">{activeDieselMeta.label}</h3>
          </div>

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
              ledger={lorryFuelEntries}
              lockedLorry={{ id: lorry.id, label: lorry.registrationNumber }}
            />
          )}
          {activeDieselSub === 'receipts' && (
            <FuelReceiptsSection entries={lorryFuelEntries} regOf={regOf} />
          )}
          {activeDieselSub === 'reports' && (
            <FuelReportsSection
              rangeEntries={lorryFuelEntries}
              lorryEntries={lorryFuelEntries}
              refDay={FUEL_REFERENCE_DAY}
              regOf={regOf}
              scopeLabel={lorry.registrationNumber}
            />
          )}
        </div>
      )}

      {/* Level 2: Other 5 Section Detail Views */}
      {activeSection && activeSection !== 'diesel' && activeSectionMeta && (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <activeSectionMeta.icon className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">{activeSectionMeta.label}</h3>
          </div>

          {activeSection === 'maps' && <MapsGpsTab lorryId={lorry.id} />}
          {activeSection === 'invoices' && <InvoiceTab lorryId={lorry.id} />}
          {activeSection === 'maintenance' && <MaintenanceTab lorryId={lorry.id} />}
          {activeSection === 'expenses' && <ExpensesTab lorryId={lorry.id} />}
          {activeSection === 'driver' && <DriverTab lorry={lorry} />}
        </div>
      )}
    </div>
  );
};
