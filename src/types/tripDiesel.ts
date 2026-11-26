export type TripStatus = 'Completed' | 'In Transit' | 'Scheduled';

export type TripPeriodMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * One completed or active trip's actual recorded diesel consumption and expense.
 * Strictly scoped by `lorryId` and kept separate from Fuel Calculator estimates.
 */
export interface TripDieselRecord {
  id: string; // e.g. TRP-2026-101
  lorryId: string;
  startLocation: string;
  destination: string;
  tripDate: string; // YYYY-MM-DD
  distanceKm: number;
  dieselLitres: number;
  dieselPricePerL: number;
  /** Exact formula: dieselLitres x dieselPricePerL (rounded to 2 decimal places) */
  totalDieselCost: number;
  status: TripStatus;
  driverName: string;
  fuelStation: string;
  receiptNo: string;
  notes?: string;
}

export interface TripDieselSummary {
  totalTrips: number;
  totalDistanceKm: number;
  totalDieselLitres: number;
  totalDieselExpense: number;
}

export interface TripChartPoint {
  key: string;
  label: string;
  expense: number;
  litres: number;
  trips: number;
}
