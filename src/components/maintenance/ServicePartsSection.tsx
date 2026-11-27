import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Gauge, Plus, Settings, Trash2, Wrench } from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import {
  MaintenancePaymentStatus,
  ServicePartOption,
  ServicePartRecord,
} from '../../types/maintenance';
import { MaintenanceService } from '../../services/maintenanceService';
import { TripService } from '../../services/tripService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface ServicePartsSectionProps {
  lorry: Lorry;
}

const PART_OPTIONS: ServicePartOption[] = [
  'Engine oil',
  'Oil filter',
  'Air filter',
  'Brake pads',
  'Tyres',
  'Battery',
  'Clutch',
  'Other',
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export const ServicePartsSection: React.FC<ServicePartsSectionProps> = ({ lorry }) => {
  const [tick, setTick] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [deleting, setDeleting] = useState<ServicePartRecord | null>(null);

  const [date, setDate] = useState(todayIso());
  const [odometerKm, setOdometerKm] = useState('');
  const [serviceCentre, setServiceCentre] = useState('');
  const [serviceType, setServiceType] = useState('Periodic Service');
  const [selectedParts, setSelectedParts] = useState<string[]>(['Engine oil', 'Oil filter']);
  const [otherPartNote, setOtherPartNote] = useState('');
  const [labourCharges, setLabourCharges] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [nextServiceKm, setNextServiceKm] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<MaintenancePaymentStatus>('PAID');
  const [tripId, setTripId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    return MaintenanceService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const services = useMemo(() => MaintenanceService.getServices(lorry.id), [lorry.id, tick]);
  const trips = useMemo(() => TripService.getByLorryId(lorry.id), [lorry.id]);

  const totalSpent = useMemo(
    () => services.reduce((s, r) => s + r.totalAmount, 0),
    [services]
  );

  const togglePart = (part: string) => {
    setSelectedParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const openModal = () => {
    setDate(todayIso());
    setOdometerKm('');
    setServiceCentre('');
    setServiceType('Periodic Service');
    setSelectedParts(['Engine oil', 'Oil filter']);
    setOtherPartNote('');
    setLabourCharges('');
    setTotalAmount('');
    setNextServiceDate('');
    setNextServiceKm('');
    setPaymentStatus('PAID');
    setTripId('');
    setNotes('');
    setErrorMsg('');
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const odo = Number(odometerKm);
    const labour = Number(labourCharges || 0);
    const total = Number(totalAmount);

    if (!serviceCentre.trim() || !serviceType.trim()) {
      setErrorMsg('Please enter service centre and service type.');
      return;
    }
    if (!Number.isFinite(odo) || odo < 0) {
      setErrorMsg('Please enter a valid odometer reading.');
      return;
    }
    if (!Number.isFinite(total) || total < 0) {
      setErrorMsg('Please enter a valid total service amount.');
      return;
    }

    const parts = selectedParts
      .filter((p) => p !== 'Other')
      .concat(
        selectedParts.includes('Other') && otherPartNote.trim()
          ? [otherPartNote.trim()]
          : selectedParts.includes('Other')
            ? ['Other']
            : []
      );

    MaintenanceService.addService({
      lorryId: lorry.id,
      date,
      odometerKm: odo,
      serviceCentre: serviceCentre.trim(),
      serviceType: serviceType.trim(),
      partsReplaced: parts,
      labourCharges: Number.isFinite(labour) && labour >= 0 ? labour : 0,
      totalAmount: total,
      nextServiceDate: nextServiceDate || undefined,
      nextServiceKm: nextServiceKm ? Number(nextServiceKm) : undefined,
      paymentStatus,
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
            Service &amp; Parts — <span className="font-mono">{lorry.registrationNumber}</span>
          </h2>
          <p className="text-xs text-slate-500">
            Track scheduled servicing, spare parts replaced, and upcoming service due dates.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openModal}
          className="min-h-[44px] w-full sm:w-auto"
        >
          Add Service
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Total Service Cost</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatINR(totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Services Recorded</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{services.length}</p>
        </div>
      </div>

      {/* Service History */}
      {services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Settings className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-semibold text-slate-800">No service records yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Click &ldquo;Add Service&rdquo; to log oil changes, filter replacements, or periodic maintenance.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((srv) => (
            <div key={srv.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{srv.serviceType}</span>
                    <span
                      className={clsx(
                        'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                        srv.paymentStatus === 'PAID'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      )}
                    >
                      {srv.paymentStatus}
                    </span>
                    {srv.tripId && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                        {srv.tripId}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {formatDateOnly(srv.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5 text-slate-400" />
                      {srv.serviceCentre}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5 text-slate-400" />
                      {srv.odometerKm.toLocaleString('en-IN')} km
                    </span>
                  </div>

                  {srv.partsReplaced.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {srv.partsReplaced.map((p) => (
                        <span
                          key={p}
                          className="rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {(srv.nextServiceDate || srv.nextServiceKm) && (
                    <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 inline-block rounded-lg px-2.5 py-1">
                      Next Service:{' '}
                      {srv.nextServiceDate ? formatDateOnly(srv.nextServiceDate) : '—'}
                      {srv.nextServiceKm ? ` · ${srv.nextServiceKm.toLocaleString('en-IN')} km` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-base font-bold text-slate-900">{formatINR(srv.totalAmount)}</p>
                    <p className="text-[11px] text-slate-500">
                      Labour: {formatINR(srv.labourCharges)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleting(srv)}
                    className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    aria-label="Delete service record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Service & Parts Record"
        subtitle={`Lorry ${lorry.registrationNumber}`}
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
              <label className="mb-1 block text-xs font-semibold text-slate-700">Service Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Odometer (km)</label>
              <input
                type="number"
                required
                min="0"
                value={odometerKm}
                onChange={(e) => setOdometerKm(e.target.value)}
                placeholder="e.g., 145000"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Service Centre</label>
              <input
                type="text"
                required
                value={serviceCentre}
                onChange={(e) => setServiceCentre(e.target.value)}
                placeholder="e.g., Tata Authorised Service"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Service Type</label>
              <input
                type="text"
                required
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="e.g., Periodic 150,000 km Service"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          {/* Selectable Parts Replaced */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Parts Replaced</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PART_OPTIONS.map((part) => {
                const active = selectedParts.includes(part);
                return (
                  <button
                    key={part}
                    type="button"
                    onClick={() => togglePart(part)}
                    className={clsx(
                      'min-h-[44px] rounded-lg border px-2.5 text-xs font-semibold transition-colors',
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    )}
                  >
                    {part}
                  </button>
                );
              })}
            </div>
            {selectedParts.includes('Other') && (
              <input
                type="text"
                value={otherPartNote}
                onChange={(e) => setOtherPartNote(e.target.value)}
                placeholder="Specify other part(s) replaced"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            )}
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
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Total bill"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Next Service Date</label>
              <input
                type="date"
                value={nextServiceDate}
                onChange={(e) => setNextServiceDate(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Next Service KM</label>
              <input
                type="number"
                min="0"
                value={nextServiceKm}
                onChange={(e) => setNextServiceKm(e.target.value)}
                placeholder="e.g., 155000"
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
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

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="min-h-[44px]">
              Save Service Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Service Record?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Delete <span className="font-bold">{deleting?.serviceType}</span> at {deleting?.serviceCentre}?
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
                  MaintenanceService.deleteService(deleting.id);
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
