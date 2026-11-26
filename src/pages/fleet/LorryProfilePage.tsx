import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const STATUS_STYLES: Record<LorryStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Trip': 'bg-blue-50 text-blue-700 border-blue-200',
  Maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
  Available: 'bg-teal-50 text-teal-700 border-teal-200',
  Inactive: 'bg-slate-100 text-slate-700 border-slate-200',
};

const Section: React.FC<{
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}> = ({ id, title, subtitle, icon: Icon, children }) => (
  <section aria-labelledby={`${id}-heading`} className="space-y-4">
    <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 id={`${id}-heading`} className="text-base font-bold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
    {children}
  </section>
);

export const LorryProfilePage: React.FC = () => {
  const { lorryId = '' } = useParams<{ lorryId: string }>();
  const navigate = useNavigate();

  const lorry = useMemo(() => LorryService.getLorryById(lorryId), [lorryId]);
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
    // key={lorry.id} remounts every section when the lorry changes, so no state can leak across lorries
    <div key={lorry.id} className="space-y-8 pb-16">
      <div>
        <button
          onClick={goBack}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Lorry Management
        </button>

        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white sm:h-14 sm:w-14">
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
                {lorry.vehicleType} · {lorry.manufacturer} {lorry.model} · {lorry.loadCapacityTonnes} Tonnes ·{' '}
                <span className="font-mono">{lorry.id}</span>
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

      <Section id="maps" title="Maps & GPS Tracking" subtitle="Last reported location and route" icon={Map}>
        <MapsGpsTab lorryId={lorry.id} />
      </Section>

      <Section id="invoices" title="Invoice Management" subtitle="Invoices raised for this lorry" icon={FileText}>
        <InvoiceTab lorryId={lorry.id} />
      </Section>

      <Section id="diesel" title="Diesel Management" subtitle="Fuel consumption, cost and mileage" icon={Droplets}>
        <DieselTab lorryId={lorry.id} />
      </Section>

      <Section id="maintenance" title="Maintenance Management" subtitle="Service history, repairs and next service" icon={Wrench}>
        <MaintenanceTab lorryId={lorry.id} />
      </Section>

      <Section id="expenses" title="Expenses Management" subtitle="Tolls, driver allowances and other expenses" icon={Receipt}>
        <ExpensesTab lorryId={lorry.id} />
      </Section>

      <Section id="driver" title="Driver Management" subtitle="Assigned driver and driving licence" icon={UserRound}>
        <DriverTab lorry={lorry} />
      </Section>
    </div>
  );
};
