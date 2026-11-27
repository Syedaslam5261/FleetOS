import { FleetTripRecord, FuelReceiptRecord } from '../types/fuelReceipt';
import { getWeekBounds } from './tripDieselAnalytics';

export type PurchaseReportFilter = 'trip' | 'weekly' | 'monthly' | 'yearly';

export interface PurchaseSummaryTotals {
  tripsCount: number;
  purchaseEntries: number;
  totalLitres: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  paidCount: number;
  unpaidCount: number;
}

export interface TripWithPurchases {
  trip: FleetTripRecord;
  purchases: FuelReceiptRecord[];
  totalLitres: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  flaggedTimelineCount: number;
}

export interface GroupedTripsBucket {
  key: string;
  label: string;
  trips: TripWithPurchases[];
  purchaseEntries: number;
  totalLitres: number;
  totalAmount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Returns true if a linked receipt's date falls outside its trip's [startDate, completionDate]. */
export function isReceiptOutsideTripTimeline(
  receipt: FuelReceiptRecord,
  trip: FleetTripRecord
): boolean {
  return receipt.receiptDate < trip.startDate || receipt.receiptDate > trip.completionDate;
}

export function summarizePurchases(
  receipts: FuelReceiptRecord[],
  tripsCount: number
): PurchaseSummaryTotals {
  // Deduplicate by receipt ID defensively so a receipt can never be counted twice
  const seen = new Set<string>();
  let totalLitres = 0;
  let totalAmount = 0;
  let paidAmount = 0;
  let unpaidAmount = 0;
  let paidCount = 0;
  let unpaidCount = 0;

  for (const r of receipts) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    totalLitres += r.dieselLitres;
    totalAmount += r.totalAmount;
    if (r.paymentStatus === 'PAID') {
      paidAmount += r.totalAmount;
      paidCount++;
    } else {
      unpaidAmount += r.totalAmount;
      unpaidCount++;
    }
  }

  return {
    tripsCount,
    purchaseEntries: seen.size,
    totalLitres: round2(totalLitres),
    totalAmount: round2(totalAmount),
    paidAmount: round2(paidAmount),
    unpaidAmount: round2(unpaidAmount),
    paidCount,
    unpaidCount,
  };
}

export function attachPurchasesToTrips(
  trips: FleetTripRecord[],
  receipts: FuelReceiptRecord[]
): TripWithPurchases[] {
  return trips.map((trip) => {
    const purchases = receipts.filter((r) => r.tripId === trip.id);
    const totals = summarizePurchases(purchases, 1);
    const flaggedTimelineCount = purchases.filter((r) => isReceiptOutsideTripTimeline(r, trip)).length;
    return {
      trip,
      purchases,
      totalLitres: totals.totalLitres,
      totalAmount: totals.totalAmount,
      paidAmount: totals.paidAmount,
      unpaidAmount: totals.unpaidAmount,
      flaggedTimelineCount,
    };
  });
}

/** Filter trips overlapping [start, end] inclusive. */
export function filterTripsInRange(
  trips: FleetTripRecord[],
  start: string,
  end: string
): FleetTripRecord[] {
  return trips.filter((t) => t.startDate <= end && t.completionDate >= start);
}

export function buildWeeklyTripReport(
  lorryTrips: FleetTripRecord[],
  lorryReceipts: FuelReceiptRecord[],
  weekAnchor: string
) {
  const { start, end } = getWeekBounds(weekAnchor);
  const tripsInWeek = filterTripsInRange(lorryTrips, start, end);
  const tripIds = new Set(tripsInWeek.map((t) => t.id));

  // Linked receipts belonging to trips in this week
  const linkedReceipts = lorryReceipts.filter((r) => r.tripId && tripIds.has(r.tripId));
  // Unassigned receipts occurring during this week
  const unassignedReceipts = lorryReceipts.filter(
    (r) => !r.tripId && r.receiptDate >= start && r.receiptDate <= end
  );

  const tripsWithPurchases = attachPurchasesToTrips(tripsInWeek, linkedReceipts);
  const summary = summarizePurchases([...linkedReceipts, ...unassignedReceipts], tripsInWeek.length);

  return { start, end, tripsWithPurchases, unassignedReceipts, summary };
}

