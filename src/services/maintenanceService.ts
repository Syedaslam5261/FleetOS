import {
  DriverPaymentRecord,
  HandlingChargeRecord,
  LoadDetailRecord,
  OtherExpenseRecord,
  ProblemRecord,
  ServicePartRecord,
} from '../types/maintenance';

type Listener = () => void;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Exact Driver Payment calculation rules:
 * Total Earnings = Salary + Trip Allowance + Food Allowance + Other Earnings
 * Remaining Payable = Total Earnings - Advances - Deductions - Payments Already Made
 */
export function calculateDriverPaymentTotals(input: {
  monthlySalary: number;
  tripAllowance: number;
  foodAllowance: number;
  otherEarnings: number;
  advanceGiven: number;
  otherDeductions: number;
  amountPaid: number;
}) {
  const totalEarnings = round2(
    input.monthlySalary + input.tripAllowance + input.foodAllowance + input.otherEarnings
  );
  const netPayableBeforePayment = round2(
    totalEarnings - input.advanceGiven - input.otherDeductions
  );
  const remainingPayable = round2(Math.max(0, netPayableBeforePayment - input.amountPaid));
  return { totalEarnings, remainingPayable };
}

const nowIso = '2026-11-26T10:00:00.000Z';

const SEED_PROBLEMS: ProblemRecord[] = [
  {
    id: 'PRB-2026-001',
    lorryId: 'LR-001',
    category: 'REPAIR',
    problemType: 'Brake problem',
    description: 'Air brake pressure dropping near Kolhapur ghat section; rear brake liner worn out.',
    date: '2026-11-24',
    location: 'Kolhapur Bypass, NH-48, MH',
    workshopName: 'Shree Ganesh Heavy Truck Works',
    repairCost: 6800,
    status: 'Completed',
    paymentStatus: 'PAID',
    tripId: 'TRP-2026-101',
    createdAt: '2026-11-24T12:30:00.000Z',
    updatedAt: '2026-11-24T17:00:00.000Z',
  },
  {
    id: 'PRB-2026-002',
    lorryId: 'LR-001',
    category: 'REPAIR',
    problemType: 'Tyre problem',
    description: 'Rear left outer tyre side-wall bulge noticed during check at Tumakuru.',
    date: '2026-11-25',
    location: 'Tumakuru, NH-48, Karnataka',
    workshopName: 'Highway MRF Tyre Care',
    repairCost: null, // Unknown cost while pending!
    status: 'Pending',
    paymentStatus: 'UNPAID',
    tripId: 'TRP-2026-101',
    createdAt: '2026-11-25T15:00:00.000Z',
    updatedAt: '2026-11-25T15:00:00.000Z',
  },
  {
    id: 'PRB-2026-003',
    lorryId: 'LR-001',
    category: 'REPAIR',
    problemType: 'Electrical problem',
    description: 'Alternator belt loose causing battery warning light on Pune–Hyderabad run.',
    date: '2026-11-17',
    location: 'Solapur Highway, MH',
    workshopName: 'National Auto Electricals',
    repairCost: 2450,
    status: 'Completed',
    paymentStatus: 'PAID',
    tripId: 'TRP-2026-098',
    createdAt: '2026-11-17T10:00:00.000Z',
    updatedAt: '2026-11-17T13:00:00.000Z',
  },
  {
    id: 'PRB-2026-004',
    lorryId: 'LR-002',
    category: 'REPAIR',
    problemType: 'Clutch problem',
    description: 'Clutch pedal slipping under full load near Vapi.',
    date: '2026-11-24',
    location: 'Vapi Industrial Area, Gujarat',
    workshopName: 'Gujarat Leyland Workshop',
    repairCost: 11500,
    status: 'In Progress',
    paymentStatus: 'UNPAID',
    tripId: 'TRP-2026-204',
    createdAt: '2026-11-24T11:00:00.000Z',
    updatedAt: '2026-11-25T09:00:00.000Z',
  },
  {
    id: 'PRB-2026-005',
    lorryId: 'LR-003',
    category: 'REPAIR',
    problemType: 'Engine problem',
    description: 'Coolant hose leak and overheating warning near Hosur.',
    date: '2026-11-23',
    location: 'Hosur NH-44, TN',
    workshopName: 'BharatBenz Authorised Workshop, Peenya',
    repairCost: 14200,
    status: 'In Progress',
    paymentStatus: 'UNPAID',
    tripId: 'TRP-2026-305',
    createdAt: nowIso,
    updatedAt: nowIso,
  },
];

