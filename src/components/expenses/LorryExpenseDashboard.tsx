import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Droplets,
  ExternalLink,
  Info,
  Receipt,
  UserRound,
  Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import { FuelReceiptService } from '../../services/fuelReceiptService';
import { MaintenanceService } from '../../services/maintenanceService';
import {
  AggregatedExpenseItem,
  getLorryExpenseItems,
  summarizeExpenseItems,
} from '../../utils/expensesAggregation';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface LorryExpenseDashboardProps {
  lorry: Lorry;
  onOpenReports: () => void;
}

const PAY_BADGE: Record<AggregatedExpenseItem['paymentStatus'], string> = {
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  UNPAID: 'border-red-200 bg-red-50 text-red-700',
  PARTIAL: 'border-amber-200 bg-amber-50 text-amber-800',
};

export const LorryExpenseDashboard: React.FC<LorryExpenseDashboardProps> = ({
  lorry,
  onOpenReports,
}) => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [selectedItem, setSelectedItem] = useState<AggregatedExpenseItem | null>(null);

  useEffect(() => {
    const u1 = FuelReceiptService.subscribe(() => setTick((t) => t + 1));
    const u2 = MaintenanceService.subscribe(() => setTick((t) => t + 1));
    return () => {
      u1();
      u2();
    };
  }, []);

  const items = useMemo(() => getLorryExpenseItems(lorry.id), [lorry.id, tick]);
  const summary = useMemo(() => summarizeExpenseItems(items), [items]);

  const breakdown = useMemo(() => {
    const segments = [
      { label: 'Diesel', amount: summary.dieselExpenses, bar: 'bg-indigo-600', dot: 'bg-indigo-600' },
      { label: 'Maintenance & Repair', amount: summary.maintenanceAndRepair, bar: 'bg-blue-600', dot: 'bg-blue-600' },
      { label: 'Driver Payments', amount: summary.driverPayments, bar: 'bg-emerald-600', dot: 'bg-emerald-600' },
      { label: 'Other Operating', amount: summary.otherOperating, bar: 'bg-amber-500', dot: 'bg-amber-500' },
    ];
    return segments;
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              Expenses Dashboard — <span className="font-mono">{lorry.registrationNumber}</span>
            </h1>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Demo · Temporary Session
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {lorry.manufacturer} {lorry.model} · {lorry.vehicleType} · Auto-synced from Diesel Management &amp; Maintenance Management
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
          Expense History &amp; Reports
        </Button>
      </div>

      {/* Read-only Source Sync Notice */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 flex-shrink-0 text-blue-600" />
          <span>
            Live consolidated view — updates or deletions in <strong>Diesel Management</strong> and{' '}
            <strong>Maintenance Management</strong> appear here automatically without duplication.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/fleet/${lorry.id}/diesel`)}
            className="font-semibold text-blue-700 underline hover:text-blue-900"
          >
            Open Diesel
          </button>
          <span className="text-blue-300">·</span>
          <button
            type="button"
            onClick={() => navigate(`/fleet/${lorry.id}/maintenance`)}
            className="font-semibold text-blue-700 underline hover:text-blue-900"
          >
            Open Maintenance
          </button>
        </div>
      </div>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl bg-[#0b1329] p-4 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
            Total Recorded Expenses
          </p>
          <p className="mt-1.5 text-xl font-bold">{formatINR(summary.totalRecorded)}</p>
          <p className="mt-1 text-[11px] text-slate-300">
            Paid {formatINR(summary.totalPaid)} · Unpaid {formatINR(summary.totalUnpaid)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Diesel Expenses
            </p>
            <Droplets className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-1.5 text-lg font-bold text-slate-900">
            {formatINR(summary.dieselExpenses)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Saved fuel receipts only</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Maintenance &amp; Repair
            </p>
            <Wrench className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-1.5 text-lg font-bold text-slate-900">
            {formatINR(summary.maintenanceAndRepair)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Repairs {formatINR(summary.repairSubtotal)} · Service {formatINR(summary.serviceSubtotal)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Driver Payments
            </p>
            <UserRound className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1.5 text-lg font-bold text-slate-900">
            {formatINR(summary.driverPayments)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Paid {formatINR(summary.driverPaid)} · Pending {formatINR(summary.driverPending)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Other Trip &amp; Operating
            </p>
            <Receipt className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-1.5 text-lg font-bold text-slate-900">
            {formatINR(summary.otherOperating)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Handling {formatINR(summary.handlingSubtotal)} · Other {formatINR(summary.otherSubtotal)}
          </p>
        </div>
      </div>

      {/* Category Distribution Bar */}
      {summary.totalRecorded > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Expense Breakdown by Category</h2>
            <span className="text-xs font-semibold text-slate-500">{summary.count} source records</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            {breakdown
              .filter((b) => b.amount > 0)
              .map((b) => (
                <div
                  key={b.label}
                  style={{ width: `${(b.amount / summary.totalRecorded) * 100}%` }}
                  className={b.bar}
                  title={`${b.label}: ${formatINR(b.amount)}`}
                />
              ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {breakdown.map((b) => {
              const pct = Math.round((b.amount / summary.totalRecorded) * 100);
              return (
                <div key={b.label} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${b.dot}`} />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-600">{b.label}</p>
                    <p className="text-xs font-bold text-slate-900">
                      {formatINR(b.amount)}{' '}
                      <span className="font-normal text-slate-500">({pct}%)</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Expenses Preview */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Recorded Expenses</h2>
            <p className="text-xs text-slate-500">
              Tap any record to view full details or open its original source module.
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={onOpenReports}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              View All &amp; Filter Reports →
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Receipt className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-800">
              No expense records for {lorry.registrationNumber}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Add diesel receipts in Diesel Management or repairs, service, driver payments, and trip costs in Maintenance Management.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 8).map((item) => (
              <button
                key={item.uniqueKey}
                type="button"
                onClick={() => setSelectedItem(item)}
                className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{item.category}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {item.sourceModule}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                      {item.tripId ?? 'Unassigned'}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-600">
                    {formatDateOnly(item.date)} · {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end flex-shrink-0">
                  <span
                    className={clsx(
                      'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                      PAY_BADGE[item.paymentStatus]
                    )}
                  >
                    {item.statusLabel}
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {formatINR(item.amount)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Source Record Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.category ?? 'Expense Details'}
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
