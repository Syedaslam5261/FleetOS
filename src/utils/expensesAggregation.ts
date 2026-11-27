import { FuelReceiptService } from '../services/fuelReceiptService';
import { MaintenanceService } from '../services/maintenanceService';
import { getWeekBounds } from './tripDieselAnalytics';

const round2 = (n: number) => Math.round(n * 100) / 100;

export type ExpenseSourceModule = 'Diesel Management' | 'Maintenance Management';
export type ExpenseSourceType =
  | 'DIESEL'
  | 'REPAIR'
  | 'SERVICE'
  | 'DRIVER_PAYMENT'
  | 'HANDLING'
  | 'OTHER_EXPENSE';

export type ExpenseReportPeriod = 'trip' | 'weekly' | 'monthly' | 'yearly';

export interface AggregatedExpenseItem {
  id: string;
  uniqueKey: string;
  lorryId: string;
  date: string; // YYYY-MM-DD
  tripId?: string; // undefined when unassigned — never guessed
  category: string;
  description: string;
  sourceModule: ExpenseSourceModule;
  sourceType: ExpenseSourceType;
  /** Route to open the original source module screen for this lorry */
  sourceRoute: string;
  amount: number;
  paidAmount: number;
  unpaidAmount: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  statusLabel: string;
  details: Record<string, string>;
}

export interface LorryExpenseSummary {
  totalRecorded: number;
  dieselExpenses: number;
  maintenanceAndRepair: number;
  repairSubtotal: number;
  serviceSubtotal: number;
  driverPayments: number;
  driverPaid: number;
  driverPending: number;
  otherOperating: number;
  handlingSubtotal: number;
  otherSubtotal: number;
  totalPaid: number;
  totalUnpaid: number;
  count: number;
}

/**
 * Collects all saved expense records for a single `lorryId` strictly from existing
 * Diesel Management (`FuelReceiptService`) and Maintenance Management (`MaintenanceService`).
 *
 * Guarantees:
 * - Strict `lorryId` isolation (never mixes lorries).
 * - Deduplicates by `${sourceType}:${id}` (never double-counts).
 * - Excludes Fuel Calculator estimates.
 * - Preserves unassigned `tripId` as `undefined` (never guesses trips).
 */
