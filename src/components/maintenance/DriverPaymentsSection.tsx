import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, Trash2, UserRound } from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import { DriverPaymentRecord, MaintenancePaymentMethod } from '../../types/maintenance';
import {
  calculateDriverPaymentTotals,
  MaintenanceService,
} from '../../services/maintenanceService';
import { TripService } from '../../services/tripService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface DriverPaymentsSectionProps {
  lorry: Lorry;
}

const PAYMENT_METHODS: MaintenancePaymentMethod[] = [
  'Bank Transfer',
  'UPI',
  'Cash',
  'Card',
  'Other',
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export const DriverPaymentsSection: React.FC<DriverPaymentsSectionProps> = ({ lorry }) => {
  const [tick, setTick] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState<DriverPaymentRecord | null>(null);

  const [driverName, setDriverName] = useState(lorry.driverName ?? '');
  const [date, setDate] = useState(todayIso());
  const [monthlySalary, setMonthlySalary] = useState('0');
  const [tripAllowance, setTripAllowance] = useState('0');
  const [foodAllowance, setFoodAllowance] = useState('0');
  const [otherEarnings, setOtherEarnings] = useState('0');
  const [advanceGiven, setAdvanceGiven] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('0');
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<MaintenancePaymentMethod>('Bank Transfer');
  const [tripId, setTripId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    return MaintenanceService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const payments = useMemo(
    () => MaintenanceService.getDriverPayments(lorry.id),
    [lorry.id, tick]
  );
  const trips = useMemo(() => TripService.getByLorryId(lorry.id), [lorry.id]);

  const totals = useMemo(() => {
    const paid = payments.reduce((s, p) => s + p.amountPaid, 0);
    const pending = payments.reduce((s, p) => s + p.remainingPayable, 0);
    return { paid, pending };
  }, [payments]);

  const livePreview = useMemo(() => {
    return calculateDriverPaymentTotals({
      monthlySalary: Number(monthlySalary) || 0,
      tripAllowance: Number(tripAllowance) || 0,
      foodAllowance: Number(foodAllowance) || 0,
      otherEarnings: Number(otherEarnings) || 0,
      advanceGiven: Number(advanceGiven) || 0,
      otherDeductions: Number(otherDeductions) || 0,
      amountPaid: Number(amountPaid) || 0,
    });
  }, [
    monthlySalary,
    tripAllowance,
    foodAllowance,
    otherEarnings,
    advanceGiven,
    otherDeductions,
    amountPaid,
  ]);

  const openModal = () => {
    setDriverName(lorry.driverName ?? '');
    setDate(todayIso());
    setMonthlySalary('');
    setTripAllowance('');
    setFoodAllowance('');
    setOtherEarnings('');
    setAdvanceGiven('');
    setOtherDeductions('');
    setAmountPaid('');
    setPaymentMethod('Bank Transfer');
    setTripId('');
    setNotes('');
    setErrorMsg('');
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) {
      setErrorMsg('Please enter the driver name.');
      return;
    }
    const nums = [
      monthlySalary,
      tripAllowance,
      foodAllowance,
      otherEarnings,
      advanceGiven,
      otherDeductions,
      amountPaid,
    ].map((v) => Number(v || 0));

    if (nums.some((n) => !Number.isFinite(n) || n < 0)) {
      setErrorMsg('All payment amounts must be non-negative numbers.');
      return;
    }

    MaintenanceService.addDriverPayment({
      lorryId: lorry.id,
      driverName: driverName.trim(),
      date,
      monthlySalary: nums[0],
      tripAllowance: nums[1],
      foodAllowance: nums[2],
      otherEarnings: nums[3],
      advanceGiven: nums[4],
      otherDeductions: nums[5],
      amountPaid: nums[6],
      paymentMethod,
      tripId: tripId || undefined,
      notes: notes.trim() || undefined,
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Driver Payments — <span className="font-mono">{lorry.registrationNumber}</span>
          </h2>
          <p className="text-xs text-slate-500">
            Track salary, trip bata, food allowance, advances, and remaining balance without duplicate counting.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openModal}
          className="min-h-[44px] w-full sm:w-auto"
        >
          Add Driver Payment
        </Button>
      </div>

      {/* Paid vs Pending Balance Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-[11px] font-semibold uppercase text-emerald-800">Total Paid</p>
          <p className="mt-1 text-lg font-bold text-emerald-900 sm:text-xl">
            {formatINR(totals.paid)}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
          <p className="text-[11px] font-semibold uppercase text-red-800">Pending Payable Balance</p>
          <p className="mt-1 text-lg font-bold text-red-700 sm:text-xl">
            {formatINR(totals.pending)}
          </p>
        </div>
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <UserRound className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-semibold text-slate-800">No driver payments recorded yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Record monthly salary, trip bata, food allowance, and advances for this lorry&apos;s driver.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((pay) => (
            <div key={pay.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{pay.driverName}</span>
                    <span
                      className={clsx(
                        'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase',
                        pay.remainingPayable <= 0
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                      )}
                    >
                      {pay.remainingPayable <= 0 ? 'PAID IN FULL' : 'BALANCE PENDING'}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {pay.paymentMethod}
                    </span>
                    {pay.tripId && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                        {pay.tripId}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">{formatDateOnly(pay.date)}</p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-4">
                    <span>Salary: <strong>{formatINR(pay.monthlySalary)}</strong></span>
                    <span>Trip Bata: <strong>{formatINR(pay.tripAllowance)}</strong></span>
                    <span>Food: <strong>{formatINR(pay.foodAllowance)}</strong></span>
                    <span>Other: <strong>{formatINR(pay.otherEarnings)}</strong></span>
                    <span>Advance: <strong>{formatINR(pay.advanceGiven)}</strong></span>
                    <span>Deductions: <strong>{formatINR(pay.otherDeductions)}</strong></span>
                    <span>Total Earnings: <strong className="text-slate-900">{formatINR(pay.totalEarnings)}</strong></span>
                  </div>

                  {pay.notes && <p className="text-xs text-slate-500 italic">{pay.notes}</p>}
                </div>

                <div className="flex flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500">
                      Paid: <span className="font-bold text-emerald-700">{formatINR(pay.amountPaid)}</span>
                    </p>
                    <p className="text-sm font-bold text-red-600">
                      Remaining: {formatINR(pay.remainingPayable)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pay.remainingPayable > 0 && (
                      <button
                        type="button"
                        onClick={() => MaintenanceService.settleDriverPayment(pay.id)}
                        className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Settle Balance
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleting(pay)}
                      className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      aria-label="Delete driver payment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Driver Payment Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Driver Payment"
        subtitle={`Lorry ${lorry.registrationNumber} · Automatic earnings & balance calculation`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Driver Name</label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Driver full name"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Payment Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Salary (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                placeholder="0"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Trip Bata (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tripAllowance}
                onChange={(e) => setTripAllowance(e.target.value)}
                placeholder="0"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Food Allowance (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={foodAllowance}
                onChange={(e) => setFoodAllowance(e.target.value)}
                placeholder="0"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Other Earnings (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otherEarnings}
                onChange={(e) => setOtherEarnings(e.target.value)}
                placeholder="0"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Advance Given (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={advanceGiven}
                onChange={(e) => setAdvanceGiven(e.target.value)}
                placeholder="0"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Other Deductions (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(e.target.value)}
                placeholder="0"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Amount Paid Now (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          {/* Live Calculation Preview */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
            <div>
              <p className="text-[11px] font-semibold uppercase text-blue-800">Total Earnings</p>
              <p className="text-lg font-bold text-[#0b1329]">{formatINR(livePreview.totalEarnings)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-blue-800">Remaining Payable</p>
              <p
                className={clsx(
                  'text-lg font-bold',
                  livePreview.remainingPayable > 0 ? 'text-red-700' : 'text-emerald-700'
                )}
              >
                {formatINR(livePreview.remainingPayable)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as MaintenancePaymentMethod)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Related Trip (optional)</label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">None</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} · {t.startLocation} → {t.destination}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Balance payable after unloading"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="min-h-[44px]">
              Save Driver Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Driver Payment?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Delete payment record for <span className="font-bold">{deleting?.driverName}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeleting(null)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (deleting) {
                  MaintenanceService.deleteDriverPayment(deleting.id);
                  setDeleting(null);
                }
              }}
              className="min-h-[44px]"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
