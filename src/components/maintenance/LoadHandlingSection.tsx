import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Camera,
  CheckCircle2,
  Eye,
  MapPin,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import {
  HandlingChargeRecord,
  HandlingChargeType,
  MaintenancePaymentStatus,
} from '../../types/maintenance';
import { MaintenanceService } from '../../services/maintenanceService';
import { TripService } from '../../services/tripService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface LoadHandlingSectionProps {
  lorry: Lorry;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export const LoadHandlingSection: React.FC<LoadHandlingSectionProps> = ({ lorry }) => {
  const [tick, setTick] = useState(0);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [chargeModalType, setChargeModalType] = useState<HandlingChargeType | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<HandlingChargeRecord | null>(null);
  const [deletingCharge, setDeletingCharge] = useState<HandlingChargeRecord | null>(null);

  // Load Details form
  const [loadTripId, setLoadTripId] = useState('');
  const [goodsType, setGoodsType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [weightTonnes, setWeightTonnes] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loadDate, setLoadDate] = useState(todayIso());

  // Handling Charge form
  const [chargeDate, setChargeDate] = useState(todayIso());
  const [chargeLocation, setChargeLocation] = useState('');
  const [labourCharges, setLabourCharges] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargePaymentStatus, setChargePaymentStatus] = useState<MaintenancePaymentStatus>('PAID');
  const [chargeTripId, setChargeTripId] = useState('');
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    return MaintenanceService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const loads = useMemo(() => MaintenanceService.getLoadDetails(lorry.id), [lorry.id, tick]);
  const charges = useMemo(() => MaintenanceService.getHandlingCharges(lorry.id), [lorry.id, tick]);
  const trips = useMemo(() => TripService.getByLorryId(lorry.id), [lorry.id]);

  const totalHandling = useMemo(
    () => charges.reduce((s, c) => s + c.amount, 0),
    [charges]
  );

  const openLoadModal = () => {
    setLoadTripId(trips[0]?.id ?? '');
    setGoodsType('');
    setQuantity('');
    setWeightTonnes('');
    setPickupLocation('');
    setDestination('');
    setCustomerName('');
    setLoadDate(todayIso());
    setErrorMsg('');
    setIsLoadOpen(true);
  };

  const openChargeModal = (type: HandlingChargeType) => {
    setChargeModalType(type);
    setChargeDate(todayIso());
    setChargeLocation('');
    setLabourCharges('');
    setChargeAmount('');
    setChargePaymentStatus('PAID');
    setChargeTripId(trips[0]?.id ?? '');
    setAttachmentDataUrl(undefined);
    setAttachmentName(undefined);
    setErrorMsg('');
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

  const handleSaveLoad = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(weightTonnes);
    if (!goodsType.trim() || !pickupLocation.trim() || !destination.trim() || !customerName.trim()) {
      setErrorMsg('Please fill in goods type, pickup, destination, and customer name.');
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      setErrorMsg('Weight must be a positive number in tonnes.');
      return;
    }
    MaintenanceService.addLoadDetail({
      lorryId: lorry.id,
      tripId: loadTripId || 'UNLINKED',
      goodsType: goodsType.trim(),
      quantity: quantity.trim() || '1 Load',
      weightTonnes: weight,
      pickupLocation: pickupLocation.trim(),
      destination: destination.trim(),
      customerName: customerName.trim(),
      date: loadDate,
    });
    setIsLoadOpen(false);
  };

  const handleSaveCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeModalType) return;
    const labour = Number(labourCharges || 0);
    const total = Number(chargeAmount);
    if (!chargeLocation.trim()) {
      setErrorMsg('Please enter the location.');
      return;
    }
    if (!Number.isFinite(total) || total < 0) {
      setErrorMsg('Please enter a valid total amount.');
      return;
    }
    MaintenanceService.addHandlingCharge({
      lorryId: lorry.id,
      chargeType: chargeModalType,
      date: chargeDate,
      location: chargeLocation.trim(),
      labourCharges: Number.isFinite(labour) && labour >= 0 ? labour : 0,
      amount: total,
      paymentStatus: chargePaymentStatus,
      tripId: chargeTripId || undefined,
      attachmentDataUrl,
      attachmentName,
    });
    setChargeModalType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Three Separate Action Buttons */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Load &amp; Handling Expenses — <span className="font-mono">{lorry.registrationNumber}</span>
          </h2>
          <p className="text-xs text-slate-500">
            Record cargo load details separately from loading and unloading labour charges.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openLoadModal}
            className="min-h-[44px] w-full"
          >
            Add Load Details
          </Button>
          <Button
            type="button"
            variant="secondary"
            leftIcon={<ArrowUpFromLine className="h-4 w-4" />}
            onClick={() => openChargeModal('Loading')}
            className="min-h-[44px] w-full"
          >
            Add Loading Charges
          </Button>
          <Button
            type="button"
            variant="secondary"
            leftIcon={<ArrowDownToLine className="h-4 w-4" />}
            onClick={() => openChargeModal('Unloading')}
            className="min-h-[44px] w-full"
          >
            Add Unloading Charges
          </Button>
        </div>
      </div>

      {/* Loading & Unloading Charges List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Loading &amp; Unloading Charges ({charges.length})
          </h3>
          <span className="text-sm font-bold text-[#0b1329]">
            Total: {formatINR(totalHandling)}
          </span>
        </div>

        {charges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-xs text-slate-500">No loading or unloading charges recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {charges.map((ch) => (
              <div key={ch.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {ch.chargeType} Charges
                      </span>
                      <span
                        className={clsx(
                          'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                          ch.paymentStatus === 'PAID'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                        )}
                      >
                        {ch.paymentStatus}
                      </span>
                      {ch.tripId && (
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                          {ch.tripId}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{formatDateOnly(ch.date)}</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {ch.location}
                      </span>
                      <span>Labour: {formatINR(ch.labourCharges)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 sm:border-0 sm:pt-0">
                    <span className="text-base font-bold text-slate-900">
                      {formatINR(ch.amount)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ch.attachmentDataUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingReceipt(ch)}
                          className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {ch.paymentStatus === 'UNPAID' && (
                        <button
                          type="button"
                          onClick={() => MaintenanceService.markHandlingPaid(ch.id)}
                          className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark Paid
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeletingCharge(ch)}
                        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600"
                        aria-label="Delete charge"
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
      </div>

      {/* Load Details List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Recorded Load Details ({loads.length})
        </h3>
        {loads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Package className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-1.5 text-xs text-slate-500">No cargo load details recorded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {loads.map((ld) => (
              <div key={ld.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900">{ld.goodsType}</span>
                  <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700">
                    {ld.tripId}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-700">
                  {ld.pickupLocation} → {ld.destination}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>Customer: <strong className="text-slate-700">{ld.customerName}</strong></span>
                  <span>Weight: <strong className="text-slate-700">{ld.weightTonnes} T</strong></span>
                  <span>Qty: {ld.quantity}</span>
                  <span>{formatDateOnly(ld.date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Load Details Modal */}
      <Modal
        isOpen={isLoadOpen}
        onClose={() => setIsLoadOpen(false)}
        title="Add Load Details"
        subtitle={`Lorry ${lorry.registrationNumber}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveLoad} className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Trip ID</label>
              <select
                value={loadTripId}
                onChange={(e) => setLoadTripId(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">Unlinked</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} · {t.startLocation} → {t.destination}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Loading Date</label>
              <input
                type="date"
                required
                value={loadDate}
                onChange={(e) => setLoadDate(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Goods / Load Type</label>
              <input
                type="text"
                required
                value={goodsType}
                onChange={(e) => setGoodsType(e.target.value)}
                placeholder="e.g., Steel Coils"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Quantity</label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 400 Bags"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Weight (Tonnes)</label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                value={weightTonnes}
                onChange={(e) => setWeightTonnes(e.target.value)}
                placeholder="e.g., 22.5"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Pickup Location</label>
              <input
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder="Warehouse / City"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Destination</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Delivery hub / City"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Customer / Company</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Consignor / Client name"
              className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsLoadOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="min-h-[44px]">
              Save Load Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Loading / Unloading Charges Modal */}
      <Modal
        isOpen={!!chargeModalType}
        onClose={() => setChargeModalType(null)}
        title={`Add ${chargeModalType ?? ''} Charges`}
        subtitle={`Lorry ${lorry.registrationNumber}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCharge} className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Date</label>
              <input
                type="date"
                required
                value={chargeDate}
                onChange={(e) => setChargeDate(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Location</label>
              <input
                type="text"
                required
                value={chargeLocation}
                onChange={(e) => setChargeLocation(e.target.value)}
                placeholder="Godown / Yard / City"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Labour Charges (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={labourCharges}
                onChange={(e) => setLabourCharges(e.target.value)}
                placeholder="0"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Total Amount (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                placeholder="Total ₹"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Payment Status</label>
              <select
                value={chargePaymentStatus}
                onChange={(e) => setChargePaymentStatus(e.target.value as MaintenancePaymentStatus)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Related Trip (optional)</label>
            <select
              value={chargeTripId}
              onChange={(e) => setChargeTripId(e.target.value)}
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

          <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            <Camera className="h-4 w-4 text-blue-600" />
            <span>{attachmentName ? `Attached: ${attachmentName}` : 'Attach Receipt (optional)'}</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setChargeModalType(null)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="min-h-[44px]">
              Save {chargeModalType} Charge
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        title="Handling Receipt"
        maxWidth="lg"
      >
        {viewingReceipt?.attachmentDataUrl && (
          <img
            src={viewingReceipt.attachmentDataUrl}
            alt="Handling receipt"
            className="max-h-[70vh] w-full rounded-lg object-contain bg-slate-100"
          />
        )}
      </Modal>

      <Modal
        isOpen={!!deletingCharge}
        onClose={() => setDeletingCharge(null)}
        title="Delete Handling Charge?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Delete {deletingCharge?.chargeType} charge at {deletingCharge?.location}?
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingCharge(null)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (deletingCharge) {
                  MaintenanceService.deleteHandlingCharge(deletingCharge.id);
                  setDeletingCharge(null);
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