const SEED_SERVICES: ServicePartRecord[] = [
  {
    id: 'SRV-2026-001',
    lorryId: 'LR-001',
    category: 'SERVICE',
    date: '2026-11-08',
    odometerKm: 140500,
    serviceCentre: 'Tata Authorised Commercial Service, Pune',
    serviceType: 'Periodic 140,000 km Service',
    partsReplaced: ['Engine oil', 'Oil filter', 'Air filter', 'Brake pads'],
    labourCharges: 3200,
    totalAmount: 16400,
    nextServiceDate: '2027-02-08',
    nextServiceKm: 150500,
    paymentStatus: 'PAID',
    createdAt: '2026-11-08T14:00:00.000Z',
    updatedAt: '2026-11-08T14:00:00.000Z',
  },
  {
    id: 'SRV-2026-002',
    lorryId: 'LR-002',
    category: 'SERVICE',
    date: '2026-11-10',
    odometerKm: 97200,
    serviceCentre: 'Ashok Leyland Service, Surat',
    serviceType: 'Regular Engine & Filter Service',
    partsReplaced: ['Engine oil', 'Oil filter', 'Air filter'],
    labourCharges: 2400,
    totalAmount: 11800,
    nextServiceDate: '2027-02-10',
    nextServiceKm: 107200,
    paymentStatus: 'PAID',
    createdAt: '2026-11-10T11:00:00.000Z',
    updatedAt: '2026-11-10T11:00:00.000Z',
  },
];

const SEED_DRIVER_PAYMENTS: DriverPaymentRecord[] = [
  {
    id: 'DPY-2026-001',
    lorryId: 'LR-001',
    category: 'DRIVER_PAYMENT',
    driverName: 'Sukhwinder Singh',
    date: '2026-11-25',
    monthlySalary: 22000,
    tripAllowance: 4500,
    foodAllowance: 2500,
    otherEarnings: 0,
    advanceGiven: 5000,
    otherDeductions: 0,
    amountPaid: 18000,
    totalEarnings: 29000,
    remainingPayable: 6000,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'UNPAID',
    tripId: 'TRP-2026-101',
    notes: 'November salary + Mumbai-Bengaluru trip bata (₹6,000 balance pending on delivery)',
    createdAt: '2026-11-25T10:00:00.000Z',
    updatedAt: '2026-11-25T10:00:00.000Z',
  },
  {
    id: 'DPY-2026-002',
    lorryId: 'LR-001',
    category: 'DRIVER_PAYMENT',
    driverName: 'Sukhwinder Singh',
    date: '2026-10-30',
    monthlySalary: 22000,
    tripAllowance: 4000,
    foodAllowance: 2000,
    otherEarnings: 0,
    advanceGiven: 3000,
    otherDeductions: 0,
    amountPaid: 25000,
    totalEarnings: 28000,
    remainingPayable: 0,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'PAID',
    createdAt: '2026-10-30T16:00:00.000Z',
    updatedAt: '2026-10-30T16:00:00.000Z',
  },
  {
    id: 'DPY-2026-003',
    lorryId: 'LR-002',
    category: 'DRIVER_PAYMENT',
    driverName: 'Rajesh Sharma',
    date: '2026-11-24',
    monthlySalary: 20000,
    tripAllowance: 3000,
    foodAllowance: 2000,
    otherEarnings: 0,
    advanceGiven: 2000,
    otherDeductions: 0,
    amountPaid: 23000,
    totalEarnings: 25000,
    remainingPayable: 0,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    tripId: 'TRP-2026-204',
    createdAt: '2026-11-24T18:00:00.000Z',
    updatedAt: '2026-11-24T18:00:00.000Z',
  },
];