export function getLorryExpenseItems(lorryId: string): AggregatedExpenseItem[] {
  const items: AggregatedExpenseItem[] = [];
  const seen = new Set<string>();

  const pushUnique = (item: AggregatedExpenseItem) => {
    if (item.lorryId !== lorryId) return;
    if (seen.has(item.uniqueKey)) return;
    seen.add(item.uniqueKey);
    items.push(item);
  };

  // 1. Diesel Management — Purchased Fuel Receipts only
  for (const r of FuelReceiptService.getByLorryId(lorryId)) {
    const isPaid = r.paymentStatus === 'PAID';
    pushUnique({
      id: r.id,
      uniqueKey: `DIESEL:${r.id}`,
      lorryId: r.lorryId,
      date: r.receiptDate,
      tripId: r.tripId || undefined,
      category: 'Diesel Purchase',
      description: `${r.fuelStation} · ${r.dieselLitres} L @ ₹${r.pricePerLitre.toFixed(2)}/L (${r.receiptNumber})`,
      sourceModule: 'Diesel Management',
      sourceType: 'DIESEL',
      sourceRoute: `/fleet/${lorryId}/diesel/receipts`,
      amount: round2(r.totalAmount),
      paidAmount: isPaid ? round2(r.totalAmount) : 0,
      unpaidAmount: isPaid ? 0 : round2(r.totalAmount),
      paymentStatus: isPaid ? 'PAID' : 'UNPAID',
      statusLabel: r.paymentStatus,
      details: {
        'Source Module': 'Diesel Management → Fuel Receipts',
        'Receipt ID': r.id,
        'Receipt No.': r.receiptNumber,
        'Fuel Station': r.fuelStation,
        Date: r.receiptDate,
        'Diesel Quantity': `${r.dieselLitres} L`,
        'Price / Litre': `₹${r.pricePerLitre.toFixed(2)}`,
        'Total Amount': `₹${r.totalAmount.toLocaleString('en-IN')}`,
        'Payment Method': r.paymentMethod || 'Not specified',
        'Payment Status': r.paymentStatus,
        'Linked Trip': r.tripId || 'Unassigned',
      },
    });
  }

  // 2. Maintenance Management — Problems & Repairs
  for (const p of MaintenanceService.getProblems(lorryId)) {
    const amt = p.repairCost !== null ? round2(p.repairCost) : 0;
    const isPaid = p.paymentStatus === 'PAID';
    pushUnique({
      id: p.id,
      uniqueKey: `REPAIR:${p.id}`,
      lorryId: p.lorryId,
      date: p.date,
      tripId: p.tripId || undefined,
      category: `Repair · ${p.problemType}`,
      description: `${p.description}${p.workshopName ? ` (${p.workshopName})` : ''}`,
      sourceModule: 'Maintenance Management',
      sourceType: 'REPAIR',
      sourceRoute: `/fleet/${lorryId}/maintenance/problems`,
      amount: amt,
      paidAmount: isPaid ? amt : 0,
      unpaidAmount: isPaid ? 0 : amt,
      paymentStatus: isPaid ? 'PAID' : 'UNPAID',
      statusLabel: p.repairCost === null ? `${p.status} · Cost TBD` : `${p.status} · ${p.paymentStatus}`,
      details: {
        'Source Module': 'Maintenance Management → Problems & Repairs',
        'Record ID': p.id,
        'Problem Type': p.problemType,
        Description: p.description,
        Date: p.date,
        Location: p.location,
        Workshop: p.workshopName || 'Not specified',
        'Repair Status': p.status,
        'Repair Cost': p.repairCost !== null ? `₹${p.repairCost.toLocaleString('en-IN')}` : 'Pending / Unknown',
        'Payment Status': p.paymentStatus,
        'Linked Trip': p.tripId || 'Unassigned',
      },
    });
  }

  // 3. Maintenance Management — Service & Parts
  for (const s of MaintenanceService.getServices(lorryId)) {
    const isPaid = s.paymentStatus === 'PAID';
    pushUnique({
      id: s.id,
      uniqueKey: `SERVICE:${s.id}`,
      lorryId: s.lorryId,
      date: s.date,
      tripId: s.tripId || undefined,
      category: 'Service & Parts',
      description: `${s.serviceType} · ${s.serviceCentre}${s.partsReplaced.length ? ` (${s.partsReplaced.join(', ')})` : ''}`,
      sourceModule: 'Maintenance Management',
      sourceType: 'SERVICE',
      sourceRoute: `/fleet/${lorryId}/maintenance/service`,
      amount: round2(s.totalAmount),
      paidAmount: isPaid ? round2(s.totalAmount) : 0,
      unpaidAmount: isPaid ? 0 : round2(s.totalAmount),
      paymentStatus: isPaid ? 'PAID' : 'UNPAID',
      statusLabel: s.paymentStatus,
      details: {
        'Source Module': 'Maintenance Management → Service & Parts',
        'Record ID': s.id,
        'Service Type': s.serviceType,
        'Service Centre': s.serviceCentre,
        Date: s.date,
        Odometer: `${s.odometerKm.toLocaleString('en-IN')} km`,
        'Parts Replaced': s.partsReplaced.join(', ') || 'None',
        'Labour Charges': `₹${s.labourCharges.toLocaleString('en-IN')}`,
        'Total Amount': `₹${s.totalAmount.toLocaleString('en-IN')}`,
        'Payment Status': s.paymentStatus,
        'Linked Trip': s.tripId || 'Unassigned',
      },
    });
  }

  // 4. Maintenance Management — Driver Payments (Salary, Bata, Advances & Deductions)
  for (const d of MaintenanceService.getDriverPayments(lorryId)) {
    const netAmount = round2(d.amountPaid + d.remainingPayable);
    const payStatus: 'PAID' | 'UNPAID' | 'PARTIAL' =
      d.remainingPayable <= 0 ? 'PAID' : d.amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
    pushUnique({
      id: d.id,
      uniqueKey: `DRIVER_PAYMENT:${d.id}`,
      lorryId: d.lorryId,
      date: d.date,
      tripId: d.tripId || undefined,
      category: 'Driver Payment',
      description: `${d.driverName} · Paid ₹${d.amountPaid.toLocaleString('en-IN')}${d.remainingPayable > 0 ? ` · Pending ₹${d.remainingPayable.toLocaleString('en-IN')}` : ''}`,
      sourceModule: 'Maintenance Management',
      sourceType: 'DRIVER_PAYMENT',
      sourceRoute: `/fleet/${lorryId}/maintenance/driver-payments`,
      amount: netAmount,
      paidAmount: round2(d.amountPaid),
      unpaidAmount: round2(d.remainingPayable),
      paymentStatus: payStatus,
      statusLabel: payStatus === 'PARTIAL' ? 'PARTIAL / PENDING' : payStatus,
      details: {
        'Source Module': 'Maintenance Management → Driver Payments',
        'Record ID': d.id,
        Driver: d.driverName,
        Date: d.date,
        'Monthly Salary': `₹${d.monthlySalary.toLocaleString('en-IN')}`,
        'Trip Allowance (Bata)': `₹${d.tripAllowance.toLocaleString('en-IN')}`,
        'Food Allowance': `₹${d.foodAllowance.toLocaleString('en-IN')}`,
        'Other Earnings': `₹${d.otherEarnings.toLocaleString('en-IN')}`,
        'Total Earnings': `₹${d.totalEarnings.toLocaleString('en-IN')}`,
        'Advance Given': `₹${d.advanceGiven.toLocaleString('en-IN')}`,
        'Other Deductions': `₹${d.otherDeductions.toLocaleString('en-IN')}`,
        'Amount Paid': `₹${d.amountPaid.toLocaleString('en-IN')}`,
        'Remaining Payable': `₹${d.remainingPayable.toLocaleString('en-IN')}`,
        'Payment Method': d.paymentMethod,
        'Linked Trip': d.tripId || 'Unassigned',
      },
    });
  }

  // 5. Maintenance Management — Loading & Unloading Expenses
  for (const h of MaintenanceService.getHandlingCharges(lorryId)) {
    const isPaid = h.paymentStatus === 'PAID';
    pushUnique({
      id: h.id,
      uniqueKey: `HANDLING:${h.id}`,
      lorryId: h.lorryId,
      date: h.date,
      tripId: h.tripId || undefined,
      category: `${h.chargeType} Charges`,
      description: `${h.location} · Labour ₹${h.labourCharges.toLocaleString('en-IN')}`,
      sourceModule: 'Maintenance Management',
      sourceType: 'HANDLING',
      sourceRoute: `/fleet/${lorryId}/maintenance/load-handling`,
      amount: round2(h.amount),
      paidAmount: isPaid ? round2(h.amount) : 0,
      unpaidAmount: isPaid ? 0 : round2(h.amount),
      paymentStatus: isPaid ? 'PAID' : 'UNPAID',
      statusLabel: h.paymentStatus,
      details: {
        'Source Module': 'Maintenance Management → Load & Handling',
        'Record ID': h.id,
        Type: `${h.chargeType} Charges`,
        Date: h.date,
        Location: h.location,
        'Labour Charges': `₹${h.labourCharges.toLocaleString('en-IN')}`,
        'Total Amount': `₹${h.amount.toLocaleString('en-IN')}`,
        'Payment Status': h.paymentStatus,
        'Linked Trip': h.tripId || 'Unassigned',
      },
    });
  }

  // 6. Maintenance Management — Other Lorry Expenses
  for (const o of MaintenanceService.getOtherExpenses(lorryId)) {
    const isPaid = o.paymentStatus === 'PAID';
    pushUnique({
      id: o.id,
      uniqueKey: `OTHER_EXPENSE:${o.id}`,
      lorryId: o.lorryId,
      date: o.date,
      tripId: o.tripId || undefined,
      category: o.expenseCategory,
      description: `${o.location} · ${o.description}`,
      sourceModule: 'Maintenance Management',
      sourceType: 'OTHER_EXPENSE',
      sourceRoute: `/fleet/${lorryId}/maintenance/other-expenses`,
      amount: round2(o.amount),
      paidAmount: isPaid ? round2(o.amount) : 0,
      unpaidAmount: isPaid ? 0 : round2(o.amount),
      paymentStatus: isPaid ? 'PAID' : 'UNPAID',
      statusLabel: o.paymentStatus,
      details: {
        'Source Module': 'Maintenance Management → Other Lorry Expenses',
        'Record ID': o.id,
        Category: o.expenseCategory,
        Date: o.date,
        Location: o.location,
        Description: o.description,
        Amount: `₹${o.amount.toLocaleString('en-IN')}`,
        'Payment Status': o.paymentStatus,
        'Linked Trip': o.tripId || 'Unassigned',
      },
    });
  }

  return items.sort((a, b) => b.date.localeCompare(a.date) || a.uniqueKey.localeCompare(b.uniqueKey));
}

