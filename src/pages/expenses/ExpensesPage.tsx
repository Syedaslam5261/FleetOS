import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Receipt, SearchX, Truck } from 'lucide-react';
import { FleetOSLogo } from '../../components/common/FleetOSBrand';
import { clsx } from 'clsx';
import { LorryService } from '../../services/lorryService';
import { FuelReceiptService } from '../../services/fuelReceiptService';
import { MaintenanceService } from '../../services/maintenanceService';
import { LorryStatus } from '../../types/lorry';
import { getLorryExpenseItems, summarizeExpenseItems } from '../../utils/expensesAggregation';
import { buildTripFinancialStatement } from '../../utils/tripProfitLoss';
import { TripService } from '../../services/tripService';
import { LorryExpenseDashboard } from '../../components/expenses/LorryExpenseDashboard';
import { LorryExpenseReports } from '../../components/expenses/LorryExpenseReports';
import { TripFinancialStatementView } from '../../components/expenses/TripFinancialStatementView';
import { Button } from '../../components/common/Button';
import { formatINR } from '../../utils/formatters';

const STATUS_STYLES: Record<LorryStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Trip': 'bg-blue-50 text-blue-700 border-blue-200',
  Maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
  Available: 'bg-teal-50 text-teal-700 border-teal-200',
  Inactive: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const ExpensesPage: React.FC = () => {
  const { lorryId, tripId } = useParams<{ lorryId?: string; tripId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  const isReportsView = Boolean(lorryId && !tripId && location.pathname.endsWith('/reports'));

  useEffect(() => {
    const u1 = LorryService.subscribe(() => setTick((t) => t + 1));
    const u2 = FuelReceiptService.subscribe(() => setTick((t) => t + 1));
    const u3 = MaintenanceService.subscribe(() => setTick((t) => t + 1));
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const lorries = useMemo(() => LorryService.getAllLorries(), [tick]);
  const selectedLorry = useMemo(
    () => (lorryId ? LorryService.getLorryById(lorryId) : undefined),
    [lorryId, tick]
  );

  const lorryRows = useMemo(
    () =>
      lorries.map((lorry) => {
        const items = getLorryExpenseItems(lorry.id);
        const summary = summarizeExpenseItems(items);
        return { lorry, summary };
      }),
    [lorries, tick]
  );

  const selectedTripStatement = useMemo(() => {
    if (!selectedLorry || !tripId) return null;
    const trip = TripService.getByLorryId(selectedLorry.id).find((t) => t.id === tripId);
    if (!trip) return null;
    return buildTripFinancialStatement(selectedLorry.id, trip);
  }, [selectedLorry, tripId, tick]);

  const backConfig = !lorryId
    ? { label: 'Back to Lorry Management', to: '/fleet' }
    : (isReportsView || tripId) && selectedLorry
      ? { label: `Back to ${selectedLorry.registrationNumber} Financial Dashboard`, to: `/expenses/${selectedLorry.id}` }
      : { label: 'Back to Lorry List', to: '/expenses' };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans">
      {/* Full-Width Top Header — No Sidebar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white">
        <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/fleet')}
              className="flex items-center flex-shrink-0 focus:outline-none"
              title="FleetOS — Lorry Management"
            >
              <FleetOSLogo variant="light" compactOnMobile />
            </button>

            <span className="h-6 w-px bg-slate-200 flex-shrink-0" aria-hidden="true" />
            <span className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {selectedLorry ? (
                <span className="font-mono">{selectedLorry.registrationNumber}</span>
              ) : (
                'Expenses Management'
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(backConfig.to)}
            className="inline-flex min-h-[44px] flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{backConfig.label}</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
      </header>

      <main className="w-full px-4 py-6 sm:px-6 lg:px-8 pb-12">
        {/* Level 1: Main Expenses Page — Clickable Registration-Number Cards */}
        {!lorryId && (
          <div className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <h1 className="text-xl font-bold text-slate-900">Expenses Management</h1>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                    Demo · Temporary Session
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Select a lorry registration number to inspect its consolidated Diesel &amp; Maintenance expenses.
                </p>
              </div>
            </div>

            {lorryRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Truck className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-800">No lorries registered yet</p>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => navigate('/fleet')}
                  className="mt-4 min-h-[44px]"
                >
                  Go to Lorry Management
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {lorryRows.map(({ lorry, summary }) => (
                  <button
                    key={lorry.id}
                    type="button"
                    onClick={() => navigate(`/expenses/${lorry.id}`)}
                    className="group flex w-full flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-base font-bold text-[#0b1329] group-hover:text-blue-700">
                          {lorry.registrationNumber}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {lorry.manufacturer} {lorry.model} · {lorry.vehicleType}
                        </p>
                      </div>
                      <span
                        className={clsx(
                          'flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                          STATUS_STYLES[lorry.status]
                        )}
                      >
                        {lorry.status}
                      </span>
                    </div>

                    <div className="flex items-end justify-between border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Total Recorded Expenses
                        </p>
                        <p className="mt-0.5 font-mono text-lg font-bold text-slate-900">
                          {formatINR(summary.totalRecorded)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {summary.count === 0
                            ? 'No expenses recorded'
                            : `${summary.count} records · Unpaid ${formatINR(summary.totalUnpaid)}`}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lorry Not Found */}
        {lorryId && !selectedLorry && (
          <div className="mx-auto max-w-md py-20 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <SearchX className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Lorry not found</h2>
            <p className="mt-1 text-xs text-slate-500">
              This lorry does not exist or was deleted.
            </p>
            <Button
              className="mt-5 min-h-[44px]"
              variant="primary"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate('/expenses')}
            >
              Back to Lorry List
            </Button>
          </div>
        )}

        {/* Level 2: Individual Lorry Financial Dashboard */}
        {selectedLorry && !isReportsView && !tripId && (
          <LorryExpenseDashboard
            key={selectedLorry.id}
            lorry={selectedLorry}
            onOpenReports={() => navigate(`/expenses/${selectedLorry.id}/reports`)}
            onOpenTrip={(tid) => navigate(`/expenses/${selectedLorry.id}/trips/${tid}`)}
          />
        )}

        {/* Level 3A: Individual Lorry Financial Reports */}
        {selectedLorry && isReportsView && (
          <LorryExpenseReports
            key={selectedLorry.id}
            lorry={selectedLorry}
            onOpenTrip={(tid) => navigate(`/expenses/${selectedLorry.id}/trips/${tid}`)}
          />
        )}

        {/* Level 3B: Individual Trip Financial Statement */}
        {selectedLorry && tripId && (
          selectedTripStatement ? (
            <TripFinancialStatementView
              key={tripId}
              lorry={selectedLorry}
              statement={selectedTripStatement}
            />
          ) : (
            <div className="mx-auto max-w-md py-16 text-center">
              <h2 className="text-lg font-bold text-slate-900">Trip not found</h2>
              <p className="mt-1 text-xs text-slate-500">
                Trip {tripId} does not belong to {selectedLorry.registrationNumber}.
              </p>
              <Button
                className="mt-4 min-h-[44px]"
                variant="primary"
                onClick={() => navigate(`/expenses/${selectedLorry.id}`)}
              >
                Back to Financial Dashboard
              </Button>
            </div>
          )
        )}
      </main>
    </div>
  );
};