const SEED_LOAD_DETAILS: LoadDetailRecord[] = [
  {
    id: 'LOD-2026-001',
    lorryId: 'LR-001',
    category: 'LOAD_DETAIL',
    tripId: 'TRP-2026-101',
    goodsType: 'FMCG Packaged Cartons',
    quantity: '480 Cartons',
    weightTonnes: 24.5,
    pickupLocation: 'Bhiwandi Logistics Park, Mumbai',
    destination: 'Nelamangala Hub, Bengaluru',
    customerName: 'Reliance Retail Supply Chain',
    date: '2026-11-23',
    createdAt: '2026-11-23T07:00:00.000Z',
    updatedAt: '2026-11-23T07:00:00.000Z',
  },
  {
    id: 'LOD-2026-002',
    lorryId: 'LR-002',
    category: 'LOAD_DETAIL',
    tripId: 'TRP-2026-204',
    goodsType: 'Textile Rolls',
    quantity: '320 Bales',
    weightTonnes: 16.0,
    pickupLocation: 'Pandesara GIDC, Surat',
    destination: 'Kalamboli Warehouse, Navi Mumbai',
    customerName: 'Arvind Textiles Ltd',
    date: '2026-11-24',
    createdAt: '2026-11-24T08:00:00.000Z',
    updatedAt: '2026-11-24T08:00:00.000Z',
  },
];

const SEED_HANDLING: HandlingChargeRecord[] = [
  {
    id: 'HND-2026-001',
    lorryId: 'LR-001',
    category: 'HANDLING',
    chargeType: 'Loading',
    date: '2026-11-23',
    location: 'Bhiwandi Logistics Park, Mumbai',
    labourCharges: 1800,
    amount: 2400,
    paymentStatus: 'PAID',
    tripId: 'TRP-2026-101',
    createdAt: '2026-11-23T08:00:00.000Z',
    updatedAt: '2026-11-23T08:00:00.000Z',
  },
  {
    id: 'HND-2026-002',
    lorryId: 'LR-001',
    category: 'HANDLING',
    chargeType: 'Unloading',
    date: '2026-11-26',
    location: 'Nelamangala Hub, Bengaluru',
    labourCharges: 1600,
    amount: 2100,
    paymentStatus: 'UNPAID',
    tripId: 'TRP-2026-101',
    createdAt: '2026-11-26T09:00:00.000Z',
    updatedAt: '2026-11-26T09:00:00.000Z',
  },
  {
    id: 'HND-2026-003',
    lorryId: 'LR-002',
    category: 'HANDLING',
    chargeType: 'Loading',
    date: '2026-11-24',
    location: 'Pandesara GIDC, Surat',
    labourCharges: 1200,
    amount: 1600,
    paymentStatus: 'PAID',
    tripId: 'TRP-2026-204',
    createdAt: '2026-11-24T09:00:00.000Z',
    updatedAt: '2026-11-24T09:00:00.000Z',
  },
];

const SEED_OTHER_EXPENSES: OtherExpenseRecord[] = [
  {
    id: 'OEX-2026-001',
    lorryId: 'LR-001',
    category: 'OTHER_EXPENSE',
    expenseCategory: 'Toll charges',
    date: '2026-11-24',
    location: 'NH-48 Mumbai–Bengaluru Corridor',
    amount: 4650,
    description: 'FASTag highway tolls across Maharashtra & Karnataka plazas',
    paymentStatus: 'PAID',
    tripId: 'TRP-2026-101',
    createdAt: '2026-11-24T20:00:00.000Z',
    updatedAt: '2026-11-24T20:00:00.000Z',
  },
  {
    id: 'OEX-2026-002',
    lorryId: 'LR-001',
    category: 'OTHER_EXPENSE',
    expenseCategory: 'Parking',
    date: '2026-11-25',
    location: 'Tumakuru Transport Yard',
    amount: 450,
    description: 'Overnight secure truck yard parking',
    paymentStatus: 'PAID',
    tripId: 'TRP-2026-101',
    createdAt: '2026-11-25T21:00:00.000Z',
    updatedAt: '2026-11-25T21:00:00.000Z',
  },
  {
    id: 'OEX-2026-003',
    lorryId: 'LR-001',
    category: 'OTHER_EXPENSE',
    expenseCategory: 'Truck washing',
    date: '2026-11-19',
    location: 'Nigdi Yard, Pune',
    amount: 800,
    description: 'Full body and chassis wash after Hyderabad trip',
    paymentStatus: 'PAID',
    tripId: 'TRP-2026-098',
    createdAt: '2026-11-19T18:00:00.000Z',
    updatedAt: '2026-11-19T18:00:00.000Z',
  },
  {
    id: 'OEX-2026-004',
    lorryId: 'LR-002',
    category: 'OTHER_EXPENSE',
    expenseCategory: 'Permits',
    date: '2026-11-24',
    location: 'Gujarat–Maharashtra Border Checkpost',
    amount: 1200,
    description: 'State entry permit renewal fee',
    paymentStatus: 'PAID',
    tripId: 'TRP-2026-204',
    createdAt: '2026-11-24T12:00:00.000Z',
    updatedAt: '2026-11-24T12:00:00.000Z',
  },
];

