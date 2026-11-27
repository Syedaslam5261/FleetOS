import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
} from '../../utils/expensesAggregation';
import {
  buildLorryPeriodFinancialReport,
  buildTripFinancialStatement,
} from '../../utils/tripProfitLoss';
import { getWeekBounds, shiftDateByDays } from '../../utils/tripDieselAnalytics';
import { TripFinancialStatementView } from './TripFinancialStatementView';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface LorryExpenseReportsProps {
  lorry: Lorry;
  onOpenTrip?: (tripId: string) => void;
}

const PERIOD_TABS: { key: ExpenseReportPeriod; label: string }[] = [
  { key: 'trip', label: 'Trip-wise' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
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

export const LorryExpenseReports: React.FC<LorryExpenseReportsProps> = ({
  lorry,
  onOpenTrip,
}) => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [period, setPeriod] = useState<ExpenseReportPeriod>('monthly');

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

  const selectedTripStatement = useMemo(() => {
    if (period !== 'trip') return null;
    const trip = trips.find((t) => t.id === selectedTripId);
    if (!trip) return null;
    return buildTripFinancialStatement(lorry.id, trip, allItems);
  }, [period, trips, selectedTripId, lorry.id, allItems]);

  const periodReport = useMemo(() => {
    if (period === 'trip') return null;
    return buildLorryPeriodFinancialReport(lorry.id, period, {
      weekAnchor,
      month: `${year}-${month}`,
      year,
    });
  }, [lorry.id, period, weekAnchor, month, year, tick]);

  const periodExpenses = useMemo(
    () =>
      filterExpenseItems(allItems, period, {
        tripId: selectedTripId,
        weekAnchor,
        month: `${year}-${month}`,
        year,
      }),
    [allItems, period, selectedTripId, weekAnchor, month, year]
  );

  const weekBounds = useMemo(() => getWeekBounds(weekAnchor), [weekAnchor]);

  return (
    <div className="space-y-5">
      {/* Filter Controls Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Financial Reports &amp; P&amp;L —{' '}
              <span className="font-mono">{lorry.registrationNumber}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated from Trip Statements, Invoices, Diesel Receipts &amp; Maintenance records.
            </p>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
            Demo · Temporary Session
          </span>
        </div>

        {/* 4 Reporting Views */}
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

        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
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
      </div>

      {/* TRIP-WISE VIEW: Full Trip Financial Statement */}
      {period === 'trip' &&
        (selectedTripStatement ? (
          <TripFinancialStatementView lorry={lorry} statement={selectedTripStatement} />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BarChart3 className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-800">No trips recorded</p>
            <p className="mt-1 text-xs text-slate-500">
              This lorry has no trips available for a Trip-wise P&amp;L statement.
            </p>
          </div>
        ))}

      {/* WEEKLY / MONTHLY / YEARLY AGGREGATED FINANCIAL REPORT */}
      {period !== 'trip' && periodReport && (
        <div className="space-y-5">
          {/* 6 Key Financial Metrics */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Total Trips</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{periodReport.totalTrips}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Total Revenue</p>
              <p className="mt-1 font-mono text-base font-bold text-slate-900">
                {formatINR(periodReport.totalRevenue)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[10px] font-semibold uppercase text-slate-500">Total Expenses</p>
              <p className="mt-1 font-mono text-base font-bold text-slate-900">
                {formatINR(periodReport.totalExpenses)}
              </p>
            </div>
            <div
              className={clsx(
                'rounded-xl border p-3.5 shadow-sm',
                periodReport.netProfit >= 0
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-red-200 bg-red-50/70'
              )}
            >
              <p className="text-[10px] font-semibold uppercase text-slate-600">Net Profit / Loss</p>
              <p
                className={clsx(
                  'mt-1 font-mono text-base font-bold',
                  periodReport.netProfit >= 0 ? 'text-emerald-800' : 'text-red-700'
                )}
              >
                {formatINR(periodReport.netProfit)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[10px] font-semibold uppercase text-emerald-700">Customer Received</p>
              <p className="mt-1 font-mono text-base font-bold text-emerald-800">
                {formatINR(periodReport.customerReceived)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[10px] font-semibold uppercase text-amber-800">Customer Pending</p>
              <p className="mt-1 font-mono text-base font-bold text-amber-800">
                {formatINR(periodReport.customerPending)}
              </p>
            </div>
          </div>

          {/* Most Profitable Trip & Loss-Making Trips */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-800">
                <Award className="h-4 w-4" />
                Most Profitable Trip
              </div>
              {periodReport.mostProfitableTrip ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenTrip) onOpenTrip(periodReport.mostProfitableTrip!.trip.id);
                    else {
                      setSelectedTripId(periodReport.mostProfitableTrip!.trip.id);
                      setPeriod('trip');
                    }
                  }}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {periodReport.mostProfitableTrip.trip.id} ·{' '}
                      {periodReport.mostProfitableTrip.trip.startLocation} →{' '}
                      {periodReport.mostProfitableTrip.trip.destination}
                    </p>
                    <p className="text-xs text-slate-600">
                      Revenue {formatINR(periodReport.mostProfitableTrip.totalRevenue)} · Expenses{' '}
                      {formatINR(periodReport.mostProfitableTrip.totalExpenses)}
                    </p>
                  </div>
                  <span className="font-mono text-base font-bold text-emerald-800">
                    {formatINR(periodReport.mostProfitableTrip.netProfit)}
                  </span>
                </button>
              ) : (
                <p className="text-xs text-slate-600">No completed revenue trips in this period.</p>
              )}
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-red-800">
                <AlertTriangle className="h-4 w-4" />
                Loss-Making Trips ({periodReport.lossMakingTrips.length})
              </div>
              {periodReport.lossMakingTrips.length === 0 ? (
                <p className="text-xs text-slate-600">No loss-making trips in this period.</p>
              ) : (
                <div className="space-y-1.5">
                  {periodReport.lossMakingTrips.map((lt) => (
                    <button
                      key={lt.trip.id}
                      type="button"
                      onClick={() => {
                        if (onOpenTrip) onOpenTrip(lt.trip.id);
                        else {
                          setSelectedTripId(lt.trip.id);
                          setPeriod('trip');
                        }
                      }}
                      className="flex w-full items-center justify-between rounded-lg bg-white/80 px-3 py-1.5 text-left text-xs hover:bg-white"
                    >
                      <span className="font-semibold text-slate-900">
                        {lt.trip.id} · {lt.trip.startLocation} → {lt.trip.destination}
                      </span>
                      <span className="font-mono font-bold text-red-700">
                        {formatINR(lt.netProfit)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Revenue vs Expenses Chart & Category-wise Expense Breakdown */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Revenue vs. Expenses by Trip
              </h3>
              {periodReport.chartData.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-500">
                  No trip data available to chart for this period.
                </p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={periodReport.chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip
                        formatter={(val: number) => formatINR(val)}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="#0b1329" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Category Expense Breakdown</h3>
              {periodReport.categoryBreakdown.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">No expenses in this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {periodReport.categoryBreakdown.map((cat) => {
                    const pct =
                      periodReport.totalExpenses > 0
                        ? Math.round((cat.amount / periodReport.totalExpenses) * 100)
                        : 0;
                    return (
                      <div key={cat.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">{cat.label}</span>
                          <span className="font-mono font-bold text-slate-900">
                            {formatINR(cat.amount)}{' '}
                            <span className="font-normal text-slate-500">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Itemized Expense Ledger for Period */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900">
              Itemized Expense Transactions ({periodExpenses.length})
            </h3>
            {periodExpenses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
                No expense transactions in this period.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                      {periodExpenses.map((item) => (
                        <tr
                          key={item.uniqueKey}
                          onClick={() => setSelectedItem(item)}
                          className="cursor-pointer hover:bg-blue-50/40"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                            {formatDateOnly(item.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">
                            {item.tripId ?? <span className="text-slate-400">Unassigned</span>}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-900">
                            {item.category}
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-slate-600">
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
            )}
          </div>
        </div>
      )}

      {/* Source Record Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.category ?? 'Expense Record'}
        subtitle={selectedItem ? `${formatDateOnly(selectedItem.date)} · ${selectedItem.id}` : ''}
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
              <Button type="button" variant="secondary" onClick={() => setSelectedItem(null)} className="min-h-[44px]">
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
