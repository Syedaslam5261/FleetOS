import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FileText,
  Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import { ConsolidatedCostEntry, CostReportFilter } from '../../types/maintenance';
import { MaintenanceService } from '../../services/maintenanceService';
import { FuelReceiptService } from '../../services/fuelReceiptService';
import { TripService } from '../../services/tripService';
import { buildConsolidatedCostReport } from '../../utils/maintenanceAnalytics';
import { getWeekBounds, shiftDateByDays } from '../../utils/tripDieselAnalytics';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface MaintenanceCostReportsSectionProps {
  lorry: Lorry;
}

const FILTER_TABS: { key: CostReportFilter; label: string }[] = [
  { key: 'trip', label: 'Trip-wise' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const SOURCE_BADGE: Record<ConsolidatedCostEntry['source'], string> = {
  REPAIR: 'bg-red-50 text-red-700 border-red-200',
  SERVICE: 'bg-blue-50 text-blue-700 border-blue-200',
  DRIVER_PAYMENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HANDLING: 'bg-amber-50 text-amber-800 border-amber-200',
  OTHER_EXPENSE: 'bg-slate-100 text-slate-700 border-slate-200',
  DIESEL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const SOURCE_LABELS: Record<ConsolidatedCostEntry['source'], string> = {
  REPAIR: 'Repair',
  SERVICE: 'Service',
  DRIVER_PAYMENT: 'Driver',
  HANDLING: 'Load/Unload',
  OTHER_EXPENSE: 'Other',
  DIESEL: 'Diesel',
};

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const MaintenanceCostReportsSection: React.FC<MaintenanceCostReportsSectionProps> = ({
  lorry,
}) => {
  const [tick, setTick] = useState(0);
  const [mode, setMode] = useState<CostReportFilter>('monthly');

  const trips = useMemo(() => TripService.getByLorryId(lorry.id), [lorry.id]);
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id ?? '');
  const [weekAnchor, setWeekAnchor] = useState('2026-11-25');
  const [month, setMonth] = useState('11');
  const [year, setYear] = useState('2026');
  const [selectedEntry, setSelectedEntry] = useState<ConsolidatedCostEntry | null>(null);

  useEffect(() => {
    setSelectedTripId(trips[0]?.id ?? '');
  }, [lorry.id, trips]);

  useEffect(() => {
    const unsubM = MaintenanceService.subscribe(() => setTick((t) => t + 1));
    const unsubF = FuelReceiptService.subscribe(() => setTick((t) => t + 1));
    return () => {
      unsubM();
      unsubF();
    };
  }, []);

  const report = useMemo(
    () =>
      buildConsolidatedCostReport(lorry.id, mode, {
        tripId: selectedTripId,
        weekAnchor,
        month: `${year}-${month}`,
        year,
      }),
    [lorry.id, mode, selectedTripId, weekAnchor, month, year, tick]
  );

  const weekBounds = useMemo(() => getWeekBounds(weekAnchor), [weekAnchor]);

  return (
    <div className="space-y-5">
      {/* Header & 4 Filter Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Consolidated Lorry Cost Reports —{' '}
              <span className="font-mono">{lorry.registrationNumber}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Repairs, service, driver payments, handling, other expenses &amp; saved diesel purchases counted once.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-medium text-blue-800">
            <Info className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Fuel Calculator estimates excluded</span>
          </div>
        </div>

        {/* Strictly 4 Report Filters */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMode(tab.key)}
              className={clsx(
                'min-h-[44px] rounded-lg border px-3 text-xs font-bold transition-colors',
                mode === tab.key
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Period Picker */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {mode === 'trip' && (
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="min-h-[44px] w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
            >
              {trips.length === 0 ? (
                <option value="">No trips recorded for this lorry</option>
              ) : (
                trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} · {t.startLocation} → {t.destination} ({formatDateOnly(t.startDate)})
                  </option>
                ))
              )}
            </select>
          )}

          {mode === 'weekly' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekAnchor(shiftDateByDays(weekAnchor, -7))}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800">
                {formatDateOnly(weekBounds.start)} – {formatDateOnly(weekBounds.end)}
              </span>
              <button
                type="button"
                onClick={() => setWeekAnchor(shiftDateByDays(weekAnchor, 7))}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {mode === 'monthly' && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
              >
                {['2025', '2026', '2027'].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'yearly' && (
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
            >
              {['2025', '2026', '2027'].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Total Operating Expenses Hero Card */}
      <div className="rounded-xl bg-[#0b1329] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Total Recorded Operating Expenses
            </p>
            <p className="mt-1 text-2xl font-bold sm:text-3xl">
              {formatINR(report.totals.totalOperatingExpenses)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg bg-white/10 px-3.5 py-2">
              <p className="text-[10px] font-semibold uppercase text-emerald-300">Paid</p>
              <p className="text-sm font-bold text-white">{formatINR(report.totals.totalPaid)}</p>
            </div>
            <div className="rounded-lg bg-white/10 px-3.5 py-2">
              <p className="text-[10px] font-semibold uppercase text-amber-300">Unpaid / Pending</p>
              <p className="text-sm font-bold text-white">{formatINR(report.totals.totalUnpaid)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Repairs</p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {formatINR(report.totals.repairExpenses)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Service &amp; Parts</p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {formatINR(report.totals.serviceExpenses)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Driver Payments</p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {formatINR(report.totals.driverPayments)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Load &amp; Unload</p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {formatINR(report.totals.loadingUnloading)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">Other Expenses</p>
          <p className="mt-1 text-base font-bold text-slate-900">
            {formatINR(report.totals.otherExpenses)}
          </p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 shadow-sm">
          <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
            <Droplets className="h-3 w-3" />
            Diesel (Receipts)
          </p>
          <p className="mt-1 text-base font-bold text-indigo-950">
            {formatINR(report.totals.dieselExpenses)}
          </p>
        </div>
      </div>

      {/* Individual Expense Records */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Itemized Records ({report.entries.length})
          </h3>
          <span className="text-xs text-slate-500">Tap any record to inspect details</span>
        </div>

        {report.entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BarChart3 className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-800">
              No cost records in this period
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try choosing another trip, week, month, or year.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {report.entries.map((entry) => (
              <button
                key={`${entry.source}-${entry.id}`}
                type="button"
                onClick={() => setSelectedEntry(entry)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-slate-50/60"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={clsx(
                        'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                        SOURCE_BADGE[entry.source]
                      )}
                    >
                      {SOURCE_LABELS[entry.source]}
                    </span>
                    <span className="truncate text-sm font-bold text-slate-900">
                      {entry.label}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {formatDateOnly(entry.date)} · {entry.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{formatINR(entry.amount)}</p>
                    <p className="text-[10px] font-semibold text-slate-500">{entry.statusLabel}</p>
                  </div>
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry?.label ?? 'Record Details'}
        subtitle={selectedEntry ? `${formatDateOnly(selectedEntry.date)} · ${lorry.registrationNumber}` : ''}
        maxWidth="md"
      >
        {selectedEntry && (
          <div className="space-y-2.5">
            {Object.entries(selectedEntry.details).map(([k, v]) => (
              <div
                key={k}
                className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 text-xs"
              >
                <span className="font-semibold text-slate-500">{k}</span>
                <span className="text-right font-medium text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