export function summarizeExpenseItems(items: AggregatedExpenseItem[]): LorryExpenseSummary {
  const sumType = (type: ExpenseSourceType) =>
    round2(items.filter((i) => i.sourceType === type).reduce((s, i) => s + i.amount, 0));

  const dieselExpenses = sumType('DIESEL');
  const repairSubtotal = sumType('REPAIR');
  const serviceSubtotal = sumType('SERVICE');
  const maintenanceAndRepair = round2(repairSubtotal + serviceSubtotal);

  const driverItems = items.filter((i) => i.sourceType === 'DRIVER_PAYMENT');
  const driverPayments = round2(driverItems.reduce((s, i) => s + i.amount, 0));
  const driverPaid = round2(driverItems.reduce((s, i) => s + i.paidAmount, 0));
  const driverPending = round2(driverItems.reduce((s, i) => s + i.unpaidAmount, 0));

  const handlingSubtotal = sumType('HANDLING');
  const otherSubtotal = sumType('OTHER_EXPENSE');
  const otherOperating = round2(handlingSubtotal + otherSubtotal);

  const totalRecorded = round2(
    dieselExpenses + maintenanceAndRepair + driverPayments + otherOperating
  );
  const totalPaid = round2(items.reduce((s, i) => s + i.paidAmount, 0));
  const totalUnpaid = round2(items.reduce((s, i) => s + i.unpaidAmount, 0));

  return {
    totalRecorded,
    dieselExpenses,
    maintenanceAndRepair,
    repairSubtotal,
    serviceSubtotal,
    driverPayments,
    driverPaid,
    driverPending,
    otherOperating,
    handlingSubtotal,
    otherSubtotal,
    totalPaid,
    totalUnpaid,
    count: items.length,
  };
}

export function filterExpenseItems(
  items: AggregatedExpenseItem[],
  mode: ExpenseReportPeriod,
  selection: {
    tripId: string;
    weekAnchor: string;
    month: string; // YYYY-MM
    year: string; // YYYY
  }
): AggregatedExpenseItem[] {
  if (mode === 'trip') {
    if (!selection.tripId) return [];
    return items.filter((i) => i.tripId === selection.tripId);
  }
  if (mode === 'weekly') {
    const { start, end } = getWeekBounds(selection.weekAnchor);
    return items.filter((i) => i.date >= start && i.date <= end);
  }
  if (mode === 'monthly') {
    return items.filter((i) => i.date.startsWith(selection.month));
  }
  return items.filter((i) => i.date.startsWith(selection.year));
}
