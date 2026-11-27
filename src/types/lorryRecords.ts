export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';
export type MaintenanceType = 'Service' | 'Repair' | 'Tyres' | 'Inspection';
export type ExpenseCategory = 'Toll' | 'Driver Allowance' | 'Parking' | 'Loading / Unloading' | 'Other';

export interface LorryLocationReport {
  lorryId: string;
  place: string;
  lat: number;
  lng: number;
  reportedAt: string; // ISO UTC
  source: string; // e.g. "Driver check-in" (never live GPS in this demo)
  route?: { from: string; to: string; tripRef: string; eta?: string };
}

export interface LorryInvoice {
  id: string;
  lorryId: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  client: string;
  tripRef: string;
  /** Agreed freight amount (₹) */
  amount: number;
  /** Optional recorded additional charges (detention, halting, extra drop) */
  additionalCharges?: number;
  /** Explicit customer cash received so far (for partial payments; never inferred for unpaid) */
  amountReceived?: number;
  status: InvoiceStatus;
}

export interface LorryDieselRecord {
  id: string;
  lorryId: string;
  date: string;
  station: string;
  litres: number;
  ratePerLitre: number;
  amount: number;
  odometerKm: number;
  distanceKm: number; // distance since previous fill
  fullTank: boolean;
}

export interface LorryMaintenanceRecord {
  id: string;
  lorryId: string;
  date: string;
  type: MaintenanceType;
  description: string;
  workshop: string;
  cost: number;
  odometerKm: number;
}

export interface LorryNextService {
  lorryId: string;
  dueDate: string;
  dueOdometerKm: number;
  description: string;
}

export interface LorryExpense {
  id: string;
  lorryId: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  tripRef?: string;
  note: string;
}
