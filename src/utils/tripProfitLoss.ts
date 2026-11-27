import { FleetTripRecord } from '../types/fuelReceipt';
import { LorryInvoice } from '../types/lorryRecords';
import { TripService } from '../services/tripService';
import { LorryRecordsService } from '../services/lorryRecordsService';
import { FuelReceiptService } from '../services/fuelReceiptService';
import {
  AggregatedExpenseItem,
  getLorryExpenseItems,
} from './expensesAggregation';
import { getWeekBounds } from './tripDieselAnalytics';

const round2 = (n: number) => Math.round(n * 100) / 100;

export type FinancialPeriodMode = 'weekly' | 'monthly' | 'yearly';

export interface TripDieselPurchaseDetail {
  id: string;
  receiptNumber: string;
  date: string;
  fuelStation: string;
  litres: number;
  pricePerLitre: number;
  amount: number;
  paymentStatus: 'PAID' | 'UNPAID';
  sourceRoute: string;
}

export interface TripExpenseCategoryTotals {
  diesel: number;
  repairs: number;
  serviceAndParts: number;
  driverPayments: number;
  loadingUnloading: number;
  tollsAndParking: number;
  otherExpenses: number;
}

export interface TripFinancialStatement {
  trip: FleetTripRecord;
  lorryId: string;
  // Revenue (Earned vs Cash Received kept strictly separate)
  invoices: LorryInvoice[];
  freightAmount: number;
  additionalCharges: number;
  totalRevenue: number;
  customerReceived: number;
  customerPending: number;
  // Expenses (Incurred vs Paid kept strictly separate)
  expenses: AggregatedExpenseItem[];
  dieselPurchases: TripDieselPurchaseDetail[];
  categoryTotals: TripExpenseCategoryTotals;
  totalExpenses: number;
  expensesPaid: number;
  expensesPending: number;
  // Profit & Loss (Revenue Earned - Expenses Incurred)
  netProfit: number;
  profitMarginPct: number | null;
  status: 'PROFIT' | 'LOSS' | 'INCOMPLETE';
  hasRevenue: boolean;
  hasExpenses: boolean;
  missingDataNotes: string[];
}

export interface LorryPeriodFinancialReport {
  lorryId: string;
  mode: FinancialPeriodMode;
  periodLabel: string;
  trips: TripFinancialStatement[];
  totalTrips: number;
  completeTripsCount: number;
  incompleteTripsCount: number;
  // Aggregated Revenue & Cash
  totalRevenue: number;
  customerReceived: number;
  customerPending: number;
  // Aggregated Expenses
  tripExpensesTotal: number;
  unassignedExpenses: AggregatedExpenseItem[];
  unassignedExpensesTotal: number;
  totalExpenses: number;
  expensesPaid: number;
  expensesPending: number;
  // P&L
  netProfit: number;
  profitMarginPct: number | null;
  mostProfitableTrip: TripFinancialStatement | null;
  lossMakingTrips: TripFinancialStatement[];
  categoryBreakdown: { label: string; amount: number; color: string }[];
  chartData: { name: string; tripId: string; revenue: number; expenses: number; profit: number }[];
}

