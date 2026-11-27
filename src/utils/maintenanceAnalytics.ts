import {
  ConsolidatedCostEntry,
  CostReportFilter,
} from '../types/maintenance';
import { MaintenanceService } from '../services/maintenanceService';
import { FuelReceiptService } from '../services/fuelReceiptService';
import { getWeekBounds } from './tripDieselAnalytics';

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface MonthlyDashboardSummary {
  totalRepairCost: number;
  reportedProblemsCount: number;
  pendingProblemsCount: number;
  serviceCost: number;
  driverPaymentsPaid: number;
  driverPaymentsPending: number;
  loadingUnloadingCost: number;
  otherExpensesCost: number;
  totalMonthlyMaintenanceAndOps: number;
}

export function getMonthlyMaintenanceSummary(
  lorryId: string,
  monthStr: string // YYYY-MM
): MonthlyDashboardSummary {
  const problems = MaintenanceService.getProblems(lorryId).filter((r) => r.date.startsWith(monthStr));
  const services = MaintenanceService.getServices(lorryId).filter((r) => r.date.startsWith(monthStr));
  const driverPays = MaintenanceService.getDriverPayments(lorryId).filter((r) => r.date.startsWith(monthStr));
  const handling = MaintenanceService.getHandlingCharges(lorryId).filter((r) => r.date.startsWith(monthStr));
  const others = MaintenanceService.getOtherExpenses(lorryId).filter((r) => r.date.startsWith(monthStr));

  const totalRepairCost = round2(problems.reduce((s, r) => s + (r.repairCost ?? 0), 0));
  const pendingProblemsCount = problems.filter((r) => r.status !== 'Completed').length;
  const serviceCost = round2(services.reduce((s, r) => s + r.totalAmount, 0));
  const driverPaymentsPaid = round2(driverPays.reduce((s, r) => s + r.amountPaid, 0));
  const driverPaymentsPending = round2(driverPays.reduce((s, r) => s + r.remainingPayable, 0));
  const loadingUnloadingCost = round2(handling.reduce((s, r) => s + r.amount, 0));
  const otherExpensesCost = round2(others.reduce((s, r) => s + r.amount, 0));

  const totalMonthlyMaintenanceAndOps = round2(
    totalRepairCost + serviceCost + driverPaymentsPaid + loadingUnloadingCost + otherExpensesCost
  );

  return {
    totalRepairCost,
    reportedProblemsCount: problems.length,
    pendingProblemsCount,
    serviceCost,
    driverPaymentsPaid,
    driverPaymentsPending,
    loadingUnloadingCost,
    otherExpensesCost,
    totalMonthlyMaintenanceAndOps,
  };
}

/**
 * Builds consolidated Cost Report strictly from saved records for `lorryId`.
 * - Includes Diesel purchases from `FuelReceiptService` ONLY ONCE (never Fuel Calculator estimates).
 * - Never counts an expense twice.
 * - Tracks Paid and Unpaid amounts separately (never treats unpaid as paid).
 */
