import React, { useEffect, useState } from 'react';
import { AlertCircle, FileImage } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  FuelReceiptRecord,
  ReceiptPaymentMethod,
} from '../../types/fuelReceipt';
import { FuelReceiptService } from '../../services/fuelReceiptService';
import { formatDate, formatDateOnly, formatINR, formatLiters } from '../../utils/formatters';

interface FuelReceiptDetailModalProps {
  receipt: FuelReceiptRecord | null;
  initialOpenMarkPaid?: boolean;
  onClose: () => void;
  onMarkedPaid?: (updated: FuelReceiptRecord) => void;
}

const PAYMENT_METHODS: ReceiptPaymentMethod[] = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Other',
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export const FuelReceiptDetailModal: React.FC<FuelReceiptDetailModalProps> = ({
  receipt,
  initialOpenMarkPaid = false,
  onClose,
  onMarkedPaid,
}) => {
  const [showMarkPaidForm, setShowMarkPaidForm] = useState(initialOpenMarkPaid);
  const [payDate, setPayDate] = useState(todayIso());
  const [payMethod, setPayMethod] = useState<ReceiptPaymentMethod>('UPI');

  useEffect(() => {
    setShowMarkPaidForm(initialOpenMarkPaid);
    setPayDate(todayIso());
  }, [receipt?.id, initialOpenMarkPaid]);

  if (!receipt) return null;

  const handleConfirmMarkPaid = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = FuelReceiptService.markAsPaid(receipt.id, payDate, payMethod);
    setShowMarkPaidForm(false);
    onMarkedPaid?.(updated);
  };

  return (
    <Modal
      isOpen={!!receipt}
      onClose={onClose}
      title={`Fuel Receipt — ${receipt.receiptNumber}`}
      subtitle={`${receipt.lorryRegistration} · ${receipt.fuelStation}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Original Scanned / Uploaded Receipt Image */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Original Receipt Image
            </p>
            {receipt.imageDataUrl ? (
              <img
                src={receipt.imageDataUrl}
                alt={`Receipt ${receipt.receiptNumber}`}
                className="max-h-72 w-full rounded-lg border border-slate-200 bg-white object-contain"
              />
            ) : (
              <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-400">
                <FileImage className="mb-2 h-7 w-7 text-slate-300" />
                <p>No scanned image attached (DEMO seeded receipt).</p>
              </div>
            )}
          </div>

          {/* Verified Details */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-500">{receipt.id}</span>
              {receipt.paymentStatus === 'PAID' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  PAID
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  UNPAID
                </span>
              )}
            </div>

            <dl className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Fuel Station</dt>
                <dd className="text-right font-semibold text-slate-900">{receipt.fuelStation}</dd>
              </div>
              {receipt.stationLocation && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="text-right text-slate-700">{receipt.stationLocation}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Receipt No.</dt>
                <dd className="font-mono font-semibold text-slate-900">{receipt.receiptNumber}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Purchase Date & Time</dt>
                <dd className="font-medium text-slate-800">
                  {formatDateOnly(`${receipt.receiptDate}T00:00:00Z`)}
                  {receipt.receiptTime ? ` · ${receipt.receiptTime}` : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Lorry</dt>
                <dd className="font-mono font-bold text-slate-900">{receipt.lorryRegistration}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Linked Trip</dt>
                <dd className="font-mono font-semibold text-slate-800">
                  {receipt.tripId ?? <span className="font-sans italic text-amber-700">Unassigned</span>}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                <dt className="text-slate-500">Diesel Quantity</dt>
                <dd className="font-mono font-semibold text-slate-900">{formatLiters(receipt.dieselLitres)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Price per Litre</dt>
                <dd className="font-mono text-slate-800">₹{receipt.pricePerLitre.toFixed(2)}/L</dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                <dt className="font-bold text-slate-900">Total Amount</dt>
                <dd className="font-mono text-sm font-bold text-blue-700">{formatINR(receipt.totalAmount)}</dd>
              </div>
              {receipt.gstDetails && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">GST Details</dt>
                  <dd className="font-mono text-slate-700">{receipt.gstDetails}</dd>
                </div>
              )}
              {receipt.paymentStatus === 'PAID' && (
                <>
                  <div className="flex justify-between gap-2 border-t border-slate-100 pt-2">
                    <dt className="text-slate-500">Payment Date</dt>
                    <dd className="font-semibold text-emerald-700">
                      {receipt.paymentDate ? formatDateOnly(`${receipt.paymentDate}T00:00:00Z`) : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Payment Method</dt>
                    <dd className="font-semibold text-emerald-700">{receipt.paymentMethod}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                <dt>Recorded</dt>
                <dd>{formatDate(receipt.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Update UNPAID -> PAID with Confirmation (preserves original purchase date & time) */}
        {receipt.paymentStatus === 'UNPAID' && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-3">
            {!showMarkPaidForm ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                  <span>
                    This receipt is currently <strong>UNPAID</strong>. Original purchase date and time are preserved when marking paid.
                  </span>
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
                  Confirm Payment for {receipt.receiptNumber} ({formatINR(receipt.totalAmount)})
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
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowMarkPaidForm(false)}>
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
  );
};
