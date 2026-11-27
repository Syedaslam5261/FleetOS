import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileImage,
  ScanLine,
  Search,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ProfileEmptyState } from '../fleet/profile/ProfileParts';
import { Lorry } from '../../types/lorry';
import {
  FuelReceiptRecord,
  ReceiptPaymentMethod,
  ReceiptPaymentStatus,
} from '../../types/fuelReceipt';
import { FuelReceiptService } from '../../services/fuelReceiptService';
import { formatDate, formatDateOnly, formatINR, formatLiters } from '../../utils/formatters';

interface FuelReceiptsSectionProps {
  lorry: Lorry;
  onOpenScanner: () => void;
}

const PAYMENT_METHODS: ReceiptPaymentMethod[] = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Other',
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export const FuelReceiptsSection: React.FC<FuelReceiptsSectionProps> = ({
  lorry,
  onOpenScanner,
}) => {
  const [receipts, setReceipts] = useState<FuelReceiptRecord[]>(() =>
    FuelReceiptService.getByLorryId(lorry.id)
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReceiptPaymentStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Receipt viewer + Mark Paid confirmation state
  const [selectedReceipt, setSelectedReceipt] = useState<FuelReceiptRecord | null>(null);
  const [showMarkPaidForm, setShowMarkPaidForm] = useState(false);
  const [payDate, setPayDate] = useState(todayIso());
  const [payMethod, setPayMethod] = useState<ReceiptPaymentMethod>('UPI');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setReceipts(FuelReceiptService.getByLorryId(lorry.id));
    const unsub = FuelReceiptService.subscribe(() => {
      const latest = FuelReceiptService.getByLorryId(lorry.id);
      setReceipts(latest);
      setSelectedReceipt((curr) => (curr ? latest.find((r) => r.id === curr.id) ?? null : null));
    });
    return unsub;
  }, [lorry.id]);

  const counts = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    let totalLitres = 0;
    let totalAmount = 0;
    for (const r of receipts) {
      if (r.paymentStatus === 'PAID') paid++;
      else unpaid++;
      totalLitres += r.dieselLitres;
      totalAmount += r.totalAmount;
    }
    return { paid, unpaid, totalLitres, totalAmount };
  }, [receipts]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return receipts.filter((r) => {
      if (statusFilter !== 'ALL' && r.paymentStatus !== statusFilter) return false;
      if (fromDate && r.receiptDate < fromDate) return false;
      if (toDate && r.receiptDate > toDate) return false;
      if (q) {
        const matches =
          r.receiptNumber.toLowerCase().includes(q) ||
          r.fuelStation.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [receipts, statusFilter, fromDate, toDate, searchQuery]);

  const handleConfirmMarkPaid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt) return;
    FuelReceiptService.markAsPaid(selectedReceipt.id, payDate, payMethod);
    setShowMarkPaidForm(false);
    setNotice(`Receipt ${selectedReceipt.receiptNumber} marked as PAID (${payMethod}).`);
    window.setTimeout(() => setNotice(null), 4000);
  };

  const renderStatusBadge = (status: ReceiptPaymentStatus) =>
    status === 'PAID' ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        PAID
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        UNPAID
      </span>
    );

  return (
    <div className="space-y-4">
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Top Action + Confirmed Totals Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-slate-900">
            {receipts.length} {receipts.length === 1 ? 'Receipt' : 'Receipts'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-mono font-semibold text-slate-700">{formatLiters(counts.totalLitres)}</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono font-bold text-slate-900">{formatINR(Math.round(counts.totalAmount))}</span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-emerald-700">{counts.paid} Paid</span>
          <span className="font-semibold text-rose-700">{counts.unpaid} Unpaid</span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          leftIcon={<ScanLine className="h-4 w-4" />}
          onClick={onOpenScanner}
          className="min-h-[44px] w-full sm:w-auto"
        >
          Scan Fuel Receipt
        </Button>
      </div>

      {/* Filters & Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Filter Buttons: All / Paid / Unpaid */}
          <div className="grid grid-cols-3 gap-1 sm:inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            {(['ALL', 'PAID', 'UNPAID'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={clsx(
                  'min-h-[40px] sm:min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                  statusFilter === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {s === 'ALL' ? 'All' : s === 'PAID' ? 'Paid' : 'Unpaid'}
              </button>
            ))}
          </div>

          {/* Search + Date Range */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 flex-1 lg:max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search receipt no. or station..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <input
              type="date"
              aria-label="From date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            <input
              type="date"
              aria-label="To date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Empty State or Receipt List */}
      {filtered.length === 0 ? (
        <ProfileEmptyState
          title="No fuel receipts found"
          message={`No confirmed receipts match ${lorry.registrationNumber} for the selected filters. Use Scan Fuel Receipt to add one.`}
        />
      ) : (
        <>
          {/* Mobile Receipt Cards (< 768px) */}
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-slate-900">{r.receiptNumber}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatDateOnly(`${r.receiptDate}T00:00:00Z`)} · {r.lorryRegistration}
                    </p>
                  </div>
                  {renderStatusBadge(r.paymentStatus)}
                </div>

                <p className="font-medium text-slate-800">{r.fuelStation}</p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="font-mono text-slate-600">
                    {formatLiters(r.dieselLitres)} @ ₹{r.pricePerLitre.toFixed(2)}/L
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {formatINR(r.totalAmount)}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReceipt(r);
                      setShowMarkPaidForm(false);
                    }}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Eye className="h-4 w-4" /> View Receipt
                  </button>
                  {r.paymentStatus === 'UNPAID' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReceipt(r);
                        setShowMarkPaidForm(true);
                        setPayDate(todayIso());
                      }}
                      className="flex min-h-[44px] items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= 768px) */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Receipt No.</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Fuel Station</th>
                    <th className="px-4 py-3">Lorry Reg.</th>
                    <th className="px-4 py-3 text-right">Diesel Qty (L)</th>
                    <th className="px-4 py-3 text-right">Total Amount (₹)</th>
                    <th className="px-4 py-3 text-center">Payment Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-slate-900">
                        {r.receiptNumber}
                        {r.imageDataUrl && (
                          <span className="ml-1.5 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-sans font-bold text-blue-700">
                            IMG
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatDateOnly(`${r.receiptDate}T00:00:00Z`)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{r.fuelStation}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-800">
                        {r.lorryRegistration}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-slate-900">
                        {formatLiters(r.dieselLitres)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(r.totalAmount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        {renderStatusBadge(r.paymentStatus)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReceipt(r);
                              setShowMarkPaidForm(false);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          {r.paymentStatus === 'UNPAID' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReceipt(r);
                                setShowMarkPaidForm(true);
                                setPayDate(todayIso());
                              }}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="text-[11px] text-slate-400">
        Confirmed fuel receipts for {lorry.registrationNumber} only (kept separate from Fuel Calculator estimates). Demo session storage resets on page reload.
      </p>

      {/* View Receipt & Update Payment Status Modal */}
      {selectedReceipt && (
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => {
            setSelectedReceipt(null);
            setShowMarkPaidForm(false);
          }}
          title={`Fuel Receipt — ${selectedReceipt.receiptNumber}`}
          subtitle={`${selectedReceipt.lorryRegistration} · ${selectedReceipt.fuelStation}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Original Image */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Receipt Image
                </p>
                {selectedReceipt.imageDataUrl ? (
                  <img
                    src={selectedReceipt.imageDataUrl}
                    alt={`Receipt ${selectedReceipt.receiptNumber}`}
                    className="max-h-72 w-full rounded-lg border border-slate-200 bg-white object-contain"
                  />
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-400">
                    <FileImage className="mb-2 h-7 w-7 text-slate-300" />
                    <p>No image attached (seeded demo receipt).</p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-500">{selectedReceipt.id}</span>
                  {renderStatusBadge(selectedReceipt.paymentStatus)}
                </div>

                <dl className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Fuel Station</dt>
                    <dd className="text-right font-semibold text-slate-900">{selectedReceipt.fuelStation}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Receipt No.</dt>
                    <dd className="font-mono font-semibold text-slate-900">{selectedReceipt.receiptNumber}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Receipt Date</dt>
                    <dd className="font-medium text-slate-800">
                      {formatDateOnly(`${selectedReceipt.receiptDate}T00:00:00Z`)}
                      {selectedReceipt.receiptTime ? ` · ${selectedReceipt.receiptTime}` : ''}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Lorry</dt>
                    <dd className="font-mono font-bold text-slate-900">{selectedReceipt.lorryRegistration}</dd>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                    <dt className="text-slate-500">Diesel Quantity</dt>
                    <dd className="font-mono font-semibold text-slate-900">{formatLiters(selectedReceipt.dieselLitres)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Price per Litre</dt>
                    <dd className="font-mono text-slate-800">₹{selectedReceipt.pricePerLitre.toFixed(2)}/L</dd>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                    <dt className="font-bold text-slate-900">Total Amount</dt>
                    <dd className="font-mono text-sm font-bold text-blue-700">{formatINR(selectedReceipt.totalAmount)}</dd>
                  </div>
                  {selectedReceipt.gstDetails && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">GST Details</dt>
                      <dd className="font-mono text-slate-700">{selectedReceipt.gstDetails}</dd>
                    </div>
                  )}
                  {selectedReceipt.paymentStatus === 'PAID' && (
                    <>
                      <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                        <dt className="text-slate-500">Payment Date</dt>
                        <dd className="font-semibold text-emerald-700">
                          {selectedReceipt.paymentDate
                            ? formatDateOnly(`${selectedReceipt.paymentDate}T00:00:00Z`)
                            : '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Payment Method</dt>
                        <dd className="font-semibold text-emerald-700">{selectedReceipt.paymentMethod}</dd>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                    <dt>Created</dt>
                    <dd>{formatDate(selectedReceipt.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Update UNPAID -> PAID with Confirmation */}
            {selectedReceipt.paymentStatus === 'UNPAID' && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-3">
                {!showMarkPaidForm ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2 text-xs text-rose-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                      <span>This receipt is currently <strong>UNPAID</strong>. Record payment once settled.</span>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setPayDate(todayIso());
                        setShowMarkPaidForm(true);
                      }}
                      className="min-h-[42px]"
                    >
                      Mark as PAID
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleConfirmMarkPaid} className="space-y-3">
                    <p className="text-xs font-bold text-slate-900">
                      Confirm Payment for {selectedReceipt.receiptNumber} ({formatINR(selectedReceipt.totalAmount)})
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Payment Date *</label>
                        <input
                          type="date"
                          required
                          value={payDate}
                          onChange={(e) => setPayDate(e.target.value)}
                          className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">Payment Method *</label>
                        <select
                          value={payMethod}
                          onChange={(e) => setPayMethod(e.target.value as ReceiptPaymentMethod)}
                          className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900"
                        >
                          {PAYMENT_METHODS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMarkPaidForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" size="sm">
                        Confirm Payment
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