export function buildConsolidatedCostReport(
  lorryId: string,
  mode: CostReportFilter,
  selection: {
    tripId: string;
    weekAnchor: string;
    month: string; // YYYY-MM
    year: string; // YYYY
  }
) {
  const matchesFilter = (date: string, tripId?: string): boolean => {
    if (mode === 'trip') return !!selection.tripId && tripId === selection.tripId;
    if (mode === 'weekly') {
      const { start, end } = getWeekBounds(selection.weekAnchor);
      return date >= start && date <= end;
    }
    if (mode === 'monthly') return date.startsWith(selection.month);
    return date.startsWith(selection.year);
  };

  const entries: ConsolidatedCostEntry[] = [];
  const seen = new Set<string>();
  const pushUnique = (entry: ConsolidatedCostEntry) => {
    const key = `${entry.source}:${entry.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    entries.push(entry);
  };

  // 1. Repairs (Problems)
  for (const p of MaintenanceService.getProblems(lorryId)) {
    if (!matchesFilter(p.date, p.tripId)) continue;
    const amt = p.repairCost ?? 0;
    pushUnique({
      id: p.id,
      lorryId,
      source: 'REPAIR',
      label: p.problemType,
      subtitle: `${p.location}${p.workshopName ? ` · ${p.workshopName}` : ''}`,
      date: p.date,
      amount: amt,
      paidAmount: p.paymentStatus === 'PAID' ? amt : 0,
      unpaidAmount: p.paymentStatus === 'PAID' ? 0 : amt,
      statusLabel: p.repairCost === null ? `${p.status} (Cost TBD)` : `${p.status} · ${p.paymentStatus}`,
      tripId: p.tripId,
      details: {
        'Record ID': p.id,
        Problem: p.problemType,
        Description: p.description,
        Location: p.location,
        Workshop: p.workshopName || 'Not specified',
        'Repair Status': p.status,
        'Repair Cost': p.repairCost !== null ? `₹${p.repairCost.toLocaleString('en-IN')}` : 'Pending / Unknown',
        'Payment Status': p.paymentStatus,
        'Linked Trip': p.tripId || 'Unlinked',
      },
    });
  }

  // 2. Service & Parts
  for (const s of MaintenanceService.getServices(lorryId)) {
    if (!matchesFilter(s.date, s.tripId)) continue;
    pushUnique({
      id: s.id,
      lorryId,
      source: 'SERVICE',
      label: s.serviceType,
      subtitle: `${s.serviceCentre} · ${s.partsReplaced.join(', ')}`,
      date: s.date,
      amount: s.totalAmount,
      paidAmount: s.paymentStatus === 'PAID' ? s.totalAmount : 0,
      unpaidAmount: s.paymentStatus === 'PAID' ? 0 : s.totalAmount,
      statusLabel: s.paymentStatus,
      tripId: s.tripId,
      details: {
        'Record ID': s.id,
        'Service Type': s.serviceType,
        'Service Centre': s.serviceCentre,
        Odometer: `${s.odometerKm.toLocaleString('en-IN')} km`,
        'Parts Replaced': s.partsReplaced.join(', ') || 'None',
        'Labour Charges': `₹${s.labourCharges.toLocaleString('en-IN')}`,
        'Total Service Cost': `₹${s.totalAmount.toLocaleString('en-IN')}`,
        'Next Service': s.nextServiceDate || 'Not set',
        'Payment Status': s.paymentStatus,
      },
    });
  }

  // 3. Driver Payments (Paid vs Pending balance kept strictly separate)
  for (const d of MaintenanceService.getDriverPayments(lorryId)) {
    if (!matchesFilter(d.date, d.tripId)) continue;
    const netDue = round2(d.amountPaid + d.remainingPayable);
    pushUnique({
      id: d.id,
      lorryId,
      source: 'DRIVER_PAYMENT',
      label: `Driver Payment — ${d.driverName}`,
      subtitle: `Paid ₹${d.amountPaid.toLocaleString('en-IN')} · Pending ₹${d.remainingPayable.toLocaleString('en-IN')} (${d.paymentMethod})`,
      date: d.date,
      amount: netDue,
      paidAmount: d.amountPaid,
      unpaidAmount: d.remainingPayable,
      statusLabel: d.remainingPayable > 0 ? 'PARTIAL / PENDING' : 'PAID',
      tripId: d.tripId,
      details: {
        'Record ID': d.id,
        Driver: d.driverName,
        'Monthly Salary': `₹${d.monthlySalary.toLocaleString('en-IN')}`,
        'Trip Allowance (Bata)': `₹${d.tripAllowance.toLocaleString('en-IN')}`,
        'Food Allowance': `₹${d.foodAllowance.toLocaleString('en-IN')}`,
        'Total Earnings': `₹${d.totalEarnings.toLocaleString('en-IN')}`,
        'Advance & Deductions': `₹${(d.advanceGiven + d.otherDeductions).toLocaleString('en-IN')}`,
        'Amount Paid': `₹${d.amountPaid.toLocaleString('en-IN')}`,
        'Remaining Payable': `₹${d.remainingPayable.toLocaleString('en-IN')}`,
        'Payment Method': d.paymentMethod,
      },
    });
  }

  // 4. Loading & Unloading Charges
  for (const h of MaintenanceService.getHandlingCharges(lorryId)) {
    if (!matchesFilter(h.date, h.tripId)) continue;
    pushUnique({
      id: h.id,
      lorryId,
      source: 'HANDLING',
      label: `${h.chargeType} Charges`,
      subtitle: h.location,
      date: h.date,
      amount: h.amount,
      paidAmount: h.paymentStatus === 'PAID' ? h.amount : 0,
      unpaidAmount: h.paymentStatus === 'PAID' ? 0 : h.amount,
      statusLabel: h.paymentStatus,
      tripId: h.tripId,
      details: {
        'Record ID': h.id,
        Type: `${h.chargeType} Charges`,
        Location: h.location,
        'Labour Charges': `₹${h.labourCharges.toLocaleString('en-IN')}`,
        'Total Amount': `₹${h.amount.toLocaleString('en-IN')}`,
        'Payment Status': h.paymentStatus,
        'Linked Trip': h.tripId || 'Unlinked',
      },
    });
  }

  // 5. Other Lorry Expenses
  for (const o of MaintenanceService.getOtherExpenses(lorryId)) {
    if (!matchesFilter(o.date, o.tripId)) continue;
    pushUnique({
      id: o.id,
      lorryId,
      source: 'OTHER_EXPENSE',
      label: o.expenseCategory,
      subtitle: `${o.location} · ${o.description}`,
      date: o.date,
      amount: o.amount,
      paidAmount: o.paymentStatus === 'PAID' ? o.amount : 0,
      unpaidAmount: o.paymentStatus === 'PAID' ? 0 : o.amount,
      statusLabel: o.paymentStatus,
      tripId: o.tripId,
      details: {
        'Record ID': o.id,
        Category: o.expenseCategory,
        Location: o.location,
        Description: o.description,
        Amount: `₹${o.amount.toLocaleString('en-IN')}`,
        'Payment Status': o.paymentStatus,
        'Linked Trip': o.tripId || 'Unlinked',
      },
    });
  }

  // 6. Consolidated Diesel Purchases (counted once from FuelReceiptService)
  for (const r of FuelReceiptService.getByLorryId(lorryId)) {
    if (!matchesFilter(r.receiptDate, r.tripId)) continue;
    pushUnique({
      id: r.id,
      lorryId,
      source: 'DIESEL',
      label: `Diesel Receipt — ${r.receiptNumber}`,
      subtitle: `${r.fuelStation} · ${r.dieselLitres} L @ ₹${r.pricePerLitre.toFixed(2)}/L`,
      date: r.receiptDate,
      amount: r.totalAmount,
      paidAmount: r.paymentStatus === 'PAID' ? r.totalAmount : 0,
      unpaidAmount: r.paymentStatus === 'PAID' ? 0 : r.totalAmount,
      statusLabel: r.paymentStatus,
      tripId: r.tripId,
      details: {
        'Receipt ID': r.id,
        'Receipt No.': r.receiptNumber,
        'Fuel Station': r.fuelStation,
        'Diesel Qty': `${r.dieselLitres} L`,
        'Price / L': `₹${r.pricePerLitre.toFixed(2)}`,
        'Total Amount': `₹${r.totalAmount.toLocaleString('en-IN')}`,
        'Payment Status': r.paymentStatus,
        'Linked Trip': r.tripId || 'Unassigned',
      },
    });
  }

  entries.sort((a, b) => b.date.localeCompare(a.date));

  const sumSource = (src: ConsolidatedCostEntry['source']) =>
    round2(entries.filter((e) => e.source === src).reduce((s, e) => s + e.amount, 0));

  const repairExpenses = sumSource('REPAIR');
  const serviceExpenses = sumSource('SERVICE');
  const driverPayments = sumSource('DRIVER_PAYMENT');
  const loadingUnloading = sumSource('HANDLING');
  const otherExpenses = sumSource('OTHER_EXPENSE');
  const dieselExpenses = sumSource('DIESEL');
  const totalOperatingExpenses = round2(
    repairExpenses + serviceExpenses + driverPayments + loadingUnloading + otherExpenses + dieselExpenses
  );
  const totalPaid = round2(entries.reduce((s, e) => s + e.paidAmount, 0));
  const totalUnpaid = round2(entries.reduce((s, e) => s + e.unpaidAmount, 0));

  return {
    entries,
    totals: {
      repairExpenses,
      serviceExpenses,
      driverPayments,
      loadingUnloading,
      otherExpenses,
      dieselExpenses,
      totalOperatingExpenses,
      totalPaid,
      totalUnpaid,
    },
  };
}
