export type MaintenancePaymentStatus = 'PAID' | 'UNPAID';
export type MaintenancePaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';

export type ProblemType =
  | 'Engine problem'
  | 'Tyre problem'
  | 'Brake problem'
  | 'Battery problem'
  | 'Clutch problem'
  | 'Gearbox problem'
  | 'Electrical problem'
  | 'Accident damage'
  | 'Other';

export type RepairStatus = 'Pending' | 'In Progress' | 'Completed';

export interface ProblemRecord {
  id: string;
  lorryId: string;
  category: 'REPAIR';
  problemType: ProblemType;
  description: string;
  date: string; // YYYY-MM-DD
  location: string;
  workshopName?: string;
  /** null or undefined when repair cost is not yet known (e.g. Pending repair) */
  repairCost: number | null;
  status: RepairStatus;
  paymentStatus: MaintenancePaymentStatus;
  tripId?: string;
  attachmentDataUrl?: string;
  attachmentName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServicePartOption =
  | 'Engine oil'
  | 'Oil filter'
  | 'Air filter'
  | 'Brake pads'
  | 'Tyres'
  | 'Battery'
  | 'Clutch'
  | 'Other';

export interface ServicePartRecord {
  id: string;
  lorryId: string;
  category: 'SERVICE';
  date: string; // YYYY-MM-DD
  odometerKm: number;
  serviceCentre: string;
  serviceType: string;
  partsReplaced: string[];
  labourCharges: number;
  totalAmount: number;
  nextServiceDate?: string;
  nextServiceKm?: number;
  paymentStatus: MaintenancePaymentStatus;
  tripId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverPaymentRecord {
  id: string;
  lorryId: string;
  category: 'DRIVER_PAYMENT';
  driverName: string;
  date: string; // YYYY-MM-DD
  monthlySalary: number;
  tripAllowance: number; // bata
  foodAllowance: number;
  otherEarnings: number;
  advanceGiven: number;
  otherDeductions: number;
  amountPaid: number;
  /** Salary + Trip Allowance + Food Allowance + Other Earnings */
  totalEarnings: number;
  /** Total Earnings - Advances - Deductions - Payments Already Made */
  remainingPayable: number;
  paymentMethod: MaintenancePaymentMethod;
  paymentStatus: MaintenancePaymentStatus;
  tripId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoadDetailRecord {
  id: string;
  lorryId: string;
  category: 'LOAD_DETAIL';
  tripId: string;
  goodsType: string;
  quantity: string;
  weightTonnes: number;
  pickupLocation: string;
  destination: string;
  customerName: string;
  date: string; // YYYY-MM-DD (loading date)
  createdAt: string;
  updatedAt: string;
}

export type HandlingChargeType = 'Loading' | 'Unloading';

export interface HandlingChargeRecord {
  id: string;
  lorryId: string;
  category: 'HANDLING';
  chargeType: HandlingChargeType;
  date: string; // YYYY-MM-DD
  location: string;
  labourCharges: number;
  amount: number;
  paymentStatus: MaintenancePaymentStatus;
  tripId?: string;
  attachmentDataUrl?: string;
  attachmentName?: string;
  createdAt: string;
  updatedAt: string;
}

export type OtherExpenseCategory =
  | 'Toll charges'
  | 'Parking'
  | 'Truck washing'
  | 'Roadside expenses'
  | 'Permits'
  | 'Penalties'
  | 'Miscellaneous';

export interface OtherExpenseRecord {
  id: string;
  lorryId: string;
  category: 'OTHER_EXPENSE';
  expenseCategory: OtherExpenseCategory;
  date: string; // YYYY-MM-DD
  location: string;
  amount: number;
  description: string;
  paymentStatus: MaintenancePaymentStatus;
  tripId?: string;
  attachmentDataUrl?: string;
  attachmentName?: string;
  createdAt: string;
  updatedAt: string;
}

export type CostReportFilter = 'trip' | 'weekly' | 'monthly' | 'yearly';

export interface ConsolidatedCostEntry {
  id: string;
  lorryId: string;
  source: 'REPAIR' | 'SERVICE' | 'DRIVER_PAYMENT' | 'HANDLING' | 'OTHER_EXPENSE' | 'DIESEL';
  label: string;
  subtitle: string;
  date: string;
  amount: number;
  paidAmount: number;
  unpaidAmount: number;
  statusLabel: string;
  tripId?: string;
  details: Record<string, string>;
}
