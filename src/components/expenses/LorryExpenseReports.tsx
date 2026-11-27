import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import { FuelReceiptService } from '../../services/fuelReceiptService';
import { MaintenanceService } from '../../services/maintenanceService';
import { TripService } from '../../services/tripService';
import {
  AggregatedExpenseItem,
  ExpenseReportPeriod,
  filterExpenseItems,
  getLorryExpenseItems,
  summarizeExpenseItems,
} from '../../utils/expensesAggregation';
import { getWeekBounds, shiftDateByDays } from '../../utils/tripDieselAnalytics';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface LorryExpenseReportsProps {
  lorry: Lorry;
}

const PERIOD_TABS: { key: ExpenseReportPeriod; label: string }[] = [
  { key: 'trip', label: 'Trip-wise' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

type CategoryFilterKey = 'ALL' | 'DIESEL' | 'MAINTENANCE' | 'DRIVER' | 'OTHER';

const CATEGORY_FILTERS: { key: CategoryFilterKey; label: string }[] = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'DIESEL', label: 'Diesel' },
  { key: 'MAINTENANCE', label: 'Maintenance & Repair' },
  { key: 'DRIVER', label: 'Driver Payments' },
  { key: 'OTHER', label: 'Other Operating' },
];

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

const PAY_BADGE: Record<AggregatedExpenseItem['paymentStatus'], string> = {
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  UNPAID: 'border-red-200 bg-red-50 text-red-700',
  PARTIAL: 'border-amber-200 bg-amber-50 text-amber-800',
};

export const LorryExpenseReports: React.FC<LorryExpenseReportsProps> = ({ lorry }) => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [period, setPeriod] = useState<ExpenseReportPeriod>('monthly');
  const [catFilter, setCatFilter] = useState<CategoryFilterKey>('ALL');

  const trips = useMemo(() => TripService.getByLorryId(lorry.id), [lorry.id]);
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id ?? '');
  const [weekAnchor, setWeekAnchor] = useState('2026-11-25');
  const [month, setMonth] = useState('11');
  const [year, setYear] = useState('2026');
  const [selectedItem, setSelectedItem] = useState<AggregatedExpenseItem | null>(null);

  useEffect(() => {
    setSelectedTripId(trips[0]?.id ?? '');
  }, [lorry.id, trips]);

  useEffect(() => {
    const u1 = FuelReceiptService.subscribe(() => setTick((t) => t + 1));
    const u2 = MaintenanceService.subscribe(() => setTick((t) => t + 1));
    return () => {
      u1();
      u2();
    };
  }, []);

  const allItems = useMemo(() => getLorryExpenseItems(lorry.id), [lorry.id, tick]);

  const periodItems = useMemo(
    () =>
      filterExpenseItems(allItems, period, {
        tripId: selectedTripId,
        weekAnchor,
        month: `${year}-${month}`,
        year,
      }),
    [allItems, period, selectedTripId, weekAnchor, month, year]
  );

  const visibleItems = useMemo(() => {
    if (catFilter === 'ALL') return periodItems;
    if (catFilter === 'DIESEL') return periodItems.filter((i) => i.sourceType === 'DIESEL');
    if (catFilter === 'MAINTENANCE') {
      return periodItems.filter((i) => i.sourceType === 'REPAIR' || i.sourceType === 'SERVICE');
    }
    if (catFilter === 'DRIVER') return periodItems.filter((i) => i.sourceType === 'DRIVER_PAYMENT');
    return periodItems.filter((i) => i.sourceType === 'HANDLING' || i.sourceType === 'OTHER_EXPENSE');
  }, [periodItems, catFilter]);

  const summary = useMemo(() => summarizeExpenseItems(visibleItems), [visibleItems]);
  const weekBounds = useMemo(() => getWeekBounds(weekAnchor), [weekAnchor]);

  return (
    <div className="space-y-5">
      {/* Filter Controls Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Expense History &amp; Reports —{' '}
              <span className="font-mono">{lorry.registrationNumber}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Filter saved Diesel &amp; Maintenance expenses by Trip, Week, Month, or Year.
            </p>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
            Demo · Temporary Session
          </span>
        </div>

        {/* 4 Report Period Tabs */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PERIOD_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setPeriod(t.key)}
              className={clsx(
                'min-h-[44px] rounded-lg border px-3 text-xs font-bold transition-colors',
                period === t.key
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Period Selector + Category Filter */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {period === 'trip' && (
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

            {period === 'weekly' && (
              <div className="flex items-center gap-2">
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

            {period === 'monthly' && (
              <div className="flex items-center gap-2">
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

            {period === 'yearly' && (
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

          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((cf) => (
              <button
                key={cf.key}
                type="button"
                onClick={() => setCatFilter(cf.key)}
                className={clsx(
                  'min-h-[38px] rounded-lg border px-2.5 text-[11px] font-semibold transition-colors',
                  catFilter === cf.key
                    ? 'border-[#0b1329] bg-[#0b1329] text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                )}
              >
                {cf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Period Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-[#0b1329] p-3.5 text-white">
          <p className="text-[10px] font-semibold uppercase text-slate-300">Filtered Total</p>
          <p className="mt-1 text-lg font-bold">{formatINR(summary.totalRecorded)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <p className="text-[10px] font-semibold uppercase text-emerald-700">Paid</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{formatINR(summary.totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <p className="text-[10px] font-semibold uppercase text-red-600">Unpaid / Pending</p>
          <p className="mt-1 text-lg font-bold text-red-600">{formatINR(summary.totalUnpaid)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Records</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{summary.count}</p>
        </div>
      </div>

      {/* Expense History Table (Desktop) & Cards (Mobile) */}
      {visibleItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-semibold text-slate-800">
            No expenses found for this period
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Unlinked expenses remain unassigned and do not appear under specific trips.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="space-y-2.5 md:hidden">
            {visibleItems.map((item) => (
              <button
                key={item.uniqueKey}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.category}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatDateOnly(item.date)} · {item.sourceModule}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {formatINR(item.amount)}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{item.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                    Trip: {item.tripId ?? 'Unassigned'}
                  </span>
                  <span
                    className={clsx(
                      'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                      PAY_BADGE[item.paymentStatus]
                    )}
                  >
                    {item.statusLabel}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Trip ID</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Source Module</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleItems.map((item) => (
                    <tr
                      key={item.uniqueKey}
                      onClick={() => setSelectedItem(item)}
                      className="cursor-pointer transition-colors hover:bg-blue-50/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                        {formatDateOnly(item.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">
                        {item.tripId ?? <span className="text-slate-400">Unassigned</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">
                        {item.category}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={item.description}>
                        {item.description}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {item.sourceModule}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={clsx(
                            'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                            PAY_BADGE[item.paymentStatus]
                          )}
                        >
                          {item.statusLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Source Record Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.category ?? 'Expense Record'}
        subtitle={selectedItem ? `${formatDateOnly(selectedItem.date)} · ${lorry.registrationNumber}` : ''}
        maxWidth="md"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="space-y-2">
              {Object.entries(selectedItem.details).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 text-xs"
                >
                  <span className="font-semibold text-slate-500">{k}</span>
                  <span className="text-right font-medium text-slate-900">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedItem(null)}
                className="min-h-[44px]"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                leftIcon={<ExternalLink className="h-4 w-4" />}
                onClick={() => {
                  const dest = selectedItem.sourceRoute;
                  setSelectedItem(null);
                  navigate(dest);
                }}
                className="min-h-[44px]"
              >
                Open Original Source
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
