export type StationBrand = 'IndianOil' | 'HP' | 'Bharat Petroleum' | 'Reliance' | 'Shell' | 'Nayara' | 'Other';

export type MileageCalculationStatus = 
  | 'FULL_TANK_VERIFIED' 
  | 'ESTIMATE_PARTIAL' 
  | 'INSUFFICIENT_DATA';

export interface DieselEntry {
  id: string;
  date: string; // ISO 8601 UTC
  truckId: string;
  truckNumber: string; // e.g. "MH 12 RN 4821"
  truckModel: string; // e.g. "Tata Signa 4825.TK"
  driverName: string;
  liters: number;
  ratePerLiter: number;
  totalAmount: number;
  fuelStation: string;
  stationBrand: StationBrand;
  odometerReadingKm: number;
  distanceSinceLastFuelKm?: number;
  tripReference?: string;
  isFullTank: boolean;
  calculatedMileage?: number; // km/L
  mileageStatus: MileageCalculationStatus;
  receiptNumber?: string;
  paymentMode: 'FLEET_CARD' | 'UPI' | 'CASH' | 'FASTAG_WALLET';
  notes?: string;
}

export interface TruckDieselUsage {
  truckId: string;
  truckNumber: string;
  truckModel: string;
  truckType: string; // e.g. "Multi-Axle Tipper", "32ft Container"
  driverAssigned: string;
  totalLiters: number;
  totalCost: number;
  totalDistanceKm: number;
  averageMileage: number; // km/L
  targetMileage: number; // km/L target
  costPerKm: number; // ₹/km
  usagePercentage: number; // % of total fleet consumption
  performanceStatus: 'optimal' | 'warning' | 'critical';
  entriesCount: number;
  lastFuelDate: string;
}

export interface DieselSummaryMetrics {
  totalDieselLiters: number;
  totalDieselCost: number;
  averageMileageKmPerL: number;
  averageCostPerKm: number;
  totalDistanceTravelledKm: number;
  fullTankEntriesCount: number;
  partialEntriesCount: number;
  litersDeltaPct: number;
  costDeltaPct: number;
  mileageDeltaPct: number;
  costPerKmDeltaPct: number;
}

export interface DieselConsumptionPoint {
  date: string;
  label: string; // e.g. "20 Nov"
  liters: number;
  cost: number;
  distanceKm: number;
  averageRate: number;
}

export interface FuelStationSummary {
  stationName: string;
  brand: StationBrand;
  location: string;
  totalLiters: number;
  totalAmount: number;
  averageRate: number;
  transactionsCount: number;
}

export interface MileageTargetSetting {
  truckId: string;
  truckNumber: string;
  currentTarget: number;
  minAcceptableTarget: number;
  driverIncentiveBonus?: number;
}
