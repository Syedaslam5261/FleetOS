import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Fuel,
  IndianRupee,
  MapPin,
  Navigation,
  Receipt,
  Route,
} from 'lucide-react';
import { clsx } from 'clsx';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ProfileEmptyState } from '../fleet/profile/ProfileParts';
import { Lorry } from '../../types/lorry';
import { TripDieselRecord, TripPeriodMode, TripStatus } from '../../types/tripDiesel';
import { DEFAULT_TRIP_REFERENCE_DATE, TRIP_DIESEL_RECORDS } from '../../services/mockTripDieselData';
import {
  buildTripChartData,
  filterTripsByPeriod,
  getWeekBounds,
  shiftDateByDays,
  summarizeTripDiesel,
} from '../../utils/tripDieselAnalytics';
import { formatDateOnly, formatINR, formatLiters } from '../../utils/formatters';

interface TripDieselAnalyticsSectionProps {
  lorry: Lorry;
}

const PERIOD_MODES: Array<{ key: TripPeriodMode; label: string }> = [
  { key: 'daily', label: 'Daily' },
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

const YEARS = ['2026', '2025', '2024'];

const STATUS_BADGE: Record<TripStatus, 'success' | 'info' | 'warning'> = {
  Completed: 'success',
  'In Transit': 'info',
  Scheduled: 'warning',
};

export const TripDieselAnalyticsSection: React.FC<TripDieselAnalyticsSectionProps> = ({ lorry }) => {
  const [mode, setMode] = useState<TripPeriodMode>('monthly');
  const [selectedDay, setSelectedDay] = useState(DEFAULT_TRIP_REFERENCE_DATE);
  const [weekAnchor, setWeekAnchor] = useState(DEFAULT_TRIP_REFERENCE_DATE);
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_TRIP_REFERENCE_DATE.slice(0, 7)); // 2026-11
  const [selectedYear, setSelectedYear] = useState(DEFAULT_TRIP_REFERENCE_DATE.slice(0, 4)); // 2026
  const [selectedTrip, setSelectedTrip] = useState<TripDieselRecord | null>(null);

  const selection = useMemo(
    () => ({
      day: selectedDay,
      weekAnchor,
      month: selectedMonth,
      year: selectedYear,
    }),
    [selectedDay, weekAnchor, selectedMonth, selectedYear]
  );

  // Strictly filtered by selected lorryId + selected time period
  const filteredTrips = useMemo(
    () => filterTripsByPeriod(TRIP_DIESEL_RECORDS, lorry.id, mode, selection),
    [lorry.id, mode, selection]
  );

  // All summary cards calculated from the exact same filtered trip records
  const summary = useMemo(() => summarizeTripDiesel(filteredTrips), [filteredTrips]);

  // Chart buckets calculated from the exact same filtered trip records
  const chartData = useMemo(
    () => buildTripChartData(filteredTrips, mode, selection),
    [filteredTrips, mode, selection]
  );

  const weekBounds = useMemo(() => getWeekBounds(weekAnchor), [weekAnchor]);

  const periodSubtitle = useMemo(() => {
    if (mode === 'daily') return `Trip-wise diesel expenses on ${formatDateOnly(`${selectedDay}T00:00:00Z`)}`;
    if (mode === 'weekly') {
      return `Daily diesel expenses · ${formatDateOnly(`${weekBounds.start}T00:00:00Z`)} to ${formatDateOnly(
        `${weekBounds.end}T00:00:00Z`
      )}`;
    }
    if (mode === 'monthly') {
      const [y, m] = selectedMonth.split('-');
      const mName = MONTHS.find((item) => item.value === m)?.label ?? m;
      return `Weekly diesel expense trend · ${mName} ${y}`;
    }
    return `Monthly diesel expense trend · Year ${selectedYear}`;
  }, [mode, selectedDay, weekBounds, selectedMonth, selectedYear]);

  const [monthYear, monthPart] = selectedMonth.split('-');

  return (
    <div className="space-y-6">
      {/* DEMO Label + Time Period Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* 4 Period Mode Buttons */}
          <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-100 p-1">
            {PERIOD_MODES.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setMode(p.key)}
                className={clsx(
                  'rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  mode === p.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Specific Date / Week / Month / Year Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 hidden sm:block" />

            {mode === 'daily' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedDay((d) => shiftDateByDays(d, -1))}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                  title="Previous day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                  type="date"
                  value={selectedDay}
                  onChange={(e) => e.target.value && setSelectedDay(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDay((d) => shiftDateByDays(d, 1))}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                  title="Next day"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {mode === 'weekly' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setWeekAnchor((d) => shiftDateByDays(d, -7))}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                  title="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <input
                  type="date"
                  value={weekAnchor}
                  onChange={(e) => e.target.value && setWeekAnchor(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  title="Pick any date within the desired week"
                />
                <button
                  type="button"
                  onClick={() => setWeekAnchor((d) => shiftDateByDays(d, 7))}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                  title="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700">
                  {formatDateOnly(`${weekBounds.start}T00:00:00Z`)} – {formatDateOnly(`${weekBounds.end}T00:00:00Z`)}
                </span>
              </div>
            )}

            {mode === 'monthly' && (
              <div className="flex items-center gap-2">
                <select
                  value={monthPart}
                  onChange={(e) => setSelectedMonth(`${monthYear}-${e.target.value}`)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={monthYear}
                  onChange={(e) => setSelectedMonth(`${e.target.value}-${monthPart}`)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'yearly' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            )}

            <span className="rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              DEMO Data
            </span>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Trips"
          value={summary.totalTrips.toLocaleString('en-IN')}
          unit={summary.totalTrips === 1 ? 'Trip' : 'Trips'}
          icon={<Route className="h-5 w-5" />}
          accentColor="blue"
          secondaryText={lorry.registrationNumber}
        />
        <StatCard
          title="Total Distance"
          value={Math.round(summary.totalDistanceKm).toLocaleString('en-IN')}
          unit="KM"
          icon={<Navigation className="h-5 w-5" />}
          accentColor="indigo"
          secondaryText="Sum of trip distances"
        />
        <StatCard
          title="Total Diesel Consumed"
          value={summary.totalDieselLitres.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
          unit="Litres"
          icon={<Fuel className="h-5 w-5" />}
          accentColor="emerald"
          secondaryText="Actual recorded fuel"
        />
        <StatCard
          title="Total Diesel Expense"
          value={formatINR(Math.round(summary.totalDieselExpense))}
          icon={<IndianRupee className="h-5 w-5" />}
          accentColor="amber"
          secondaryText="Recorded trip fuel cost"
        />
      </div>

      {/* Diesel Cost Analytics Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Diesel Cost Analytics</h3>
              <p className="text-[11px] text-slate-500">{periodSubtitle}</p>
            </div>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-600">
            Total: {formatINR(Math.round(summary.totalDieselExpense))}
          </span>
        </div>

        {filteredTrips.length === 0 ? (
          <ProfileEmptyState
            title="No trip diesel data for this period"
            message={`No recorded trips found for ${lorry.registrationNumber} in the selected ${mode} period.`}
          />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(v: number) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                />
                <Tooltip
                  formatter={(value: unknown, _name: unknown, item: any) => {
                    const pt = item?.payload;
                    const costStr = formatINR(Math.round(Number(value)));
                    const extra = pt
                      ? ` (${pt.litres.toFixed(1)} L · ${pt.trips} ${pt.trips === 1 ? 'trip' : 'trips'})`
                      : '';
                    return [`${costStr}${extra}`, 'Diesel Expense'];
                  }}
                />
                <Bar
                  name="Diesel Expense (₹)"
                  dataKey="expense"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Trip-wise Diesel Records Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Trip-wise Diesel Records</h3>
              <p className="text-[11px] text-slate-500">
                Click any trip row to view detailed diesel expense breakdown.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
          </span>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="p-6">
            <ProfileEmptyState
              title="No trips recorded"
              message={`No trips match ${lorry.registrationNumber} for this ${mode} filter. Try another date, week, month, or year.`}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Trip ID</th>
                  <th className="px-4 py-3">Starting Location</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Trip Date</th>
                  <th className="px-4 py-3 text-right">Distance (KM)</th>
                  <th className="px-4 py-3 text-right">Diesel Consumed (L)</th>
                  <th className="px-4 py-3 text-right">Diesel Price (₹/L)</th>
                  <th className="px-4 py-3 text-right">Total Diesel Cost (₹)</th>
                  <th className="px-4 py-3 text-center">Trip Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrips.map((trip) => (
                  <tr
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-blue-700">
                      {trip.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                      {trip.startLocation}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                      {trip.destination}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDateOnly(`${trip.tripDate}T00:00:00Z`)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-slate-800">
                      {trip.distanceKm.toLocaleString('en-IN')} km
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-slate-900">
                      {formatLiters(trip.dieselLitres)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-slate-600">
                      ₹{trip.dieselPricePerL.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(trip.totalDieselCost)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <Badge variant={STATUS_BADGE[trip.status]} size="sm" dot>
                        {trip.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400">
        DEMO data — actual recorded trip diesel expenses for {lorry.registrationNumber}. Kept separate from Fuel Calculator estimates.
      </p>

      {/* Trip Detailed Diesel Expense Modal */}
      {selectedTrip && (
        <Modal
          isOpen={!!selectedTrip}
          onClose={() => setSelectedTrip(null)}
          title={`Trip Diesel Details — ${selectedTrip.id}`}
          subtitle={`${lorry.registrationNumber} · ${selectedTrip.startLocation} → ${selectedTrip.destination}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>
                  {selectedTrip.startLocation} → {selectedTrip.destination}
                </span>
              </div>
              <Badge variant={STATUS_BADGE[selectedTrip.status]} size="sm" dot>
                {selectedTrip.status}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <dt className="text-slate-400 text-[10px] uppercase font-semibold">Trip Date</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {formatDateOnly(`${selectedTrip.tripDate}T00:00:00Z`)}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <dt className="text-slate-400 text-[10px] uppercase font-semibold">Driver</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{selectedTrip.driverName}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <dt className="text-slate-400 text-[10px] uppercase font-semibold">Fuel Station</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{selectedTrip.fuelStation}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <dt className="text-slate-400 text-[10px] uppercase font-semibold">Receipt No.</dt>
                <dd className="mt-0.5 font-mono font-semibold text-slate-900">{selectedTrip.receiptNo}</dd>
              </div>
            </dl>

            {/* Formula Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Trip Distance</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedTrip.distanceKm.toLocaleString('en-IN')} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diesel Consumed</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatLiters(selectedTrip.dieselLitres)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diesel Price per Litre</span>
                <span className="font-mono font-semibold text-slate-900">
                  ₹{selectedTrip.dieselPricePerL.toFixed(2)}/L
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trip Mileage (Distance ÷ Litres)</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {(selectedTrip.distanceKm / selectedTrip.dieselLitres).toFixed(2)} km/L
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fuel Cost per KM</span>
                <span className="font-mono font-semibold text-slate-900">
                  ₹{(selectedTrip.totalDieselCost / selectedTrip.distanceKm).toFixed(2)}/km
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
                <span className="font-bold text-slate-900">
                  Total Diesel Cost ({selectedTrip.dieselLitres} L × ₹{selectedTrip.dieselPricePerL.toFixed(2)})
                </span>
                <span className="font-mono text-base font-bold text-blue-700">
                  {formatINR(selectedTrip.totalDieselCost)}
                </span>
              </div>
            </div>

            {selectedTrip.notes && (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                <strong className="text-slate-800">Notes:</strong> {selectedTrip.notes}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