export function buildMonthlyTripReport(
  lorryTrips: FleetTripRecord[],
  lorryReceipts: FuelReceiptRecord[],
  monthStr: string // YYYY-MM
) {
  const [y, m] = monthStr.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const start = `${monthStr}-01`;
  const end = `${monthStr}-${String(lastDay).padStart(2, '0')}`;

  const tripsInMonth = filterTripsInRange(lorryTrips, start, end);
  const tripIds = new Set(tripsInMonth.map((t) => t.id));
  const linkedReceipts = lorryReceipts.filter((r) => r.tripId && tripIds.has(r.tripId));
  const unassignedReceipts = lorryReceipts.filter(
    (r) => !r.tripId && r.receiptDate >= start && r.receiptDate <= end
  );

  const tripsWithPurchases = attachPurchasesToTrips(tripsInMonth, linkedReceipts);

  // Group trips by their Monday week start
  const weekMap = new Map<string, TripWithPurchases[]>();
  for (const item of tripsWithPurchases) {
    const wb = getWeekBounds(item.trip.startDate);
    const key = `${wb.start}|${wb.end}`;
    weekMap.set(key, [...(weekMap.get(key) ?? []), item]);
  }

  const weekGroups: GroupedTripsBucket[] = [...weekMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const [ws, we] = key.split('|');
      const allRecs = items.flatMap((i) => i.purchases);
      const totals = summarizePurchases(allRecs, items.length);
      return {
        key,
        label: `Week of ${ws} to ${we}`,
        trips: items,
        purchaseEntries: totals.purchaseEntries,
        totalLitres: totals.totalLitres,
        totalAmount: totals.totalAmount,
      };
    });

  const summary = summarizePurchases([...linkedReceipts, ...unassignedReceipts], tripsInMonth.length);
  return { weekGroups, unassignedReceipts, summary };
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function buildYearlyTripReport(
  lorryTrips: FleetTripRecord[],
  lorryReceipts: FuelReceiptRecord[],
  yearStr: string // YYYY
) {
  const start = `${yearStr}-01-01`;
  const end = `${yearStr}-12-31`;

  const tripsInYear = filterTripsInRange(lorryTrips, start, end);
  const tripIds = new Set(tripsInYear.map((t) => t.id));
  const linkedReceipts = lorryReceipts.filter((r) => r.tripId && tripIds.has(r.tripId));
  const unassignedReceipts = lorryReceipts.filter(
    (r) => !r.tripId && r.receiptDate >= start && r.receiptDate <= end
  );

  const tripsWithPurchases = attachPurchasesToTrips(tripsInYear, linkedReceipts);

  // Group trips by month (YYYY-MM)
  const monthMap = new Map<string, TripWithPurchases[]>();
  for (const item of tripsWithPurchases) {
    const ym = item.trip.startDate.slice(0, 7);
    monthMap.set(ym, [...(monthMap.get(ym) ?? []), item]);
  }

  const monthGroups: GroupedTripsBucket[] = [...monthMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([ym, items]) => {
      const [yr, mo] = ym.split('-');
      const monthName = MONTH_LABELS[Number(mo) - 1] ?? mo;
      const allRecs = items.flatMap((i) => i.purchases);
      const totals = summarizePurchases(allRecs, items.length);
      return {
        key: ym,
        label: `${monthName} ${yr}`,
        trips: items,
        purchaseEntries: totals.purchaseEntries,
        totalLitres: totals.totalLitres,
        totalAmount: totals.totalAmount,
      };
    });

  const summary = summarizePurchases([...linkedReceipts, ...unassignedReceipts], tripsInYear.length);
  return { monthGroups, unassignedReceipts, summary };
}