function getUniqueTripInvoices(lorryId: string, tripId: string): LorryInvoice[] {
  const seen = new Set<string>();
  const result: LorryInvoice[] = [];
  for (const inv of LorryRecordsService.getInvoices(lorryId)) {
    if (inv.lorryId !== lorryId || inv.tripRef !== tripId) continue;
    const dedupeKey = `${inv.id}|${inv.invoiceNo}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    result.push(inv);
  }
  return result;
}

function invoiceCashReceived(inv: LorryInvoice): number {
  const total = round2(inv.amount + (inv.additionalCharges ?? 0));
  if (inv.status === 'Paid') return total;
  if (typeof inv.amountReceived === 'number' && Number.isFinite(inv.amountReceived) && inv.amountReceived > 0) {
    return round2(Math.min(total, inv.amountReceived));
  }
  return 0;
}

/**
 * Builds an accurate, read-only financial statement for a single trip.
 * - Never counts the same invoice or expense twice.
 * - Never auto-assigns unlinked expenses to a trip.
 * - Keeps Revenue Earned, Cash Received, Expenses Incurred, and Expenses Paid strictly separate.
 */
export function buildTripFinancialStatement(
  lorryId: string,
  trip: FleetTripRecord,
  preloadedExpenses?: AggregatedExpenseItem[]
): TripFinancialStatement {
  const allLorryExpenses = preloadedExpenses ?? getLorryExpenseItems(lorryId);
  const tripExpenses = allLorryExpenses.filter(
    (e) => e.lorryId === lorryId && e.tripId === trip.id
  );

  // Deduplicated invoices for this trip
  const invoices = getUniqueTripInvoices(lorryId, trip.id);
  const freightAmount = round2(invoices.reduce((s, i) => s + i.amount, 0));
  const additionalCharges = round2(invoices.reduce((s, i) => s + (i.additionalCharges ?? 0), 0));
  const totalRevenue = round2(freightAmount + additionalCharges);
  const customerReceived = round2(invoices.reduce((s, i) => s + invoiceCashReceived(i), 0));
  const customerPending = round2(Math.max(0, totalRevenue - customerReceived));

  // Individual diesel purchases linked strictly to this trip
  const dieselReceipts = FuelReceiptService.getByLorryId(lorryId).filter(
    (r) => r.tripId === trip.id
  );
  const seenDiesel = new Set<string>();
  const dieselPurchases: TripDieselPurchaseDetail[] = [];
  for (const r of dieselReceipts) {
    if (seenDiesel.has(r.id)) continue;
    seenDiesel.add(r.id);
    dieselPurchases.push({
      id: r.id,
      receiptNumber: r.receiptNumber,
      date: r.receiptDate,
      fuelStation: r.fuelStation,
      litres: r.dieselLitres,
      pricePerLitre: r.pricePerLitre,
      amount: round2(r.totalAmount),
      paymentStatus: r.paymentStatus,
      sourceRoute: `/fleet/${lorryId}/diesel/receipts`,
    });
  }

  // Category-wise expense totals (each unique expense counted in exactly one bucket)
  const categoryTotals: TripExpenseCategoryTotals = {
    diesel: 0,
    repairs: 0,
    serviceAndParts: 0,
    driverPayments: 0,
    loadingUnloading: 0,
    tollsAndParking: 0,
    otherExpenses: 0,
  };

  for (const e of tripExpenses) {
    if (e.sourceType === 'DIESEL') categoryTotals.diesel = round2(categoryTotals.diesel + e.amount);
    else if (e.sourceType === 'REPAIR') categoryTotals.repairs = round2(categoryTotals.repairs + e.amount);
    else if (e.sourceType === 'SERVICE') categoryTotals.serviceAndParts = round2(categoryTotals.serviceAndParts + e.amount);
    else if (e.sourceType === 'DRIVER_PAYMENT') categoryTotals.driverPayments = round2(categoryTotals.driverPayments + e.amount);
    else if (e.sourceType === 'HANDLING') categoryTotals.loadingUnloading = round2(categoryTotals.loadingUnloading + e.amount);
    else if (
      e.sourceType === 'OTHER_EXPENSE' &&
      (e.category === 'Toll charges' || e.category === 'Parking')
    ) {
      categoryTotals.tollsAndParking = round2(categoryTotals.tollsAndParking + e.amount);
    } else {
      categoryTotals.otherExpenses = round2(categoryTotals.otherExpenses + e.amount);
    }
  }

  const totalExpenses = round2(
    categoryTotals.diesel +
      categoryTotals.repairs +
      categoryTotals.serviceAndParts +
      categoryTotals.driverPayments +
      categoryTotals.loadingUnloading +
      categoryTotals.tollsAndParking +
      categoryTotals.otherExpenses
  );
  const expensesPaid = round2(tripExpenses.reduce((s, e) => s + e.paidAmount, 0));
  const expensesPending = round2(tripExpenses.reduce((s, e) => s + e.unpaidAmount, 0));

  const hasRevenue = invoices.length > 0 && totalRevenue > 0;
  const hasExpenses = tripExpenses.length > 0;
  const missingDataNotes: string[] = [];
  if (!hasRevenue) missingDataNotes.push('Freight invoice / revenue not yet recorded for this trip.');
  if (!hasExpenses) missingDataNotes.push('No Diesel or Maintenance expenses linked to this trip yet.');

  const netProfit = round2(totalRevenue - totalExpenses);
  const profitMarginPct = totalRevenue > 0 ? round2((netProfit / totalRevenue) * 100) : null;
  const status: 'PROFIT' | 'LOSS' | 'INCOMPLETE' = !hasRevenue
    ? 'INCOMPLETE'
    : netProfit >= 0
      ? 'PROFIT'
      : 'LOSS';

  return {
    trip,
    lorryId,
    invoices,
    freightAmount,
    additionalCharges,
    totalRevenue,
    customerReceived,
    customerPending,
    expenses: tripExpenses,
    dieselPurchases,
    categoryTotals,
    totalExpenses,
    expensesPaid,
    expensesPending,
    netProfit,
    profitMarginPct,
    status,
    hasRevenue,
    hasExpenses,
    missingDataNotes,
  };
}

export function getAllTripStatementsForLorry(lorryId: string): TripFinancialStatement[] {
  const trips = TripService.getByLorryId(lorryId);
  const allExpenses = getLorryExpenseItems(lorryId);
  return trips.map((trip) => buildTripFinancialStatement(lorryId, trip, allExpenses));
}

/**
 * Aggregates underlying trip financial statements for Weekly, Monthly, or Yearly periods.
 * Unassigned expenses (without a Trip ID) are tracked separately and never forced into trips.
 */
export function buildLorryPeriodFinancialReport(
  lorryId: string,
  mode: FinancialPeriodMode,
  selection: {
    weekAnchor: string; // YYYY-MM-DD
    month: string; // YYYY-MM
    year: string; // YYYY
  }
): LorryPeriodFinancialReport {
  const matchesDate = (isoDate: string): boolean => {
    if (mode === 'weekly') {
      const { start, end } = getWeekBounds(selection.weekAnchor);
      return isoDate >= start && isoDate <= end;
    }
    if (mode === 'monthly') return isoDate.startsWith(selection.month);
    return isoDate.startsWith(selection.year);
  };

  const periodLabel =
    mode === 'weekly'
      ? `${getWeekBounds(selection.weekAnchor).start} to ${getWeekBounds(selection.weekAnchor).end}`
      : mode === 'monthly'
        ? selection.month
        : `Year ${selection.year}`;

  const allExpenses = getLorryExpenseItems(lorryId);
  const allTrips = TripService.getByLorryId(lorryId);
  const periodTrips = allTrips.filter((t) => matchesDate(t.startDate));
  const statements = periodTrips.map((t) =>
    buildTripFinancialStatement(lorryId, t, allExpenses)
  );

  // Unassigned lorry expenses in the same period (never guessed into trips)
  const unassignedExpenses = allExpenses.filter(
    (e) => !e.tripId && matchesDate(e.date)
  );
  const unassignedExpensesTotal = round2(
    unassignedExpenses.reduce((s, e) => s + e.amount, 0)
  );

  const totalRevenue = round2(statements.reduce((s, t) => s + t.totalRevenue, 0));
  const customerReceived = round2(statements.reduce((s, t) => s + t.customerReceived, 0));
  const customerPending = round2(statements.reduce((s, t) => s + t.customerPending, 0));
  const tripExpensesTotal = round2(statements.reduce((s, t) => s + t.totalExpenses, 0));
  const totalExpenses = round2(tripExpensesTotal + unassignedExpensesTotal);

  const tripPaid = statements.reduce((s, t) => s + t.expensesPaid, 0);
  const unassignedPaid = unassignedExpenses.reduce((s, e) => s + e.paidAmount, 0);
  const expensesPaid = round2(tripPaid + unassignedPaid);

  const tripPending = statements.reduce((s, t) => s + t.expensesPending, 0);
  const unassignedPending = unassignedExpenses.reduce((s, e) => s + e.unpaidAmount, 0);
  const expensesPending = round2(tripPending + unassignedPending);

  const netProfit = round2(totalRevenue - totalExpenses);
  const profitMarginPct = totalRevenue > 0 ? round2((netProfit / totalRevenue) * 100) : null;

  const completeStatements = statements.filter((s) => s.status !== 'INCOMPLETE');
  const incompleteTripsCount = statements.length - completeStatements.length;

  const mostProfitableTrip =
    completeStatements.length > 0
      ? completeStatements.reduce((best, curr) =>
          curr.netProfit > best.netProfit ? curr : best
        )
      : null;

  const lossMakingTrips = completeStatements.filter((s) => s.netProfit < 0);

  // Category breakdown across period trips + unassigned period expenses
  const cat = {
    diesel: 0,
    repairs: 0,
    service: 0,
    driver: 0,
    handling: 0,
    tollsParking: 0,
    other: 0,
  };
  for (const s of statements) {
    cat.diesel += s.categoryTotals.diesel;
    cat.repairs += s.categoryTotals.repairs;
    cat.service += s.categoryTotals.serviceAndParts;
    cat.driver += s.categoryTotals.driverPayments;
    cat.handling += s.categoryTotals.loadingUnloading;
    cat.tollsParking += s.categoryTotals.tollsAndParking;
    cat.other += s.categoryTotals.otherExpenses;
  }
  for (const u of unassignedExpenses) {
    if (u.sourceType === 'DIESEL') cat.diesel += u.amount;
    else if (u.sourceType === 'REPAIR') cat.repairs += u.amount;
    else if (u.sourceType === 'SERVICE') cat.service += u.amount;
    else if (u.sourceType === 'DRIVER_PAYMENT') cat.driver += u.amount;
    else if (u.sourceType === 'HANDLING') cat.handling += u.amount;
    else if (u.category === 'Toll charges' || u.category === 'Parking') cat.tollsParking += u.amount;
    else cat.other += u.amount;
  }

  const categoryBreakdown = [
    { label: 'Diesel', amount: round2(cat.diesel), color: '#4f46e5' },
    { label: 'Repairs', amount: round2(cat.repairs), color: '#dc2626' },
    { label: 'Service & Parts', amount: round2(cat.service), color: '#2563eb' },
    { label: 'Driver Payments', amount: round2(cat.driver), color: '#059669' },
    { label: 'Loading & Unloading', amount: round2(cat.handling), color: '#d97706' },
    { label: 'Tolls & Parking', amount: round2(cat.tollsParking), color: '#0891b2' },
    { label: 'Other Expenses', amount: round2(cat.other), color: '#64748b' },
  ].filter((c) => c.amount > 0);

  const chartData = [...statements]
    .reverse()
    .map((s) => ({
      name: s.trip.id.replace('TRP-', ''),
      tripId: s.trip.id,
      revenue: s.totalRevenue,
      expenses: s.totalExpenses,
      profit: s.netProfit,
    }));

  return {
    lorryId,
    mode,
    periodLabel,
    trips: statements,
    totalTrips: statements.length,
    completeTripsCount: completeStatements.length,
    incompleteTripsCount,
    totalRevenue,
    customerReceived,
    customerPending,
    tripExpensesTotal,
    unassignedExpenses,
    unassignedExpensesTotal,
    totalExpenses,
    expensesPaid,
    expensesPending,
    netProfit,
    profitMarginPct,
    mostProfitableTrip,
    lossMakingTrips,
    categoryBreakdown,
    chartData,
  };
}
