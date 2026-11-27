import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Trash2,
  Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Lorry } from '../../types/lorry';
import {
  MaintenancePaymentStatus,
  ProblemRecord,
  ProblemType,
  RepairStatus,
} from '../../types/maintenance';
import { MaintenanceService } from '../../services/maintenanceService';
import { TripService } from '../../services/tripService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatDateOnly, formatINR } from '../../utils/formatters';

interface ProblemsRepairsSectionProps {
  lorry: Lorry;
}

const PROBLEM_TYPES: ProblemType[] = [
  'Engine problem',
  'Tyre problem',
  'Brake problem',
  'Battery problem',
  'Clutch problem',
  'Gearbox problem',
  'Electrical problem',
  'Accident damage',
  'Other',
];

const REPAIR_STATUSES: RepairStatus[] = ['Pending', 'In Progress', 'Completed'];

const STATUS_BADGE: Record<RepairStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

export const ProblemsRepairsSection: React.FC<ProblemsRepairsSectionProps> = ({ lorry }) => {
  const [tick, setTick] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'ALL' | RepairStatus>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProblemRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ProblemRecord | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<ProblemRecord | null>(null);

  // Form state (ASK -> ENTER DETAILS -> SAVE)
  const [problemType, setProblemType] = useState<ProblemType>('Engine problem');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayIso());
  const [location, setLocation] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [repairCostStr, setRepairCostStr] = useState('');
  const [status, setStatus] = useState<RepairStatus>('Pending');
  const [paymentStatus, setPaymentStatus] = useState<MaintenancePaymentStatus>('UNPAID');
  const [tripId, setTripId] = useState('');
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string | undefined>(undefined);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    return MaintenanceService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const problems = useMemo(() => MaintenanceService.getProblems(lorry.id), [lorry.id, tick]);
  const trips = useMemo(() => TripService.getByLorryId(lorry.id), [lorry.id]);

  const filteredProblems = useMemo(
    () =>
      statusFilter === 'ALL'
        ? problems
        : problems.filter((p) => p.status === statusFilter),
    [problems, statusFilter]
  );

  const stats = useMemo(() => {
    const totalCost = problems.reduce((s, p) => s + (p.repairCost ?? 0), 0);
    const openCount = problems.filter((p) => p.status !== 'Completed').length;
    const completedCount = problems.filter((p) => p.status === 'Completed').length;
    return { totalCost, openCount, completedCount };
  }, [problems]);

  const openNewForm = () => {
    setEditingRecord(null);
    setProblemType('Engine problem');
    setDescription('');
    setDate(todayIso());
    setLocation('');
    setWorkshopName('');
    setRepairCostStr('');
    setStatus('Pending');
    setPaymentStatus('UNPAID');
    setTripId('');
    setAttachmentDataUrl(undefined);
    setAttachmentName(undefined);
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const openEditForm = (rec: ProblemRecord) => {
    setEditingRecord(rec);
    setProblemType(rec.problemType);
    setDescription(rec.description);
    setDate(rec.date);
    setLocation(rec.location);
    setWorkshopName(rec.workshopName ?? '');
    setRepairCostStr(rec.repairCost !== null ? String(rec.repairCost) : '');
    setStatus(rec.status);
    setPaymentStatus(rec.paymentStatus);
    setTripId(rec.tripId ?? '');
    setAttachmentDataUrl(rec.attachmentDataUrl);
    setAttachmentName(rec.attachmentName);
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Attachment must be smaller than 5 MB.');
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
    if (!description.trim()) {
      setErrorMsg('Please briefly explain what happened.');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('Please enter the location where the problem occurred.');
      return;
    }

    const trimmedCost = repairCostStr.trim();
    let parsedCost: number | null = null;
    if (trimmedCost !== '') {
      const n = Number(trimmedCost);
      if (!Number.isFinite(n) || n < 0) {
        setErrorMsg('Repair cost must be a valid positive number, or left blank if unknown.');
        return;
      }
      parsedCost = n;
    }

    const payload = {
      problemType,
      description: description.trim(),
      date,
      location: location.trim(),
      workshopName: workshopName.trim() || undefined,
      repairCost: parsedCost,
      status,
      paymentStatus: parsedCost === null ? 'UNPAID' : paymentStatus,
      tripId: tripId || undefined,
      attachmentDataUrl,
      attachmentName,
    };

    if (editingRecord) {
      MaintenanceService.updateProblem(editingRecord.id, payload);
    } else {
      MaintenanceService.addProblem({ lorryId: lorry.id, ...payload });
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Problems &amp; Repairs — <span className="font-mono">{lorry.registrationNumber}</span>
          </h2>
          <p className="text-xs text-slate-500">
            Report a breakdown or repair in seconds. Cost can be left blank if pending and updated later.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openNewForm}
          className="min-h-[44px] w-full sm:w-auto"
        >
          Report a Problem
        </Button>
      </div>

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Total Repair Cost</p>
          <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
            {formatINR(stats.totalCost)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Open / Pending</p>
          <p className="mt-1 text-base font-bold text-amber-700 sm:text-lg">{stats.openCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-slate-500">Completed</p>
          <p className="mt-1 text-base font-bold text-emerald-700 sm:text-lg">{stats.completedCount}</p>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', ...REPAIR_STATUSES] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={clsx(
              'min-h-[40px] rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              statusFilter === tab
                ? 'border-[#0b1329] bg-[#0b1329] text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            {tab === 'ALL' ? `All (${problems.length})` : tab}
          </button>
        ))}
      </div>

      {/* Saved Problems List */}
      {filteredProblems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-semibold text-slate-800">No problems reported yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Tap &ldquo;Report a Problem&rdquo; whenever this lorry has a breakdown, tyre issue, or workshop repair.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProblems.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{rec.problemType}</span>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                        STATUS_BADGE[rec.status]
                      )}
                    >
                      {rec.status === 'Completed' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {rec.status}
                    </span>
                    <span
                      className={clsx(
                        'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase',
                        rec.paymentStatus === 'PAID'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      )}
                    >
                      {rec.paymentStatus}
                    </span>
                    {rec.tripId && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                        {rec.tripId}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-700">{rec.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{formatDateOnly(rec.date)}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {rec.location}
                    </span>
                    {rec.workshopName && (
                      <span className="inline-flex items-center gap-1">
                        <Wrench className="h-3.5 w-3.5 text-slate-400" />
                        {rec.workshopName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cost & Actions */}
                <div className="flex flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-medium text-slate-500">Repair Cost</p>
                    <p className="text-base font-bold text-slate-900">
                      {rec.repairCost !== null ? (
                        formatINR(rec.repairCost)
                      ) : (
                        <span className="text-xs font-semibold text-amber-700">
                          Not entered yet
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {rec.attachmentDataUrl && (
                      <button
                        type="button"
                        onClick={() => setViewingAttachment(rec)}
                        className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        title="View bill / photo"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Photo</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditForm(rec)}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingRecord(rec)}
                      className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      aria-label={`Delete ${rec.problemType}`}
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

      {/* Report / Update Problem Modal (Simple ASK -> ENTER DETAILS -> SAVE flow) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRecord ? 'Update Problem & Repair' : 'Report a Problem'}
        subtitle={`Lorry ${lorry.registrationNumber} · Enter what happened and save easily`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Section A: What problem occurred? */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-900">
              A. What problem occurred?
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROBLEM_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProblemType(type)}
                  className={clsx(
                    'min-h-[44px] rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-colors',
                    problemType === type
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-300 hover:bg-white'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Section B: Explain what happened */}
          <div className="space-y-1.5">
            <label htmlFor="problem-desc" className="block text-sm font-bold text-slate-900">
              B. Explain what happened
            </label>
            <textarea
              id="problem-desc"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Rear left tyre burst near toll plaza, or air brake pressure dropped on ghat road..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Section C: When and where? */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-900">C. When and where?</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="problem-date" className="mb-1 block text-xs font-semibold text-slate-600">
                  Problem Date
                </label>
                <input
                  id="problem-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="problem-location" className="mb-1 block text-xs font-semibold text-slate-600">
                  Location
                </label>
                <input
                  id="problem-location"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Highway, city, or landmark"
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section D: Repair details */}
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">D. Repair details</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="workshop-name" className="mb-1 block text-xs font-semibold text-slate-600">
                  Mechanic / Workshop Name (optional)
                </label>
                <input
                  id="workshop-name"
                  type="text"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  placeholder="e.g., Highway Truck Works"
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="repair-cost" className="mb-1 block text-xs font-semibold text-slate-600">
                  Repair Cost in ₹ (leave blank if unknown)
                </label>
                <input
                  id="repair-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={repairCostStr}
                  onChange={(e) => setRepairCostStr(e.target.value)}
                  placeholder="Leave blank if pending"
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Repair Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RepairStatus)}
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  {REPAIR_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as MaintenancePaymentStatus)}
                  disabled={repairCostStr.trim() === ''}
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="UNPAID">Unpaid / Pending</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Related Trip (optional)
                </label>
                <select
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                >
                  <option value="">None / Not linked</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id} · {t.startLocation} → {t.destination}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Optional Bill / Damage Photo
              </label>
              <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-400">
                <Camera className="h-4 w-4 text-blue-600" />
                <span>{attachmentName ? `Attached: ${attachmentName}` : 'Upload or Capture Photo / Bill'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Section E: Save Problem Record */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsFormOpen(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="min-h-[44px]">
              {editingRecord ? 'Save Changes' : 'Save Problem Record'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal
        isOpen={!!viewingAttachment}
        onClose={() => setViewingAttachment(null)}
        title="Repair Bill / Photo"
        subtitle={viewingAttachment?.problemType}
        maxWidth="lg"
      >
        {viewingAttachment?.attachmentDataUrl && (
          <img
            src={viewingAttachment.attachmentDataUrl}
            alt={viewingAttachment.attachmentName ?? 'Repair attachment'}
            className="max-h-[70vh] w-full rounded-lg object-contain bg-slate-100"
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        title="Delete Problem Record?"
        subtitle="This action removes the record from this lorry's history."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Are you sure you want to delete{' '}
            <span className="font-bold">{deletingRecord?.problemType}</span> recorded on{' '}
            {deletingRecord ? formatDateOnly(deletingRecord.date) : ''}?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeletingRecord(null)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (deletingRecord) {
                  MaintenanceService.deleteProblem(deletingRecord.id);
                  setDeletingRecord(null);
                }
              }}
              className="min-h-[44px]"
            >
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
