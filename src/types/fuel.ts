export type VerificationStatus = 'Verified' | 'Pending' | 'Flagged';
export type FuelPaymentMode = 'Fleet Card' | 'FASTag Wallet' | 'UPI' | 'Cash';

/** One diesel purchase. `lorryId` links it to a lorry in LorryService. */
export interface FuelLedgerEntry {
  id: string;
  lorryId: string;
  date: string; // ISO UTC
  station: string;
  litres: number;
  ratePerLitre: number;
  amount: number; // litres x rate, rounded to paise
  odometerKm: number;
  distanceKm: number; // distance covered since the previous fill
  fullTank: boolean;
  receiptNo: string;
  paymentMode: FuelPaymentMode;
  verification: VerificationStatus;
  flagReason?: string;
}

export interface FuelFilters {
  lorryId: 'ALL' | string;
  from: string; // YYYY-MM-DD, '' = unbounded
  to: string; // YYYY-MM-DD, '' = unbounded
}

export interface LorryOption {
  id: string;
  label: string;
}

export interface FuelSummary {
  fills: number;
  fullTankFills: number;
  partialFills: number;
  litres: number;
  spend: number;
  distanceKm: number;
  /** Full-tank fills only: distance / litres. null when there is no full-tank data. */
  avgMileage: number | null;
  /** Spend / distance across all fills. */
  costPerKm: number | null;
  avgRate: number | null;
}

export interface PeriodPoint extends FuelSummary {
  key: string;
  label: string;
  mileage: number | null;
}
