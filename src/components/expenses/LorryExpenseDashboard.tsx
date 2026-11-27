import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Receipt,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import { FuelReceiptService } from '../../services/fuelReceiptService';
import { MaintenanceService } from '../../services/maintenanceService';
import {
  buildLorryPeriodFinancialReport,
  FinancialPeriodMode,
} from '../../utils/tripProfitLoss';
import { AggregatedExpenseItem } from '../../utils/expensesAggregation';
import { getWeekBounds, shiftDateByDays } from '../../utils/tripDieselAnalytics';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface LorryExpenseDashboardProps {
  lorry: Lorry;
  onOpenReports: () => void;
  onOpenTrip: (tripId: string) => void;
}

const PERIOD_MODES: { key: FinancialPeriodMode; label: string }[] = [
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

export const LorryExpenseDashboard: React.FC<LorryExpenseDashboardProps> = ({
  lorry,
  onOpenReports,
  onOpenTrip,
}) => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [mode, setMode] = useState<FinancialPeriodMode>('monthly');
  const [weekAnchor, setWeekAnchor] = useState('2026-11-25');
  const [month, setMonth] = useState('11');
  const [year, setYear] = useState('2026');
  const [selectedUnassigned, setSelectedUnassigned] = useState<AggregatedExpenseItem | null>(null);

  useEffect(() => {
    const u1 = FuelReceiptService.subscribe(() => setTick((t) => t + 1));
    const u2 = MaintenanceService.subscribe(() => setTick((t) => t + 1));
    return () => {
      u1();
      u2();
    };
  }, []);

  const report = useMemo(
    () =>
      buildLorryPeriodFinancialReport(lorry.id, mode, {
        weekAnchor,
        month: `${year}-${month}`,
        year,
      }),
    [lorry.id, mode, weekAnchor, month, year, tick]
  );

  const weekBounds = useMemo(() => getWeekBounds(weekAnchor), [weekAnchor]);

  return (
    <div className="space-y-6">
      {/* Header Banner + Date Filter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                Financial Dashboard — <span className="font-mono">{lorry.registrationNumber}</span>
              </h1>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Demo · Temporary Session
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {lorry.manufacturer} {lorry.model} · {lorry.vehicleType} · Auto-synced from Trips, Invoices, Diesel &amp; Maintenance
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<BarChart3 className="h-4 w-4" />}
            onClick={onOpenReports}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Financial Reports &amp; Charts
          </Button>
        </div>

        {/* Weekly / Monthly / Yearly Period Selector */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {PERIOD_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={clsx(
                  'min-h-[38px] rounded-md px-3.5 text-xs font-bold transition-colors',
                  mode === m.key
                    ? 'bg-[#0b1329] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mode === 'weekly' && (
              <>
                <button
                  type="button"
                  onClick={() => setWeekAnchor(shiftDateByDays(weekAnchor, -7))}
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
                  {formatDateOnly(weekBounds.start)} – {formatDateOnly(weekBounds.end)}
                </span>
                <button
                  type="button"
                  onClick={() => setWeekAnchor(shiftDateByDays(weekAnchor, 7))}
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  aria-label="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {mode === 'monthly' && (
              <>
                <select
                  aria-label="Month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
                >
                  {['2025', '2026', '2027'].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            {mode === 'yearly' && (
              <select
                aria-label="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
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
      </div>

      {/* 6 Required Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Total Revenue
          </p>
          <p className="mt-1.5 font-mono text-lg font-bold text-slate-900">
            {formatINR(report.totalRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Earned ({report.totalTrips} trips)</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Total Expenses
          </p>
          <p className="mt-1.5 font-mono text-lg font-bold text-slate-900">
            {formatINR(report.totalExpenses)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Paid {formatINR(report.expensesPaid)} · Unpaid {formatINR(report.expensesPending)}
          </p>
        </div>

        <div
          className={clsx(
            'rounded-xl border p-4 shadow-sm',
            report.netProfit >= 0
              ? 'border-emerald-200 bg-emerald-50/60'
              : 'border-red-200 bg-red-50/60'
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Net Profit / Loss
          </p>
          <p
            className={clsx(
              'mt-1.5 font-mono text-lg font-bold',
              report.netProfit >= 0 ? 'text-emerald-800' : 'text-red-700'
            )}
          >
            {formatINR(report.netProfit)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-600">
            {report.netProfit >= 0 ? 'PROFIT' : 'LOSS'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Profit Margin
          </p>
          <p className="mt-1.5 font-mono text-lg font-bold text-[#0b1329]">
            {report.profitMarginPct !== null ? `${report.profitMarginPct.toFixed(1)}%` : '—'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Net ÷ Revenue</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            Customer Received
          </p>
          <p className="mt-1.5 font-mono text-lg font-bold text-emerald-800">
            {formatINR(report.customerReceived)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Cash collected</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            Customer Pending
          </p>
          <p className="mt-1.5 font-mono text-lg font-bold text-amber-800">
            {formatINR(report.customerPending)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Outstanding receivable</p>
        </div>
      </div>

      {/* Prominent Trip-wise Profit & Loss Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Trip-wise Profit &amp; Loss ({report.trips.length})
            </h2>
            <p className="text-xs text-slate-500">
              Click any trip to open its complete financial statement (freight, diesel, repairs, driver &amp; margin).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => navigate(`/fleet/${lorry.id}/diesel`)}
              className="font-semibold text-blue-600 hover:underline"
            >
              Diesel
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => navigate(`/fleet/${lorry.id}/maintenance`)}
              className="font-semibold text-blue-600 hover:underline"
            >
              Maintenance
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => navigate(`/fleet/${lorry.id}/invoices`)}
              className="font-semibold text-blue-600 hover:underline"
            >
              Invoices
            </button>
          </div>
        </div>

        {report.trips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-10 text-center">
            <Receipt className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-800">
              No trips recorded in this period
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Switch to Monthly or Yearly view, or select another period to inspect trip P&amp;L.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {report.trips.map((st) => (
              <button
                key={st.trip.id}
                type="button"
                onClick={() => onOpenTrip(st.trip.id)}
                className="group flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/20 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-[#0b1329] px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                      {st.trip.id}
                    </span>
                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                      {st.trip.startLocation} → {st.trip.destination}
                    </span>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase',
                        st.status === 'PROFIT'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : st.status === 'LOSS'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                      )}
                    >
                      {st.status === 'PROFIT' && <TrendingUp className="h-3 w-3" />}
                      {st.status === 'LOSS' && <TrendingDown className="h-3 w-3" />}
                      {st.status === 'INCOMPLETE' && <AlertTriangle className="h-3 w-3" />}
                      {st.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Trip Date: {formatDateOnly(st.trip.startDate)} · {st.expenses.length} linked expense records
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 lg:border-0 lg:pt-0">
                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Revenue</p>
                      <p className="font-mono text-xs font-bold text-slate-900 sm:text-sm">
                        {st.hasRevenue ? formatINR(st.totalRevenue) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Expenses</p>
                      <p className="font-mono text-xs font-bold text-slate-900 sm:text-sm">
                        {formatINR(st.totalExpenses)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Net P&amp;L</p>
                      <p
                        className={clsx(
                          'font-mono text-xs font-bold sm:text-sm',
                          st.status === 'PROFIT'
                            ? 'text-emerald-700'
                            : st.status === 'LOSS'
                              ? 'text-red-600'
                              : 'text-amber-700'
                        )}
                      >
                        {st.status === 'INCOMPLETE' ? 'Incomplete' : formatINR(st.netProfit)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-blue-600" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Unassigned Expenses (Explicitly Kept Separate from Trips) */}
      {report.unassignedExpenses.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Unassigned Lorry Expenses ({report.unassignedExpenses.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Records without a Trip ID remain unassigned and are never guessed onto trips.
                </p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-slate-900">
              {formatINR(report.unassignedExpensesTotal)}
            </span>
          </div>

          <div className="space-y-2">
            {report.unassignedExpenses.map((item) => (
              <button
                key={item.uniqueKey}
                type="button"
                onClick={() => setSelectedUnassigned(item)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5 text-left text-xs hover:border-blue-300 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">
                    {item.category}{' '}
                    <span className="font-normal text-slate-500">· {formatDateOnly(item.date)}</span>
                  </p>
                  <p className="truncate text-slate-600">{item.description}</p>
                </div>
                <span className="font-mono font-bold text-slate-900 flex-shrink-0">
                  {formatINR(item.amount)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unassigned Expense Source Detail Modal */}
      <Modal
        isOpen={!!selectedUnassigned}
        onClose={() => setSelectedUnassigned(null)}
        title={selectedUnassigned?.category ?? 'Unassigned Expense'}
        subtitle={selectedUnassigned ? `${formatDateOnly(selectedUnassigned.date)} · Unassigned` : ''}
        maxWidth="md"
      >
        {selectedUnassigned && (
          <div className="space-y-4">
            <div className="space-y-2">
              {Object.entries(selectedUnassigned.details).map(([k, v]) => (
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
              <Button type="button" variant="secondary" onClick={() => setSelectedUnassigned(null)} className="min-h-[44px]">
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                leftIcon={<ExternalLink className="h-4 w-4" />}
                onClick={() => {
                  const dest = selectedUnassigned.sourceRoute;
                  setSelectedUnassigned(null);
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
