import React, { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, Eye, MapPin, Plus, Receipt, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import {
  MaintenancePaymentStatus,
  OtherExpenseCategory,
  OtherExpenseRecord,
} from '../../types/maintenance';
import { MaintenanceService } from '../../services/maintenanceService';
import { TripService } from '../../services/tripService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface OtherExpensesSectionProps {
  lorry: Lorry;
}

const CATEGORIES: OtherExpenseCategory[] = [
  'Toll charges',
  'Parking',
  'Truck washing',
  'Roadside expenses',
  'Permits',
  'Penalties',
  'Miscellaneous',
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export const OtherExpensesSection: React.FC<OtherExpensesSectionProps> = ({ lorry }) => {
  const [tick, setTick] = useState(0);
  const [catFilter, setCatFilter] = useState<'ALL' | OtherExpenseCategory>('ALL');
  const [isOpen, setIsOpen] = useState(false);
  const [viewing, setViewing] = useState<OtherExpenseRecord | null>(null);
  const [deleting, setDeleting] = useState<OtherExpenseRecord | null>(null);

  const [expenseCategory, setExpenseCategory] = useState<OtherExpenseCategory>('Toll charges');
  const [date, setDate] = useState(todayIso());
  const [location, setLocation] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<MaintenancePaymentStatus>('PAID');
  const [tripId, setTripId] = useState('');
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    return MaintenanceService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const expenses = useMemo(
    () => MaintenanceService.getOtherExpenses(lorry.id),
    [lorry.id, tick]
  );
  const trips = useMemo(() => TripService.getByLorryId(lorry.id), [lorry.id]);

  const filtered = useMemo(
    () => (catFilter === 'ALL' ? expenses : expenses.filter((e) => e.expenseCategory === catFilter)),
    [expenses, catFilter]
  );

  const totals = useMemo(() => {
    const paid = expenses.filter((e) => e.paymentStatus === 'PAID').reduce((s, e) => s + e.amount, 0);
    const unpaid = expenses.filter((e) => e.paymentStatus === 'UNPAID').reduce((s, e) => s + e.amount, 0);
    return { total: paid + unpaid, paid, unpaid };
  }, [expenses]);

  const openModal = () => {
    setExpenseCategory('Toll charges');
    setDate(todayIso());
    setLocation('');
    setAmount('');
    setDescription('');
    setPaymentStatus('PAID');
    setTripId('');
    setAttachmentDataUrl(undefined);
    setAttachmentName(undefined);
    setErrorMsg('');
    setIsOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Receipt image must be smaller than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentDataUrl(typeof reader.result === 'string' ? reader.result : undefined);
      setAttachmentName(file.name);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!location.trim() || !description.trim()) {
      setErrorMsg('Please enter location and description.');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid expense amount.');
      return;
    }
    MaintenanceService.addOtherExpense({
      lorryId: lorry.id,
      expenseCategory,
      date,
      location: location.trim(),
      amount: amt,
      description: description.trim(),
      paymentStatus,
      tripId: tripId || undefined,
      attachmentDataUrl,
      attachmentName,
    });
    setIsOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Other Lorry Expenses — <span className="font-mono">{lorry.registrationNumber}</span>
          </h2>
          <p className="text-xs text-slate-500">
            Tolls, parking, truck washing, permits, penalties, and roadside costs.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openModal}
          className="min-h-[44px] w-full sm:w-auto"
        >
          Add Expense
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Total</p>
          <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">{formatINR(totals.total)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-emerald-700">Paid</p>
          <p className="mt-1 text-base font-bold text-emerald-700 sm:text-lg">{formatINR(totals.paid)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-red-600">Unpaid</p>
          <p className="mt-1 text-base font-bold text-red-600 sm:text-lg">{formatINR(totals.unpaid)}</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        {(['ALL', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCatFilter(cat)}
            className={clsx(
              'min-h-[38px] rounded-lg border px-3 text-xs font-semibold transition-colors',
              catFilter === cat
                ? 'border-[#0b1329] bg-[#0b1329] text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            {cat === 'ALL' ? `All (${expenses.length})` : cat}
          </button>
        ))}
      </div>

      {/* Expense List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Receipt className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-semibold text-slate-800">No expenses in this category</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((exp) => (
            <div key={exp.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{exp.expenseCategory}</span>
                    <span
                      className={clsx(
                        'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                        exp.paymentStatus === 'PAID'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      )}
                    >
                      {exp.paymentStatus}
                    </span>
                    {exp.tripId && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                        {exp.tripId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700">{exp.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{formatDateOnly(exp.date)}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {exp.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 sm:border-0 sm:pt-0">
                  <span className="text-base font-bold text-slate-900">{formatINR(exp.amount)}</span>
                  <div className="flex items-center gap-1.5">
                    {exp.attachmentDataUrl && (
                      <button
                        type="button"
                        onClick={() => setViewing(exp)}
                        className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {exp.paymentStatus === 'UNPAID' && (
                      <button
                        type="button"
                        onClick={() => MaintenanceService.markOtherExpensePaid(exp.id)}
                        className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Paid
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleting(exp)}
                      className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600"
                      aria-label="Delete expense"
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

      {/* Add Expense Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Lorry Expense"
        subtitle={`Lorry ${lorry.registrationNumber}`}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Select Expense Category</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setExpenseCategory(cat)}
                  className={clsx(
                    'min-h-[44px] rounded-lg border px-3 text-left text-xs font-semibold transition-colors',
                    expenseCategory === cat
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-white'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Amount (₹)</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Location</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Toll plaza, yard, or city"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note about this expense"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as MaintenancePaymentStatus)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
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

          <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            <Camera className="h-4 w-4 text-blue-600" />
            <span>{attachmentName ? `Attached: ${attachmentName}` : 'Attach Receipt (optional)'}</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="min-h-[44px]">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Expense Receipt" maxWidth="lg">
        {viewing?.attachmentDataUrl && (
          <img
            src={viewing.attachmentDataUrl}
            alt="Expense receipt"
            className="max-h-[70vh] w-full rounded-lg object-contain bg-slate-100"
          />
        )}
      </Modal>

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Expense?" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Delete <span className="font-bold">{deleting?.expenseCategory}</span> ({deleting ? formatINR(deleting.amount) : ''})?
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
                  MaintenanceService.deleteOtherExpense(deleting.id);
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