/**
 * Reactive in-memory demo store for Maintenance & Lorry Cost Management.
 * Every record is strictly scoped by `lorryId` with unique monotonic IDs and timestamps.
 * Temporary browser session data until FastAPI + MySQL backend is connected.
 */
class MaintenanceServiceClass {
  private problems: ProblemRecord[] = [...SEED_PROBLEMS];
  private services: ServicePartRecord[] = [...SEED_SERVICES];
  private driverPayments: DriverPaymentRecord[] = [...SEED_DRIVER_PAYMENTS];
  private loadDetails: LoadDetailRecord[] = [...SEED_LOAD_DETAILS];
  private handlingCharges: HandlingChargeRecord[] = [...SEED_HANDLING];
  private otherExpenses: OtherExpenseRecord[] = [...SEED_OTHER_EXPENSES];
  private listeners: Set<Listener> = new Set();
  private seq = 100;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private nextId(prefix: string) {
    return `${prefix}-2026-${String(this.seq++).padStart(3, '0')}`;
  }

  // --- Problems & Repairs ---
  getProblems(lorryId: string): ProblemRecord[] {
    return this.problems
      .filter((r) => r.lorryId === lorryId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }

  addProblem(
    data: Omit<ProblemRecord, 'id' | 'category' | 'createdAt' | 'updatedAt'>
  ): ProblemRecord {
    const ts = new Date().toISOString();
    const record: ProblemRecord = {
      ...data,
      id: this.nextId('PRB'),
      category: 'REPAIR',
      repairCost: data.repairCost !== null && Number.isFinite(data.repairCost) ? round2(data.repairCost) : null,
      createdAt: ts,
      updatedAt: ts,
    };
    this.problems.unshift(record);
    this.notify();
    return record;
  }

  updateProblem(
    id: string,
    updates: Partial<Omit<ProblemRecord, 'id' | 'lorryId' | 'category' | 'createdAt'>>
  ): ProblemRecord {
    const idx = this.problems.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Problem record not found.');
    const updated: ProblemRecord = {
      ...this.problems[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.problems[idx] = updated;
    this.notify();
    return updated;
  }

  deleteProblem(id: string): void {
    this.problems = this.problems.filter((p) => p.id !== id);
    this.notify();
  }

  // --- Service & Parts ---
  getServices(lorryId: string): ServicePartRecord[] {
    return this.services
      .filter((r) => r.lorryId === lorryId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  addService(
    data: Omit<ServicePartRecord, 'id' | 'category' | 'createdAt' | 'updatedAt'>
  ): ServicePartRecord {
    const ts = new Date().toISOString();
    const record: ServicePartRecord = {
      ...data,
      id: this.nextId('SRV'),
      category: 'SERVICE',
      labourCharges: round2(data.labourCharges),
      totalAmount: round2(data.totalAmount),
      createdAt: ts,
      updatedAt: ts,
    };
    this.services.unshift(record);
    this.notify();
    return record;
  }

  deleteService(id: string): void {
    this.services = this.services.filter((s) => s.id !== id);
    this.notify();
  }

  // --- Driver Payments ---
  getDriverPayments(lorryId: string): DriverPaymentRecord[] {
    return this.driverPayments
      .filter((r) => r.lorryId === lorryId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  addDriverPayment(
    data: Omit<
      DriverPaymentRecord,
      'id' | 'category' | 'totalEarnings' | 'remainingPayable' | 'paymentStatus' | 'createdAt' | 'updatedAt'
    >
  ): DriverPaymentRecord {
    const ts = new Date().toISOString();
    const { totalEarnings, remainingPayable } = calculateDriverPaymentTotals(data);
    const record: DriverPaymentRecord = {
      ...data,
      id: this.nextId('DPY'),
      category: 'DRIVER_PAYMENT',
      totalEarnings,
      remainingPayable,
      paymentStatus: remainingPayable <= 0 ? 'PAID' : 'UNPAID',
      createdAt: ts,
      updatedAt: ts,
    };
    this.driverPayments.unshift(record);
    this.notify();
    return record;
  }

  settleDriverPayment(id: string): DriverPaymentRecord {
    const idx = this.driverPayments.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Driver payment record not found.');
    const curr = this.driverPayments[idx];
    const updated: DriverPaymentRecord = {
      ...curr,
      amountPaid: round2(curr.amountPaid + curr.remainingPayable),
      remainingPayable: 0,
      paymentStatus: 'PAID',
      updatedAt: new Date().toISOString(),
    };
    this.driverPayments[idx] = updated;
    this.notify();
    return updated;
  }

  deleteDriverPayment(id: string): void {
    this.driverPayments = this.driverPayments.filter((p) => p.id !== id);
    this.notify();
  }

  // --- Load & Handling Expenses ---
  getLoadDetails(lorryId: string): LoadDetailRecord[] {
    return this.loadDetails
      .filter((r) => r.lorryId === lorryId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  addLoadDetail(
    data: Omit<LoadDetailRecord, 'id' | 'category' | 'createdAt' | 'updatedAt'>
  ): LoadDetailRecord {
    const ts = new Date().toISOString();
    const record: LoadDetailRecord = {
      ...data,
      id: this.nextId('LOD'),
      category: 'LOAD_DETAIL',
      createdAt: ts,
      updatedAt: ts,
    };
    this.loadDetails.unshift(record);
    this.notify();
    return record;
  }

  getHandlingCharges(lorryId: string): HandlingChargeRecord[] {
    return this.handlingCharges
      .filter((r) => r.lorryId === lorryId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  addHandlingCharge(
    data: Omit<HandlingChargeRecord, 'id' | 'category' | 'createdAt' | 'updatedAt'>
  ): HandlingChargeRecord {
    const ts = new Date().toISOString();
    const record: HandlingChargeRecord = {
      ...data,
      id: this.nextId('HND'),
      category: 'HANDLING',
      labourCharges: round2(data.labourCharges),
      amount: round2(data.amount),
      createdAt: ts,
      updatedAt: ts,
    };
    this.handlingCharges.unshift(record);
    this.notify();
    return record;
  }

  markHandlingPaid(id: string): void {
    const idx = this.handlingCharges.findIndex((h) => h.id === id);
    if (idx >= 0) {
      this.handlingCharges[idx] = {
        ...this.handlingCharges[idx],
        paymentStatus: 'PAID',
        updatedAt: new Date().toISOString(),
      };
      this.notify();
    }
  }

  deleteHandlingCharge(id: string): void {
    this.handlingCharges = this.handlingCharges.filter((h) => h.id !== id);
    this.notify();
  }

  // --- Other Lorry Expenses ---
  getOtherExpenses(lorryId: string): OtherExpenseRecord[] {
    return this.otherExpenses
      .filter((r) => r.lorryId === lorryId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  addOtherExpense(
    data: Omit<OtherExpenseRecord, 'id' | 'category' | 'createdAt' | 'updatedAt'>
  ): OtherExpenseRecord {
    const ts = new Date().toISOString();
    const record: OtherExpenseRecord = {
      ...data,
      id: this.nextId('OEX'),
      category: 'OTHER_EXPENSE',
      amount: round2(data.amount),
      createdAt: ts,
      updatedAt: ts,
    };
    this.otherExpenses.unshift(record);
    this.notify();
    return record;
  }

  markOtherExpensePaid(id: string): void {
    const idx = this.otherExpenses.findIndex((e) => e.id === id);
    if (idx >= 0) {
      this.otherExpenses[idx] = {
        ...this.otherExpenses[idx],
        paymentStatus: 'PAID',
        updatedAt: new Date().toISOString(),
      };
      this.notify();
    }
  }

  deleteOtherExpense(id: string): void {
    this.otherExpenses = this.otherExpenses.filter((e) => e.id !== id);
    this.notify();
  }
}

export const MaintenanceService = new MaintenanceServiceClass();
