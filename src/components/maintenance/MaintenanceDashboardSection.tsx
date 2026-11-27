import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  ChevronRight,
  Package,
  Receipt,
  Settings,
  UserRound,
  Wrench,
} from 'lucide-react';
import { Lorry } from '../../types/lorry';
import { MaintenanceService } from '../../services/maintenanceService';
import { getMonthlyMaintenanceSummary } from '../../utils/maintenanceAnalytics';
import { formatINR } from '../../utils/formatters';

export type MaintenanceSubKey =
  | 'problems'
  | 'service'
  | 'driver-payments'
  | 'load-handling'
  | 'other-expenses'
  | 'cost-reports';

interface MaintenanceDashboardSectionProps {
  lorry: Lorry;
  onOpenSection: (sub: MaintenanceSubKey) => void;
}

const SECTION_CARDS: {
  key: MaintenanceSubKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'problems',
    label: 'Problems & Repairs',
    description: 'Report breakdowns, workshop repairs & bills',
    icon: AlertTriangle,
  },
  {
    key: 'service',
    label: 'Service & Parts',
    description: 'Oil changes, spare parts & next service alerts',
    icon: Settings,
  },
  {
    key: 'driver-payments',
    label: 'Driver Payments',
    description: 'Salary, trip bata, food allowance & balance',
    icon: UserRound,
  },
  {
    key: 'load-handling',
    label: 'Load & Handling Expenses',
    description: 'Cargo details, loading & unloading charges',
    icon: Package,
  },
  {
    key: 'other-expenses',
    label: 'Other Lorry Expenses',
    description: 'Tolls, parking, washing, permits & roadside',
    icon: Receipt,
  },
  {
    key: 'cost-reports',
    label: 'Cost Reports',
    description: 'Trip-wise, weekly, monthly & yearly totals',
    icon: BarChart3,
  },
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

export const MaintenanceDashboardSection: React.FC<MaintenanceDashboardSectionProps> = ({
  lorry,
  onOpenSection,
}) => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('11');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    return MaintenanceService.subscribe(() => setTick((t) => t + 1));
  }, []);

  const monthStr = `${selectedYear}-${selectedMonth}`;
  const monthLabel = `${MONTHS.find((m) => m.value === selectedMonth)?.label ?? selectedMonth} ${selectedYear}`;

  const summary = useMemo(
    () => getMonthlyMaintenanceSummary(lorry.id, monthStr),
    [lorry.id, monthStr, tick]
  );

  const breakdownItems = useMemo(() => {
    const items = [
      { label: 'Repairs', amount: summary.totalRepairCost, color: 'bg-red-500', dot: 'bg-red-500' },
      { label: 'Service & Parts', amount: summary.serviceCost, color: 'bg-blue-600', dot: 'bg-blue-600' },
      { label: 'Driver Paid', amount: summary.driverPaymentsPaid, color: 'bg-emerald-600', dot: 'bg-emerald-600' },
      { label: 'Load & Handling', amount: summary.loadingUnloadingCost, color: 'bg-amber-500', dot: 'bg-amber-500' },
      { label: 'Other Expenses', amount: summary.otherExpensesCost, color: 'bg-slate-600', dot: 'bg-slate-600' },
    ];
    const total = items.reduce((s, i) => s + i.amount, 0);
    return { items, total };
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Header Row with Reporting Month Selector */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              Maintenance &amp; Lorry Cost Management
            </h1>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Demo · Temporary Session
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Lorry <span className="font-mono font-semibold text-slate-800">{lorry.registrationNumber}</span> · Reporting Month:{' '}
            <span className="font-semibold text-slate-800">{monthLabel}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5">
            <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <select
              aria-label="Reporting month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="min-h-[36px] bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Reporting year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="min-h-[36px] bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {['2025', '2026', '2027'].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Total Repair Costs
          </p>
          <p className="mt-1.5 text-lg font-bold text-slate-900 sm:text-xl">
            {formatINR(summary.totalRepairCost)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Service: {formatINR(summary.serviceCost)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Reported Problems
          </p>
          <p className="mt-1.5 text-lg font-bold text-slate-900 sm:text-xl">
            {summary.reportedProblemsCount}
          </p>
          <p className="mt-1 text-[11px] font-medium text-amber-700">
            {summary.pendingProblemsCount > 0
              ? `${summary.pendingProblemsCount} pending / in progress`
              : 'All resolved'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Driver Payments
          </p>
          <p className="mt-1.5 text-lg font-bold text-emerald-700 sm:text-xl">
            {formatINR(summary.driverPaymentsPaid)}
          </p>
          <p className="mt-1 text-[11px] font-medium text-red-600">
            Pending: {formatINR(summary.driverPaymentsPending)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Load &amp; Unloading
          </p>
          <p className="mt-1.5 text-lg font-bold text-slate-900 sm:text-xl">
            {formatINR(summary.loadingUnloadingCost)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Handling &amp; labour</p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Other Expenses
          </p>
          <p className="mt-1.5 text-lg font-bold text-slate-900 sm:text-xl">
            {formatINR(summary.otherExpensesCost)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Tolls, parking &amp; misc</p>
        </div>
      </div>

      {/* Monthly Expense Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Monthly Expense Breakdown ({monthLabel})
            </h2>
            <p className="text-xs text-slate-500">
              Maintenance, driver paid, handling &amp; other lorry costs (excludes diesel — see Cost Reports for consolidated total)
            </p>
          </div>
          <span className="text-base font-bold text-[#0b1329]">
            {formatINR(breakdownItems.total)}
          </span>
        </div>

        {breakdownItems.total > 0 ? (
          <div className="mt-4 space-y-3">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              {breakdownItems.items
                .filter((i) => i.amount > 0)
                .map((item) => (
                  <div
                    key={item.label}
                    style={{ width: `${(item.amount / breakdownItems.total) * 100}%` }}
                    className={`${item.color} transition-all`}
                    title={`${item.label}: ${formatINR(item.amount)}`}
                  />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {breakdownItems.items.map((item) => {
                const pct =
                  breakdownItems.total > 0
                    ? Math.round((item.amount / breakdownItems.total) * 100)
                    : 0;
                return (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${item.dot}`} />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-slate-600">{item.label}</p>
                      <p className="text-xs font-bold text-slate-900">
                        {formatINR(item.amount)} <span className="font-normal text-slate-500">({pct}%)</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
            No maintenance or operating costs recorded for {lorry.registrationNumber} in {monthLabel}.
          </p>
        )}
      </div>

      {/* 6 Section Navigation Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">
          Manage Maintenance &amp; Costs
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_CARDS.map(({ key, label, description, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onOpenSection(key)}
              className="group flex w-full min-h-[84px] items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#0b1329] text-white transition-colors group-hover:bg-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-slate-900 sm:text-base">
                      {label}
                    </span>
                    {key === 'problems' && summary.pendingProblemsCount > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {summary.pendingProblemsCount} Open
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-blue-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
