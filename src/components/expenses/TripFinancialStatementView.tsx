import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Droplets,
  ExternalLink,
  FileText,
  TrendingDown,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import { TripFinancialStatement } from '../../utils/tripProfitLoss';
import { AggregatedExpenseItem } from '../../utils/expensesAggregation';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface TripFinancialStatementViewProps {
  lorry: Lorry;
  statement: TripFinancialStatement;
}

const PAY_BADGE: Record<AggregatedExpenseItem['paymentStatus'], string> = {
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  UNPAID: 'border-red-200 bg-red-50 text-red-700',
  PARTIAL: 'border-amber-200 bg-amber-50 text-amber-800',
};

export const TripFinancialStatementView: React.FC<TripFinancialStatementViewProps> = ({
  lorry,
  statement,
}) => {
  const navigate = useNavigate();
  const [selectedTx, setSelectedTx] = useState<AggregatedExpenseItem | null>(null);

  const nonDieselExpenses = statement.expenses.filter((e) => e.sourceType !== 'DIESEL');

  return (
    <div className="space-y-6">
      {/* Trip Header & PROFIT / LOSS / INCOMPLETE Indicator */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#0b1329] px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                {statement.trip.id}
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                Demo · Temporary Session
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              {statement.trip.startLocation} → {statement.trip.destination}
            </h1>
            <p className="text-xs text-slate-500">
              Lorry <span className="font-mono font-semibold text-slate-800">{lorry.registrationNumber}</span> · Trip Date:{' '}
              {formatDateOnly(statement.trip.startDate)} – {formatDateOnly(statement.trip.completionDate)} · Status:{' '}
              <span className="font-semibold text-slate-700">{statement.trip.status}</span>
            </p>
          </div>

          <div
            className={clsx(
              'inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2.5 sm:self-center',
              statement.status === 'PROFIT'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : statement.status === 'LOSS'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
            )}
          >
            {statement.status === 'PROFIT' && <TrendingUp className="h-5 w-5" />}
            {statement.status === 'LOSS' && <TrendingDown className="h-5 w-5" />}
            {statement.status === 'INCOMPLETE' && <AlertTriangle className="h-5 w-5" />}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider">{statement.status}</p>
              <p className="font-mono text-base font-bold">
                {statement.status === 'INCOMPLETE'
                  ? 'Incomplete'
                  : formatINR(statement.netProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Incomplete Financial Statement Warning */}
        {statement.missingDataNotes.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              Incomplete Financial Statement (missing values are never invented)
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {statement.missingDataNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Final P&L Calculation Summary Card */}
      <div className="rounded-xl bg-[#0b1329] p-5 text-white shadow-sm">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              Total Revenue Earned
            </p>
            <p className="mt-1 font-mono text-lg font-bold sm:text-xl">
              {formatINR(statement.totalRevenue)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-300">
              Freight + Additional Charges
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              Total Trip Expenses
            </p>
            <p className="mt-1 font-mono text-lg font-bold sm:text-xl">
              {formatINR(statement.totalExpenses)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-300">
              Paid {formatINR(statement.expensesPaid)} · Pending {formatINR(statement.expensesPending)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              Net Profit / Loss
            </p>
            <p
              className={clsx(
                'mt-1 font-mono text-lg font-bold sm:text-xl',
                statement.status === 'PROFIT'
                  ? 'text-emerald-400'
                  : statement.status === 'LOSS'
                    ? 'text-red-400'
                    : 'text-amber-300'
              )}
            >
              {statement.status === 'INCOMPLETE'
                ? 'Incomplete'
                : formatINR(statement.netProfit)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-300">
              Revenue Earned − Expenses Incurred
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              Profit Margin
            </p>
            <p className="mt-1 font-mono text-lg font-bold sm:text-xl">
              {statement.profitMarginPct !== null ? `${statement.profitMarginPct.toFixed(1)}%` : '—'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-300">
              (Net Profit ÷ Revenue) × 100
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: REVENUE (Earned vs Cash Received) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">1. Trip Revenue &amp; Customer Payments</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/fleet/${lorry.id}/invoices`)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Open Invoice Management
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Agreed Freight</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">
              {formatINR(statement.freightAmount)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Additional Charges</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">
              {formatINR(statement.additionalCharges)}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50/70 p-3">
            <p className="text-[11px] font-semibold text-blue-700">Total Revenue Earned</p>
            <p className="mt-1 font-mono text-sm font-bold text-blue-950">
              {formatINR(statement.totalRevenue)}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50/70 p-3">
            <p className="text-[11px] font-semibold text-emerald-700">Received (Cash)</p>
            <p className="mt-1 font-mono text-sm font-bold text-emerald-900">
              {formatINR(statement.customerReceived)}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-lg bg-amber-50/70 p-3">
            <p className="text-[11px] font-semibold text-amber-800">Pending from Customer</p>
            <p className="mt-1 font-mono text-sm font-bold text-amber-900">
              {formatINR(statement.customerPending)}
            </p>
          </div>
        </div>

        {statement.invoices.length > 0 && (
          <div className="space-y-2 pt-1">
            {statement.invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{inv.invoiceNo}</span>
                  <span className="text-slate-600">{inv.client}</span>
                  <span className="text-slate-400">· {formatDateOnly(inv.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                    {inv.status}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(inv.amount + (inv.additionalCharges ?? 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: CATEGORY-WISE TRIP EXPENSE SUMMARY */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">2. Trip Expenses by Category</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: 'Diesel', value: statement.categoryTotals.diesel },
            { label: 'Repairs', value: statement.categoryTotals.repairs },
            { label: 'Service & Parts', value: statement.categoryTotals.serviceAndParts },
            { label: 'Driver Payments', value: statement.categoryTotals.driverPayments },
            { label: 'Load & Unload', value: statement.categoryTotals.loadingUnloading },
            { label: 'Tolls & Parking', value: statement.categoryTotals.tollsAndParking },
            { label: 'Other Trip Costs', value: statement.categoryTotals.otherExpenses },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="truncate text-[11px] font-semibold text-slate-500">{c.label}</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">{formatINR(c.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: DIESEL MANAGEMENT PURCHASES FOR THIS TRIP */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Diesel Purchases Linked to {statement.trip.id} ({statement.dieselPurchases.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/fleet/${lorry.id}/diesel/receipts`)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Open Diesel Receipts
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {statement.dieselPurchases.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            No diesel purchase receipts are linked to this trip.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Fuel Station</th>
                  <th className="px-3 py-2.5">Receipt No.</th>
                  <th className="px-3 py-2.5 text-right">Litres</th>
                  <th className="px-3 py-2.5 text-right">Price / L</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statement.dieselPurchases.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate(d.sourceRoute)}
                    className="cursor-pointer hover:bg-blue-50/40"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                      {formatDateOnly(d.date)}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{d.fuelStation}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-slate-600">
                      {d.receiptNumber}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono">
                      {d.litres} L
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono">
                      ₹{d.pricePerLitre.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span
                        className={clsx(
                          'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                          PAY_BADGE[d.paymentStatus]
                        )}
                      >
                        {d.paymentStatus}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatINR(d.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4: MAINTENANCE & OPERATING TRANSACTIONS LINKED TO THIS TRIP */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Maintenance, Driver &amp; Trip Expenses ({nonDieselExpenses.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/fleet/${lorry.id}/maintenance`)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Open Maintenance Management
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {nonDieselExpenses.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            No maintenance, driver payment, handling, or other expenses are linked to this trip.
          </p>
        ) : (
          <div className="space-y-2">
            {nonDieselExpenses.map((tx) => (
              <button
                key={tx.uniqueKey}
                type="button"
                onClick={() => setSelectedTx(tx)}
                className="flex w-full flex-col gap-2 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{tx.category}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                      {tx.id}
                    </span>
                    <span className="text-[11px] text-slate-500">{formatDateOnly(tx.date)}</span>
                  </div>
                  <p className="truncate text-xs text-slate-600">{tx.description}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end flex-shrink-0">
                  <span
                    className={clsx(
                      'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                      PAY_BADGE[tx.paymentStatus]
                    )}
                  >
                    {tx.statusLabel}
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {formatINR(tx.amount)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title={selectedTx?.category ?? 'Transaction Details'}
        subtitle={selectedTx ? `${formatDateOnly(selectedTx.date)} · ${selectedTx.id}` : ''}
        maxWidth="md"
      >
        {selectedTx && (
          <div className="space-y-4">
            <div className="space-y-2">
              {Object.entries(selectedTx.details).map(([k, v]) => (
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
                onClick={() => setSelectedTx(null)}
                className="min-h-[44px]"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                leftIcon={<ExternalLink className="h-4 w-4" />}
                onClick={() => {
                  const dest = selectedTx.sourceRoute;
                  setSelectedTx(null);
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
