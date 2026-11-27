import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Fuel,
  IndianRupee,
  MapPin,
  Receipt,
  Route,
  Truck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ProfileEmptyState } from '../fleet/profile/ProfileParts';
import { FuelReceiptDetailModal } from './FuelReceiptDetailModal';
import { Lorry } from '../../types/lorry';
import { FleetTripRecord, FuelReceiptRecord } from '../../types/fuelReceipt';
import { LorryService } from '../../services/lorryService';
import { TripService } from '../../services/tripService';
import { FuelReceiptService } from '../../services/fuelReceiptService';
import { getWeekBounds, shiftDateByDays } from '../../utils/tripDieselAnalytics';
import {
  PurchaseReportFilter,
  TripWithPurchases,
  buildMonthlyTripReport,
  buildWeeklyTripReport,
  buildYearlyTripReport,
  isReceiptOutsideTripTimeline,
  summarizePurchases,
} from '../../utils/purchasedDieselAnalytics';
import { formatDateOnly, formatINR, formatLiters } from '../../utils/formatters';

interface PurchasedDieselReportsSectionProps {
  lorry: Lorry;
  onSwitchLorry: (nextLorryId: string) => void;
}

const REPORT_FILTERS: Array<{ key: PurchaseReportFilter; label: string }> = [
  { key: 'trip', label: 'Trip-wise' },
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

const YEARS = ['2026', '2025'];
const DEFAULT_ANCHOR = '2026-11-25';

const StatusBadge: React.FC<{ status: 'PAID' | 'UNPAID' }> = ({ status }) =>
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

const PurchaseRows: React.FC<{
  purchases: FuelReceiptRecord[];
  trip?: FleetTripRecord;
  onViewReceipt: (r: FuelReceiptRecord) => void;
}> = ({ purchases, trip, onViewReceipt }) => {
  if (purchases.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-slate-400">
        No fuel purchases linked to this trip yet.
      </p>
    );
  }

  return (
    <>
      {/* Mobile Purchase Cards (< 768px) */}
      <div className="divide-y divide-slate-100 md:hidden">
        {purchases.map((r) => {
          const flagged = trip ? isReceiptOutsideTripTimeline(r, trip) : false;
          return (
            <div key={r.id} className="space-y-2 py-3 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{r.fuelStation}</p>
                  {r.stationLocation && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{r.stationLocation}</span>
                    </p>
                  )}
                </div>
                <StatusBadge status={r.paymentStatus} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {formatDateOnly(`${r.receiptDate}T00:00:00Z`)}
                  {r.receiptTime ? ` · ${r.receiptTime}` : ''}
                </span>
                <span className="font-mono text-slate-500">{r.receiptNumber}</span>
              </div>

              {flagged && (
                <div className="flex items-center gap-1.5 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                  <span>Outside trip timeline — flagged for manual review</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-slate-700">
                  {formatLiters(r.dieselLitres)} @ ₹{r.pricePerLitre.toFixed(2)}/L
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {formatINR(r.totalAmount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewReceipt(r)}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Receipt
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Purchase Table (>= 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3.5 py-2.5">Date & Time</th>
              <th className="px-3.5 py-2.5">Fuel Station & Location</th>
              <th className="px-3.5 py-2.5">Receipt No.</th>
              <th className="px-3.5 py-2.5 text-right">Litres</th>
              <th className="px-3.5 py-2.5 text-right">Price / L</th>
              <th className="px-3.5 py-2.5 text-right">Total Amount</th>
              <th className="px-3.5 py-2.5 text-center">Status</th>
              <th className="px-3.5 py-2.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.map((r) => {
              const flagged = trip ? isReceiptOutsideTripTimeline(r, trip) : false;
              return (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-slate-700">
                    <p className="font-medium text-slate-900">{formatDateOnly(`${r.receiptDate}T00:00:00Z`)}</p>
                    <p className="font-mono text-[11px] text-slate-500">{r.receiptTime || '—'}</p>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <p className="font-semibold text-slate-900">{r.fuelStation}</p>
                    {r.stationLocation && <p className="text-[11px] text-slate-500">{r.stationLocation}</p>}
                    {flagged && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        <AlertTriangle className="h-3 w-3 text-amber-600" /> Outside trip timeline — manual review
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 font-mono font-semibold text-slate-700">
                    {r.receiptNumber}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-mono font-semibold text-slate-900">
                    {formatLiters(r.dieselLitres)}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-mono text-slate-600">
                    ₹{r.pricePerLitre.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-right font-mono font-bold text-slate-900">
                    {formatINR(r.totalAmount)}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-center">
                    <StatusBadge status={r.paymentStatus} />
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onViewReceipt(r)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Receipt
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

const ExpandableTripCard: React.FC<{
  item: TripWithPurchases;
  isExpanded: boolean;
  onToggle: () => void;
  onViewReceipt: (r: FuelReceiptRecord) => void;
}> = ({ item, isExpanded, onToggle, onViewReceipt }) => {
  const { trip, purchases, totalLitres, totalAmount, flaggedTimelineCount } = item;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-3 p-4 text-left hover:bg-slate-50/70 transition-colors sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700">{trip.id}</span>
              <span className="text-sm font-bold text-slate-900">
                {trip.startLocation} → {trip.destination}
              </span>
              {flaggedTimelineCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  <AlertTriangle className="h-3 w-3" /> {flaggedTimelineCount} Review
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDateOnly(`${trip.startDate}T00:00:00Z`)} – {formatDateOnly(`${trip.completionDate}T00:00:00Z`)} ·{' '}
              {purchases.length} {purchases.length === 1 ? 'diesel purchase' : 'diesel purchases'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pl-11 sm:pl-0 sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Diesel</p>
            <p className="font-mono text-xs font-bold text-slate-800">{formatLiters(totalLitres)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase text-slate-400">Amount</p>
            <p className="font-mono text-sm font-bold text-slate-900">{formatINR(totalAmount)}</p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50/40 px-4 py-3">
          <PurchaseRows purchases={purchases} trip={trip} onViewReceipt={onViewReceipt} />
        </div>
      )}
    </div>
  );
};

export const PurchasedDieselReportsSection: React.FC<PurchasedDieselReportsSectionProps> = ({
  lorry,
  onSwitchLorry,
}) => {
  const allLorries = useMemo(() => LorryService.getAllLorries(), []);
  const lorryTrips = useMemo(() => TripService.getByLorryId(lorry.id), [lorry.id]);

  const [receipts, setReceipts] = useState<FuelReceiptRecord[]>(() =>
    FuelReceiptService.getByLorryId(lorry.id)
  );
  const [filterMode, setFilterMode] = useState<PurchaseReportFilter>('trip');

  // Filter selections
  const [selectedTripId, setSelectedTripId] = useState<string>(() => lorryTrips[0]?.id ?? '');
  const [weekAnchor, setWeekAnchor] = useState(DEFAULT_ANCHOR);
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Inline expansion state
  const [expandedTrips, setExpandedTrips] = useState<Record<string, boolean>>({});

  // Receipt detail modal
  const [viewingReceipt, setViewingReceipt] = useState<FuelReceiptRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Sync receipts and reset trip selection cleanly whenever lorry changes
  useEffect(() => {
    setReceipts(FuelReceiptService.getByLorryId(lorry.id));
    setSelectedTripId(lorryTrips[0]?.id ?? '');
    setExpandedTrips({});
    const unsub = FuelReceiptService.subscribe(() => {
      const latest = FuelReceiptService.getByLorryId(lorry.id);
      setReceipts(latest);
      setViewingReceipt((curr) => (curr ? latest.find((r) => r.id === curr.id) ?? null : null));
    });
    return unsub;
  }, [lorry.id, lorryTrips]);

  const toggleTrip = (tripId: string) => {
    setExpandedTrips((prev) => ({ ...prev, [tripId]: !prev[tripId] }));
  };

  // Compute active report dynamically from underlying saved receipts
  const activeTrip = useMemo(
    () => lorryTrips.find((t) => t.id === selectedTripId) ?? lorryTrips[0],
    [lorryTrips, selectedTripId]
  );

  const tripWiseData = useMemo(() => {
    const tripPurchases = activeTrip ? receipts.filter((r) => r.tripId === activeTrip.id) : [];
    const unassigned = receipts.filter((r) => !r.tripId);
    const summary = summarizePurchases(tripPurchases, activeTrip ? 1 : 0);
    return { trip: activeTrip, purchases: tripPurchases, unassigned, summary };
  }, [activeTrip, receipts]);

  const weeklyData = useMemo(
    () => buildWeeklyTripReport(lorryTrips, receipts, weekAnchor),
    [lorryTrips, receipts, weekAnchor]
  );

  const monthlyData = useMemo(
    () => buildMonthlyTripReport(lorryTrips, receipts, selectedMonth),
    [lorryTrips, receipts, selectedMonth]
  );

  const yearlyData = useMemo(
    () => buildYearlyTripReport(lorryTrips, receipts, selectedYear),
    [lorryTrips, receipts, selectedYear]
  );

  const activeSummary =
    filterMode === 'trip'
      ? tripWiseData.summary
      : filterMode === 'weekly'
        ? weeklyData.summary
        : filterMode === 'monthly'
          ? monthlyData.summary
          : yearlyData.summary;

  const activeUnassigned =
    filterMode === 'trip'
      ? tripWiseData.unassigned
      : filterMode === 'weekly'
        ? weeklyData.unassignedReceipts
        : filterMode === 'monthly'
          ? monthlyData.unassignedReceipts
          : yearlyData.unassignedReceipts;

  const weekBounds = useMemo(() => getWeekBounds(weekAnchor), [weekAnchor]);
  const [monthYr, monthMo] = selectedMonth.split('-');

  return (
    <div className="space-y-6">
      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Lorry Selector + Exactly Four Report Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Lorry Dropdown */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Truck className="h-4 w-4 text-blue-600" /> Lorry:
            </label>
            <select
              value={lorry.id}
              onChange={(e) => onSwitchLorry(e.target.value)}
              className="min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {allLorries.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.registrationNumber} — {l.vehicleType}
                </option>
              ))}
            </select>
            <span className="inline-block w-fit rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
              DEMO Data
            </span>
          </div>

          {/* Exactly Four Filters: Trip-wise | Weekly | Monthly | Yearly */}
          <div className="grid grid-cols-4 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 sm:inline-flex">
            {REPORT_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterMode(f.key)}
                className={clsx(
                  'min-h-[40px] sm:min-h-[36px] rounded-md px-2 sm:px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  filterMode === f.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period / Trip Picker Row */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <Calendar className="h-4 w-4 text-slate-400 hidden sm:block" />

          {filterMode === 'trip' && (
            lorryTrips.length > 0 ? (
              <select
                value={activeTrip?.id ?? ''}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="min-h-[42px] w-full sm:w-auto sm:min-w-[360px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {lorryTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} — {t.startLocation} → {t.destination} ({formatDateOnly(`${t.startDate}T00:00:00Z`)} to{' '}
                    {formatDateOnly(`${t.completionDate}T00:00:00Z`)})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-slate-500">No trips recorded for {lorry.registrationNumber}.</span>
            )
          )}

          {filterMode === 'weekly' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWeekAnchor((d) => shiftDateByDays(d, -7))}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                title="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={weekAnchor}
                onChange={(e) => e.target.value && setWeekAnchor(e.target.value)}
                className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800"
              />
              <button
                type="button"
                onClick={() => setWeekAnchor((d) => shiftDateByDays(d, 7))}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                title="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="rounded-lg bg-slate-100 px-2.5 py-2 text-[11px] font-semibold text-slate-700">
                {formatDateOnly(`${weekBounds.start}T00:00:00Z`)} – {formatDateOnly(`${weekBounds.end}T00:00:00Z`)}
              </span>
            </div>
          )}

          {filterMode === 'monthly' && (
            <div className="flex items-center gap-2">
              <select
                value={monthMo}
                onChange={(e) => setSelectedMonth(`${monthYr}-${e.target.value}`)}
                className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={monthYr}
                onChange={(e) => setSelectedMonth(`${e.target.value}-${monthMo}`)}
                className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Four Purchase Summary Cards (Light grey/white clean cards, Paid & Unpaid split clearly) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Trips in Period</span>
            <Route className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-900">{activeSummary.tripsCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">{lorry.registrationNumber}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Purchase Entries</span>
            <Receipt className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-900">{activeSummary.purchaseEntries}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-700">{activeSummary.paidCount} Paid</span> ·{' '}
            <span className="font-semibold text-rose-700">{activeSummary.unpaidCount} Unpaid</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Diesel Purchased</span>
            <Fuel className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
            {formatLiters(activeSummary.totalLitres)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Saved fuel receipts only</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Purchase Amount</span>
            <IndianRupee className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
            {formatINR(Math.round(activeSummary.totalAmount))}
          </p>
          <p className="mt-1 text-[11px]">
            <span className="font-semibold text-emerald-700">
              Paid: {formatINR(Math.round(activeSummary.paidAmount))}
            </span>{' '}
            ·{' '}
            <span className="font-semibold text-rose-700">
              Unpaid: {formatINR(Math.round(activeSummary.unpaidAmount))}
            </span>
          </p>
        </div>
      </div>

      {/* VIEW 1: TRIP-WISE */}
      {filterMode === 'trip' && (
        tripWiseData.trip ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700">{tripWiseData.trip.id}</span>
                  <h3 className="text-base font-bold text-slate-900">
                    {tripWiseData.trip.startLocation} → {tripWiseData.trip.destination}
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Start: {formatDateOnly(`${tripWiseData.trip.startDate}T00:00:00Z`)} · Completion:{' '}
                  {formatDateOnly(`${tripWiseData.trip.completionDate}T00:00:00Z`)} · Status: {tripWiseData.trip.status}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Total Litres: </span>
                  <strong className="font-mono text-slate-900">{formatLiters(tripWiseData.summary.totalLitres)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Total Amount: </span>
                  <strong className="font-mono text-blue-700">{formatINR(tripWiseData.summary.totalAmount)}</strong>
                </div>
              </div>
            </div>
            <div className="p-4">
              <PurchaseRows
                purchases={tripWiseData.purchases}
                trip={tripWiseData.trip}
                onViewReceipt={setViewingReceipt}
              />
            </div>
          </div>
        ) : (
          <ProfileEmptyState
            title="No trips recorded for this lorry"
            message={`${lorry.registrationNumber} has no trips yet. Switch to another lorry or scan a fuel receipt.`}
          />
        )
      )}

      {/* VIEW 2: WEEKLY */}
      {filterMode === 'weekly' && (
        weeklyData.tripsWithPurchases.length === 0 ? (
          <ProfileEmptyState
            title="No trips during this week"
            message={`No trips found for ${lorry.registrationNumber} between ${formatDateOnly(
              `${weeklyData.start}T00:00:00Z`
            )} and ${formatDateOnly(`${weeklyData.end}T00:00:00Z`)}.`}
          />
        ) : (
          <div className="space-y-3">
            {weeklyData.tripsWithPurchases.map((item) => (
              <ExpandableTripCard
                key={item.trip.id}
                item={item}
                isExpanded={!!expandedTrips[item.trip.id]}
                onToggle={() => toggleTrip(item.trip.id)}
                onViewReceipt={setViewingReceipt}
              />
            ))}
          </div>
        )
      )}

      {/* VIEW 3: MONTHLY (Grouped by Week) */}
      {filterMode === 'monthly' && (
        monthlyData.weekGroups.length === 0 ? (
          <ProfileEmptyState
            title="No trips during this month"
            message={`No trips found for ${lorry.registrationNumber} in ${selectedMonth}.`}
          />
        ) : (
          <div className="space-y-5">
            {monthlyData.weekGroups.map((group) => (
              <div key={group.key} className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 text-xs">
                  <h3 className="font-bold text-slate-800">{group.label}</h3>
                  <span className="font-mono text-slate-600">
                    {group.purchaseEntries} entries · {formatLiters(group.totalLitres)} ·{' '}
                    <strong className="text-slate-900">{formatINR(Math.round(group.totalAmount))}</strong>
                  </span>
                </div>
                <div className="space-y-2.5">
                  {group.trips.map((item) => (
                    <ExpandableTripCard
                      key={item.trip.id}
                      item={item}
                      isExpanded={!!expandedTrips[item.trip.id]}
                      onToggle={() => toggleTrip(item.trip.id)}
                      onViewReceipt={setViewingReceipt}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* VIEW 4: YEARLY (Grouped by Month) */}
      {filterMode === 'yearly' && (
        yearlyData.monthGroups.length === 0 ? (
          <ProfileEmptyState
            title={`No trips in ${selectedYear}`}
            message={`No trips found for ${lorry.registrationNumber} in year ${selectedYear}.`}
          />
        ) : (
          <div className="space-y-5">
            {yearlyData.monthGroups.map((group) => (
              <div key={group.key} className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 text-xs">
                  <h3 className="font-bold text-slate-800">{group.label}</h3>
                  <span className="font-mono text-slate-600">
                    {group.purchaseEntries} entries · {formatLiters(group.totalLitres)} ·{' '}
                    <strong className="text-slate-900">{formatINR(Math.round(group.totalAmount))}</strong>
                  </span>
                </div>
                <div className="space-y-2.5">
                  {group.trips.map((item) => (
                    <ExpandableTripCard
                      key={item.trip.id}
                      item={item}
                      isExpanded={!!expandedTrips[item.trip.id]}
                      onToggle={() => toggleTrip(item.trip.id)}
                      onViewReceipt={setViewingReceipt}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* SEPARATE UNASSIGNED FUEL PURCHASES SECTION */}
      {activeUnassigned.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Unassigned Fuel Purchases ({activeUnassigned.length})
                </h3>
                <p className="text-[11px] text-amber-800">
                  Receipts not linked to a trip — never attached automatically without verification.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-amber-900">
              {formatINR(Math.round(activeUnassigned.reduce((s, r) => s + r.totalAmount, 0)))}
            </span>
          </div>
          <div className="p-4">
            <PurchaseRows purchases={activeUnassigned} onViewReceipt={setViewingReceipt} />
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400">
        DEMO data — calculated directly from saved Fuel Receipts for {lorry.registrationNumber}. Estimates from Fuel Calculator are excluded.
      </p>

      {/* Shared Fuel Receipt Detail Modal */}
      <FuelReceiptDetailModal
        receipt={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        onMarkedPaid={(updated) => {
          setToast(`Receipt ${updated.receiptNumber} updated to PAID (${updated.paymentMethod}).`);
          window.setTimeout(() => setToast(null), 4000);
        }}
      />
    </div>
  );
};
