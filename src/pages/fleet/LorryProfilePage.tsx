import React, { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Droplets, Map, Receipt, FileText, UserRound, Wrench, Truck, SearchX } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/common/Button';
import { LorryService } from '../../services/lorryService';
import { LorryStatus } from '../../types/lorry';
import { MapsGpsTab } from '../../components/fleet/profile/MapsGpsTab';
import { InvoiceTab } from '../../components/fleet/profile/InvoiceTab';
import { DieselTab } from '../../components/fleet/profile/DieselTab';
import { MaintenanceTab } from '../../components/fleet/profile/MaintenanceTab';
import { ExpensesTab } from '../../components/fleet/profile/ExpensesTab';
import { DriverTab } from '../../components/fleet/profile/DriverTab';

const TABS = [
  { key: 'maps', label: 'Maps & GPS Tracking', icon: Map },
  { key: 'invoices', label: 'Invoice Management', icon: FileText },
  { key: 'diesel', label: 'Diesel Management', icon: Droplets },
  { key: 'maintenance', label: 'Maintenance Management', icon: Wrench },
  { key: 'expenses', label: 'Expenses Management', icon: Receipt },
  { key: 'driver', label: 'Driver Management', icon: UserRound },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const STATUS_STYLES: Record<LorryStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Trip': 'bg-blue-50 text-blue-700 border-blue-200',
  Maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
  Available: 'bg-teal-50 text-teal-700 border-teal-200',
  Inactive: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const LorryProfilePage: React.FC = () => {
  const { lorryId = '' } = useParams<{ lorryId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const lorry = useMemo(() => LorryService.getLorryById(lorryId), [lorryId]);
  const requested = searchParams.get('tab');
  const activeTab: TabKey = TABS.some((t) => t.key === requested) ? (requested as TabKey) : 'maps';

  const goBack = () => navigate('/fleet');

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
        <Button className="mt-5" variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={goBack}>
          Back to Lorry Management
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      <div>
        <button
          onClick={goBack}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Truck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-mono text-2xl font-bold tracking-wide text-slate-900">{lorry.registrationNumber}</h2>
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
                {lorry.vehicleType} · {lorry.manufacturer} {lorry.model} · {lorry.loadCapacityTonnes} Tonnes ·{' '}
                <span className="font-mono">{lorry.id}</span>
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 sm:text-right">
            <p>Odometer</p>
            <p className="font-mono text-base font-bold text-slate-900">
              {lorry.odometerReadingKm.toLocaleString('en-IN')} km
            </p>
          </div>
        </div>
      </div>

      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => setSearchParams({ tab: key }, { replace: true })}
            className={clsx(
              'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors',
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* key={lorry.id} guarantees tab state never leaks between lorries */}
      <div key={`${lorry.id}-${activeTab}`} role="tabpanel">
        {activeTab === 'maps' && <MapsGpsTab lorryId={lorry.id} />}
        {activeTab === 'invoices' && <InvoiceTab lorryId={lorry.id} />}
        {activeTab === 'diesel' && <DieselTab lorryId={lorry.id} />}
        {activeTab === 'maintenance' && <MaintenanceTab lorryId={lorry.id} />}
        {activeTab === 'expenses' && <ExpensesTab lorryId={lorry.id} />}
        {activeTab === 'driver' && <DriverTab lorry={lorry} />}
      </div>
    </div>
  );
};
